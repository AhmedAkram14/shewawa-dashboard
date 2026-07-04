-- =============================================================================
-- Migration 047: Rich delivery outcomes
--
-- Replaces the binary delivered/failed + failure_reason pair with six explicit
-- outcome values that encode the business reason and drive distinct rules:
--
--   delivered          → order: delivered      | no stock movement
--   customer_not_home  → order: delivery_failed | no stock movement (re-queue)
--   wrong_address      → order: delivery_failed | no stock movement (re-queue)
--   other              → order: delivery_failed | no stock movement (re-queue)
--   customer_refused   → order: refused         | release alloc → stock (customer_refusal)
--   customer_cancelled → order: refused         | release alloc → stock (customer_cancellation)
--
-- New order statuses:
--   delivery_failed  — temporary; order awaits next delivery batch
--   refused          — terminal; customer rejected at door after production
-- =============================================================================

-- ── 1. Widen orders.status constraint ────────────────────────────────────────
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'ready', 'out_for_delivery',
    'delivered', 'cancelled',
    'delivery_failed', 'refused'
  ));

-- ── 2. Migrate existing failed rows to granular outcomes ──────────────────────
UPDATE public.delivery_order_results
SET outcome = CASE failure_reason
    WHEN 'refused'           THEN 'customer_refused'
    WHEN 'customer_not_home' THEN 'customer_not_home'
    WHEN 'no_answer'         THEN 'customer_not_home'
    WHEN 'rescheduled'       THEN 'customer_not_home'
    ELSE                          'other'
  END
WHERE outcome = 'failed';

-- ── 3. Swap outcome CHECK constraint ─────────────────────────────────────────
ALTER TABLE public.delivery_order_results
  DROP CONSTRAINT IF EXISTS delivery_order_results_outcome_check;
ALTER TABLE public.delivery_order_results
  ADD CONSTRAINT delivery_order_results_outcome_check
  CHECK (outcome IN (
    'delivered',
    'customer_not_home',
    'wrong_address',
    'customer_refused',
    'customer_cancelled',
    'other'
  ));

-- ── 4. Drop now-redundant failure_reason column ───────────────────────────────
-- outcome now fully encodes the reason; courier_notes carries free text.
ALTER TABLE public.delivery_order_results
  DROP COLUMN IF EXISTS failure_reason;

-- ── 5. Widen available_stock.source constraint ────────────────────────────────
ALTER TABLE public.available_stock
  DROP CONSTRAINT IF EXISTS available_stock_source_check;
ALTER TABLE public.available_stock
  ADD CONSTRAINT available_stock_source_check
  CHECK (source IN (
    'factory_surplus', 'cancellation', 'manual',
    'customer_refusal', 'customer_cancellation'
  ));

-- ── 6. Update create_delivery to accept delivery_failed orders ────────────────
DROP FUNCTION IF EXISTS public.create_delivery(uuid[], text);

