-- =============================================================================
-- Migration 048: Auto-FIFO allocation of surplus and freed stock
--
-- Problem: surplus from factory receipts and freed stock from cancellations
-- were always parked in available_stock, requiring the owner to manually
-- navigate and allocate them to pending orders.
--
-- Solution: auto_allocate_surplus() first exhausts pending order demand
-- FIFO (oldest orders first), then parks any unmatched remainder in
-- available_stock. Both record_factory_receipts and cancel_order are
-- updated to call this helper instead of inserting directly.
-- =============================================================================


-- ── Helper: auto_allocate_surplus ────────────────────────────────────────────
--
-- Tries to satisfy pending order lines for p_variant_id in FIFO order.
-- Any quantity that has no matching pending demand goes to available_stock.

CREATE OR REPLACE FUNCTION public.auto_allocate_surplus(
  p_variant_id  uuid,
  p_quantity    integer,
  p_source      text,
  p_notes       text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_remaining  integer := p_quantity;
  v_line       RECORD;
  v_demand     integer;
  v_alloc_qty  integer;
BEGIN
  -- FIFO: oldest orders first, only 'pending' lines with unmet demand
  FOR v_line IN
    SELECT ol.id, ol.quantity, ol.allocated_quantity, ol.order_id
    FROM   order_lines ol
    JOIN   orders o ON o.id = ol.order_id
    WHERE  ol.product_variant_id = p_variant_id
      AND  ol.status = 'pending'
      AND  ol.allocated_quantity < ol.quantity
      AND  o.business_id = get_my_business_id()
      AND  o.status NOT IN ('cancelled', 'delivered')
    ORDER BY o.created_at ASC
  LOOP
    EXIT WHEN v_remaining = 0;

    v_demand    := v_line.quantity - v_line.allocated_quantity;
    v_alloc_qty := LEAST(v_demand, v_remaining);

    UPDATE order_lines
    SET    allocated_quantity = allocated_quantity + v_alloc_qty,
           status = CASE
                      WHEN allocated_quantity + v_alloc_qty >= quantity THEN 'allocated'
                      ELSE status
                    END
    WHERE  id = v_line.id;

    -- Promote order to 'ready' when all non-cancelled lines are now allocated
    IF NOT EXISTS (
      SELECT 1 FROM order_lines
      WHERE  order_id = v_line.order_id
        AND  status NOT IN ('allocated', 'cancelled')
    ) THEN
      UPDATE orders
      SET    status = 'ready'
      WHERE  id = v_line.order_id AND status = 'pending';
    END IF;

    v_remaining := v_remaining - v_alloc_qty;
  END LOOP;

  -- Park any remainder that could not be matched to pending demand
  IF v_remaining > 0 THEN
    INSERT INTO available_stock (product_variant_id, quantity, source, notes)
    VALUES (p_variant_id, v_remaining, p_source, p_notes);
  END IF;
END;
$$;


-- ── Updated: record_factory_receipts ─────────────────────────────────────────
-- Only the surplus-handling block is changed; everything else is identical.

CREATE OR REPLACE FUNCTION public.record_factory_receipts(
  p_factory_order_id uuid,
  p_received_at      timestamptz,
  p_notes            text,
  p_receipts         jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_receipt           jsonb;
  v_i                 integer := 0;
  v_fol_id            uuid;
  v_receipt_qty       integer;
  v_fol_ordered_qty   integer;
  v_fol_received_qty  integer;
  v_allocation        jsonb;
  v_j                 integer;
  v_ol_id             uuid;
  v_alloc_qty         integer;
  v_ol_quantity       integer;
  v_ol_allocated_qty  integer;
  v_ol_status         text;
  v_alloc_sum         integer;
  v_surplus           integer;
  v_variant_id        uuid;
  v_fo_number         integer;
  v_order_id          uuid;
  v_seen_fol_ids      uuid[] := '{}';
  v_incomplete_count  integer;
BEGIN
  -- ── Validation ──────────────────────────────────────────────────────────

  IF p_factory_order_id IS NULL THEN
    RAISE EXCEPTION 'record_factory_receipts: factory_order_id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM factory_orders
    WHERE id = p_factory_order_id AND business_id = get_my_business_id()
  ) THEN
    RAISE EXCEPTION 'record_factory_receipts: factory_order not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM factory_orders
    WHERE id = p_factory_order_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'record_factory_receipts: factory_order is already closed';
  END IF;

  IF p_receipts IS NULL OR jsonb_array_length(p_receipts) = 0 THEN
    RAISE EXCEPTION 'record_factory_receipts: at least one receipt entry is required';
  END IF;

  -- Validate each receipt entry before any writes
  FOR v_receipt IN SELECT * FROM jsonb_array_elements(p_receipts) LOOP
    v_i := v_i + 1;
    v_fol_id      := (v_receipt->>'factory_order_line_id')::uuid;
    v_receipt_qty := (v_receipt->>'quantity')::integer;

    IF v_fol_id IS NULL THEN
      RAISE EXCEPTION 'record_factory_receipts: receipt % missing factory_order_line_id', v_i;
    END IF;

    IF v_fol_id = ANY(v_seen_fol_ids) THEN
      RAISE EXCEPTION 'record_factory_receipts: duplicate factory_order_line_id in receipt %', v_i;
    END IF;
    v_seen_fol_ids := array_append(v_seen_fol_ids, v_fol_id);

    SELECT quantity INTO v_fol_ordered_qty
    FROM factory_order_lines
    WHERE id = v_fol_id AND factory_order_id = p_factory_order_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'record_factory_receipts: receipt %: factory_order_line not found in this factory_order', v_i;
    END IF;

    IF v_receipt_qty IS NULL OR v_receipt_qty <= 0 THEN
      RAISE EXCEPTION 'record_factory_receipts: receipt % quantity must be greater than zero', v_i;
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_fol_received_qty
    FROM factory_receipts
    WHERE factory_order_line_id = v_fol_id AND reversal_of IS NULL;

    IF v_fol_received_qty + v_receipt_qty > v_fol_ordered_qty THEN
      RAISE EXCEPTION
        'record_factory_receipts: receipt % would exceed ordered quantity (ordered=%, already_received=%, new=%)',
        v_i, v_fol_ordered_qty, v_fol_received_qty, v_receipt_qty;
    END IF;

    v_alloc_sum := 0;
    v_j := 0;
    FOR v_allocation IN SELECT * FROM jsonb_array_elements(v_receipt->'allocations') LOOP
      v_j := v_j + 1;
      v_ol_id     := (v_allocation->>'order_line_id')::uuid;
      v_alloc_qty := (v_allocation->>'quantity')::integer;

      IF v_ol_id IS NULL THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation % missing order_line_id', v_i, v_j;
      END IF;

      IF v_alloc_qty IS NULL OR v_alloc_qty < 0 THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation % quantity must be zero or greater', v_i, v_j;
      END IF;

      SELECT ol.quantity, ol.allocated_quantity, ol.status
      INTO v_ol_quantity, v_ol_allocated_qty, v_ol_status
      FROM order_lines ol
      WHERE ol.id = v_ol_id AND ol.factory_order_line_id = v_fol_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation %: order_line not linked to this factory_order_line', v_i, v_j;
      END IF;

      IF v_ol_status = 'cancelled' THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation %: cannot allocate to a cancelled order_line', v_i, v_j;
      END IF;

      IF v_ol_allocated_qty + v_alloc_qty > v_ol_quantity THEN
        RAISE EXCEPTION
          'record_factory_receipts: receipt %, allocation %: allocation exceeds unmet demand (ordered=%, already_allocated=%, new_alloc=%)',
          v_i, v_j, v_ol_quantity, v_ol_allocated_qty, v_alloc_qty;
      END IF;

      v_alloc_sum := v_alloc_sum + v_alloc_qty;
    END LOOP;

    IF v_alloc_sum > v_receipt_qty THEN
      RAISE EXCEPTION
        'record_factory_receipts: receipt % total allocations (%) exceed received quantity (%)',
        v_i, v_alloc_sum, v_receipt_qty;
    END IF;
  END LOOP;

  -- ── Writes ───────────────────────────────────────────────────────────────

  FOR v_receipt IN SELECT * FROM jsonb_array_elements(p_receipts) LOOP
    v_fol_id      := (v_receipt->>'factory_order_line_id')::uuid;
    v_receipt_qty := (v_receipt->>'quantity')::integer;

    INSERT INTO factory_receipts (factory_order_line_id, quantity, received_at, notes)
    VALUES (v_fol_id, v_receipt_qty, p_received_at, p_notes);

    v_alloc_sum := 0;
    FOR v_allocation IN SELECT * FROM jsonb_array_elements(v_receipt->'allocations') LOOP
      v_ol_id     := (v_allocation->>'order_line_id')::uuid;
      v_alloc_qty := (v_allocation->>'quantity')::integer;
      v_alloc_sum := v_alloc_sum + v_alloc_qty;

      IF v_alloc_qty > 0 THEN
        UPDATE order_lines
        SET
          allocated_quantity = allocated_quantity + v_alloc_qty,
          status = CASE
            WHEN allocated_quantity + v_alloc_qty >= quantity THEN 'allocated'
            ELSE status
          END
        WHERE id = v_ol_id;
      END IF;
    END LOOP;

    -- Auto-allocate surplus FIFO; remainder goes to available_stock
    v_surplus := v_receipt_qty - v_alloc_sum;
    IF v_surplus > 0 THEN
      SELECT product_variant_id INTO v_variant_id
      FROM factory_order_lines WHERE id = v_fol_id;

      SELECT factory_order_number INTO v_fo_number
      FROM factory_orders WHERE id = p_factory_order_id;

      PERFORM auto_allocate_surplus(
        v_variant_id,
        v_surplus,
        'factory_surplus',
        'Surplus from FO #' || v_fo_number
      );
    END IF;
  END LOOP;

  -- ── Transition order statuses to 'ready' ────────────────────────────────

  FOR v_order_id IN
    SELECT DISTINCT ol.order_id
    FROM order_lines ol
    JOIN factory_order_lines fol ON fol.id = ol.factory_order_line_id
    WHERE fol.factory_order_id = p_factory_order_id
  LOOP
    UPDATE orders
    SET status = 'ready'
    WHERE id = v_order_id
      AND status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM order_lines
        WHERE order_id = v_order_id
          AND status NOT IN ('allocated', 'cancelled')
      );
  END LOOP;

  -- ── Close factory_order if all lines fully received ──────────────────────

  SELECT COUNT(*) INTO v_incomplete_count
  FROM factory_order_lines fol
  WHERE fol.factory_order_id = p_factory_order_id
    AND (
      SELECT COALESCE(SUM(fr.quantity), 0)
      FROM factory_receipts fr
      WHERE fr.factory_order_line_id = fol.id
        AND fr.reversal_of IS NULL
    ) < fol.quantity;

  IF v_incomplete_count = 0 THEN
    UPDATE factory_orders SET status = 'closed'
    WHERE id = p_factory_order_id;
  END IF;
