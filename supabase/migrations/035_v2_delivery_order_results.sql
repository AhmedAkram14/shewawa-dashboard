-- Migration 035: per-order delivery outcomes
--
-- Business rule: a failed delivery does NOT cancel the order.
-- Failed orders revert to `ready` (allocation intact, package reserved).
-- The delivery record captures the full outcome via delivery_order_results.

-- ── delivery_order_results ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.delivery_order_results (
  delivery_id  uuid        NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  order_id     uuid        NOT NULL REFERENCES public.orders(id),
  outcome      text        NOT NULL CHECK (outcome IN ('delivered', 'failed')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (delivery_id, order_id)
);

ALTER TABLE public.delivery_order_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_all" ON public.delivery_order_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.id = delivery_id AND d.business_id = get_my_business_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.id = delivery_id AND d.business_id = get_my_business_id()
    )
  );

-- ── Replace complete_delivery ────────────────────────────────────────────────
-- Old signature had no p_failed_order_ids; drop it so the new one takes over.

DROP FUNCTION IF EXISTS public.complete_delivery(uuid);

CREATE OR REPLACE FUNCTION public.complete_delivery(
  p_delivery_id      uuid,
  p_failed_order_ids uuid[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid    uuid;
  v_status text;
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

  -- Validate that every supplied failed_order_id belongs to this delivery
  IF cardinality(p_failed_order_ids) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM unnest(p_failed_order_ids) AS fid(id)
      WHERE NOT EXISTS (
        SELECT 1 FROM orders
        WHERE id = fid.id
          AND delivery_id = p_delivery_id
          AND business_id = v_bid
          AND status = 'out_for_delivery'
      )
    ) THEN
      RAISE EXCEPTION 'complete_delivery: some failed_order_ids do not belong to this delivery';
    END IF;
  END IF;

  -- Record per-order outcomes before changing anything
  INSERT INTO delivery_order_results (delivery_id, order_id, outcome)
  SELECT
    p_delivery_id,
    o.id,
    CASE WHEN o.id = ANY(p_failed_order_ids) THEN 'failed' ELSE 'delivered' END
  FROM orders o
  WHERE o.delivery_id = p_delivery_id
    AND o.business_id = v_bid
    AND o.status = 'out_for_delivery';

  -- Failed orders → back to ready, detach from this delivery
  IF cardinality(p_failed_order_ids) > 0 THEN
    UPDATE orders
    SET status      = 'ready',
        delivery_id = NULL,
        updated_at  = now()
    WHERE id          = ANY(p_failed_order_ids)
      AND delivery_id = p_delivery_id
      AND business_id = v_bid
      AND status      = 'out_for_delivery';
  END IF;

  -- Remaining out_for_delivery orders on this delivery → delivered
  -- (failed orders were detached above, so this only touches successes)
  UPDATE orders
  SET status       = 'delivered',
      delivered_at = now(),
      updated_at   = now()
  WHERE delivery_id = p_delivery_id
    AND business_id = v_bid
    AND status      = 'out_for_delivery';

  -- Mark the delivery completed
  UPDATE deliveries
  SET status     = 'completed',
      updated_at = now()
  WHERE id          = p_delivery_id
    AND business_id = v_bid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_delivery(uuid, uuid[]) TO authenticated;