CREATE OR REPLACE FUNCTION public.create_delivery(
  p_order_ids uuid[],
  p_notes     text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_delivery_id     uuid;
  v_delivery_number integer;
  v_bid             uuid := get_my_business_id();
  v_count           integer;
  v_affected        integer;
BEGIN
  IF p_order_ids IS NULL OR array_length(p_order_ids, 1) = 0 THEN
    RAISE EXCEPTION 'create_delivery: at least one order is required';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM orders
  WHERE id = ANY(p_order_ids)
    AND business_id = v_bid
    AND status IN ('ready', 'delivery_failed');

  IF v_count != array_length(p_order_ids, 1) THEN
    RAISE EXCEPTION 'create_delivery: one or more orders are not ready or retriable';
  END IF;

  INSERT INTO business_counters (business_id, delivery_count)
  VALUES (v_bid, 1)
  ON CONFLICT (business_id) DO UPDATE
    SET delivery_count = business_counters.delivery_count + 1
  RETURNING delivery_count INTO v_delivery_number;

  INSERT INTO deliveries (delivery_number, notes)
  VALUES (v_delivery_number, p_notes)
  RETURNING id INTO v_delivery_id;

  UPDATE orders
  SET status      = 'out_for_delivery',
      delivery_id = v_delivery_id
  WHERE id = ANY(p_order_ids)
    AND business_id = v_bid
    AND status IN ('ready', 'delivery_failed');

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != array_length(p_order_ids, 1) THEN
    RAISE EXCEPTION 'create_delivery: concurrency conflict — some orders changed status';
  END IF;

  RETURN v_delivery_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_delivery(uuid[], text) TO authenticated;

-- ── 7. Replace complete_delivery with outcome-aware version ───────────────────
DROP FUNCTION IF EXISTS public.complete_delivery(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.complete_delivery(
  p_delivery_id uuid,
  p_outcomes    jsonb DEFAULT '[]'
  -- Each element: { "order_id": "uuid", "outcome": "<value>", "notes": "text|null" }
  -- Orders absent from p_outcomes default to "delivered".
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid         uuid;
  v_del_status  text;
  v_order       RECORD;
  v_outcome     text;
  v_notes       text;
  v_release_src text;
  v_order_num   integer;
BEGIN
  v_bid := get_my_business_id();

  SELECT status INTO v_del_status
  FROM deliveries
  WHERE id = p_delivery_id AND business_id = v_bid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'complete_delivery: delivery not found';
  END IF;

  IF v_del_status NOT IN ('pending', 'dispatched') THEN
    RAISE EXCEPTION 'complete_delivery: delivery is already %', v_del_status;
  END IF;

  -- Validate all supplied order_ids belong to this delivery
  IF jsonb_array_length(p_outcomes) > 0 THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_outcomes) AS elem
      WHERE NOT EXISTS (
        SELECT 1 FROM orders
        WHERE id          = (elem ->> 'order_id')::uuid
          AND delivery_id = p_delivery_id
          AND business_id = v_bid
          AND status      = 'out_for_delivery'
      )
    ) THEN
      RAISE EXCEPTION 'complete_delivery: some order IDs do not belong to this delivery';
    END IF;
  END IF;

  -- Validate all supplied outcome values
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_outcomes) AS elem
    WHERE (elem ->> 'outcome') NOT IN (
      'delivered', 'customer_not_home', 'wrong_address',
      'customer_refused', 'customer_cancelled', 'other'
    )
  ) THEN
    RAISE EXCEPTION 'complete_delivery: invalid outcome value in p_outcomes';
  END IF;

  -- Process each order on this delivery
  FOR v_order IN
    SELECT o.id AS order_id, o.order_number
    FROM orders o
    WHERE o.delivery_id = p_delivery_id
      AND o.business_id = v_bid
      AND o.status      = 'out_for_delivery'
  LOOP
    -- Resolve outcome (default: delivered when order absent from p_outcomes)
    SELECT
      COALESCE(elem ->> 'outcome', 'delivered'),
      elem ->> 'notes'
    INTO v_outcome, v_notes
    FROM jsonb_array_elements(p_outcomes) AS elem
    WHERE (elem ->> 'order_id')::uuid = v_order.order_id
    LIMIT 1;

    IF v_outcome IS NULL THEN
      v_outcome := 'delivered';
      v_notes   := NULL;
    END IF;

    -- Record outcome
    INSERT INTO delivery_order_results (delivery_id, order_id, outcome, courier_notes, completed_at)
    VALUES (p_delivery_id, v_order.order_id, v_outcome, v_notes, now());

    -- Apply per-outcome business rules
    CASE v_outcome

      WHEN 'delivered' THEN
        UPDATE orders
        SET status       = 'delivered',
            delivered_at = now(),
            updated_at   = now()
        WHERE id = v_order.order_id;

      WHEN 'customer_not_home', 'wrong_address', 'other' THEN
        -- Soft failure: allocations intact, order re-queued for next delivery
        UPDATE orders
        SET status      = 'delivery_failed',
            delivery_id = NULL,
            updated_at  = now()
        WHERE id = v_order.order_id;

      WHEN 'customer_refused', 'customer_cancelled' THEN
        -- Hard failure: release allocated stock, mark order refused
        v_release_src := CASE v_outcome
          WHEN 'customer_refused'   THEN 'customer_refusal'
          WHEN 'customer_cancelled' THEN 'customer_cancellation'
        END;

        INSERT INTO available_stock (business_id, product_variant_id, quantity, source, notes)
        SELECT
          v_bid,
          ol.product_variant_id,
          ol.allocated_quantity,
          v_release_src,
          'Released from order #' || v_order.order_number
        FROM order_lines ol
        WHERE ol.order_id         = v_order.order_id
          AND ol.allocated_quantity > 0;

        UPDATE order_lines
        SET allocated_quantity = 0,
            status             = 'cancelled'
        WHERE order_id            = v_order.order_id
          AND allocated_quantity  > 0;

        UPDATE orders
        SET status      = 'refused',
            delivery_id = NULL,
            updated_at  = now()
        WHERE id = v_order.order_id;

    END CASE;
  END LOOP;

  -- Mark delivery completed
  UPDATE deliveries
  SET status     = 'completed',
      updated_at = now()
  WHERE id          = p_delivery_id
    AND business_id = v_bid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_delivery(uuid, jsonb) TO authenticated;