END;
$$;


-- ── Updated: cancel_order ────────────────────────────────────────────────────
-- Freed allocated quantities are now auto-allocated FIFO instead of always
-- going to available_stock.

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status     text;
  v_line       RECORD;
  v_order_num  integer;
BEGIN
  SELECT status, order_number INTO v_status, v_order_num
  FROM orders
  WHERE id = p_order_id AND business_id = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cancel_order: order not found';
  END IF;

  IF v_status NOT IN ('pending', 'ready') THEN
    RAISE EXCEPTION 'cancel_order: order cannot be cancelled in status %', v_status;
  END IF;

  -- Process every non-cancelled line
  FOR v_line IN
    SELECT id, status, allocated_quantity, product_variant_id
    FROM order_lines
    WHERE order_id = p_order_id AND status != 'cancelled'
  LOOP
    -- Free any allocated quantity: try to re-allocate FIFO; remainder → available_stock
    IF v_line.allocated_quantity > 0 THEN
      PERFORM auto_allocate_surplus(
        v_line.product_variant_id,
        v_line.allocated_quantity,
        'cancellation',
        'Freed from cancelled order #' || v_order_num
      );
    END IF;

    UPDATE order_lines SET status = 'cancelled'
    WHERE id = v_line.id;
  END LOOP;

  UPDATE orders SET status = 'cancelled'
  WHERE id = p_order_id;
END;
$$;
