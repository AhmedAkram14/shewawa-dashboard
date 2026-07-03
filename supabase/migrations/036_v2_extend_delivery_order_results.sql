-- Migration 036: extend delivery_order_results with operational history
--
-- Adds completed_at, failure_reason (enum), and courier_notes so the table
-- is a proper audit trail rather than a bare outcome flag.
-- Also replaces complete_delivery(uuid, uuid[]) with (uuid, jsonb) so each
-- failed order can carry its own reason and notes in one RPC call.

ALTER TABLE public.delivery_order_results
  ADD COLUMN IF NOT EXISTS completed_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS failure_reason text        CHECK (
    failure_reason IN ('customer_not_home', 'no_answer', 'rescheduled', 'refused', 'other')
  ),
  ADD COLUMN IF NOT EXISTS courier_notes  text;

-- Drop the previous signature so PostgREST schema cache stays clean.
DROP FUNCTION IF EXISTS public.complete_delivery(uuid, uuid[]);

-- New signature: p_failed_orders is a JSON array of objects:
--   [{ "order_id": "uuid",
--      "failure_reason": "customer_not_home",   -- optional
--      "courier_notes":  "Left at door but…"    -- optional
--   }, …]
CREATE OR REPLACE FUNCTION public.complete_delivery(
  p_delivery_id   uuid,
  p_failed_orders jsonb DEFAULT '[]'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid        uuid;
  v_status     text;
  v_failed_ids uuid[];
BEGIN
  v_bid := get_my_business_id();

  SELECT status INTO v_status
  FROM deliveries
  WHERE id = p_delivery_id AND business_id = v_bid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'complete_delivery: delivery not found';
  END IF;

  IF v_status NOT IN ('pending', 'dispatched') THEN
    RAISE EXCEPTION 'complete_delivery: delivery is already %', v_status;
  END IF;

  -- Extract the set of failed order IDs for fast ANY() lookups below.
  SELECT COALESCE(array_agg((elem ->> 'order_id')::uuid), '{}')
  INTO v_failed_ids
  FROM jsonb_array_elements(p_failed_orders) AS elem;

  -- Validate every failed order_id belongs to this delivery.
  IF cardinality(v_failed_ids) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM unnest(v_failed_ids) AS fid(id)
      WHERE NOT EXISTS (
        SELECT 1 FROM orders
        WHERE id          = fid.id
          AND delivery_id = p_delivery_id
          AND business_id = v_bid
          AND status      = 'out_for_delivery'
      )
    ) THEN
      RAISE EXCEPTION 'complete_delivery: some failed order IDs do not belong to this delivery';
    END IF;
  END IF;

  -- Record per-order outcomes (LEFT JOIN unpacks failure_reason + courier_notes).
  INSERT INTO delivery_order_results
    (delivery_id, order_id, outcome, failure_reason, courier_notes, completed_at)
  SELECT
    p_delivery_id,
    o.id,
    CASE WHEN f.order_id IS NOT NULL THEN 'failed' ELSE 'delivered' END,
    f.failure_reason,
    f.courier_notes,
    now()
  FROM orders o
  LEFT JOIN (
    SELECT
      (elem ->> 'order_id')::uuid AS order_id,
      elem ->> 'failure_reason'   AS failure_reason,
      elem ->> 'courier_notes'    AS courier_notes
    FROM jsonb_array_elements(p_failed_orders) AS elem
  ) f ON f.order_id = o.id
  WHERE o.delivery_id = p_delivery_id
    AND o.business_id = v_bid
    AND o.status      = 'out_for_delivery';

  -- Failed orders → back to ready, detach from this delivery.
  IF cardinality(v_failed_ids) > 0 THEN
    UPDATE orders
    SET status      = 'ready',
        delivery_id = NULL,
        updated_at  = now()
    WHERE id          = ANY(v_failed_ids)
      AND delivery_id = p_delivery_id
      AND business_id = v_bid
      AND status      = 'out_for_delivery';
  END IF;

  -- Remaining out_for_delivery orders → delivered.
  UPDATE orders
  SET status       = 'delivered',
      delivered_at = now(),
      updated_at   = now()
  WHERE delivery_id = p_delivery_id
    AND business_id = v_bid
    AND status      = 'out_for_delivery';

  -- Complete the delivery.
  UPDATE deliveries
  SET status     = 'completed',
      updated_at = now()
  WHERE id          = p_delivery_id
    AND business_id = v_bid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_delivery(uuid, jsonb) TO authenticated;
