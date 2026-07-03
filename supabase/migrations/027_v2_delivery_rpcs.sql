-- Migration 027: Delivery lifecycle RPCs
--
-- create_delivery : bundles ready orders → delivery (pending) + orders (out_for_delivery)
-- dispatch_delivery: delivery pending → dispatched, sets dispatched_at
-- complete_delivery: delivery dispatched|pending → completed, orders → delivered

-- ── create_delivery ───────────────────────────────────────────────────────────

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
    AND status = 'ready';

  IF v_count != array_length(p_order_ids, 1) THEN
    RAISE EXCEPTION 'create_delivery: one or more orders are not ready or do not belong to this business';
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
    AND status = 'ready';

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected != array_length(p_order_ids, 1) THEN
    RAISE EXCEPTION 'create_delivery: concurrency conflict — some orders changed status';
  END IF;

  RETURN v_delivery_id;
END;
$$;


-- ── dispatch_delivery ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dispatch_delivery(
  p_delivery_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM deliveries
  WHERE id = p_delivery_id AND business_id = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'dispatch_delivery: delivery not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'dispatch_delivery: delivery is already %', v_status;
  END IF;

  UPDATE deliveries
  SET status        = 'dispatched',
      dispatched_at = now()
  WHERE id = p_delivery_id;
END;
$$;


-- ── complete_delivery ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_delivery(
  p_delivery_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM deliveries
  WHERE id = p_delivery_id AND business_id = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'complete_delivery: delivery not found';
  END IF;

  IF v_status = 'completed' THEN
    RAISE EXCEPTION 'complete_delivery: delivery is already completed';
  END IF;

  IF v_status NOT IN ('pending', 'dispatched') THEN
    RAISE EXCEPTION 'complete_delivery: unexpected delivery status %', v_status;
  END IF;

  UPDATE deliveries
  SET status = 'completed'
  WHERE id = p_delivery_id;

  -- Mark every linked out_for_delivery order as delivered
  UPDATE orders
  SET status       = 'delivered',
      delivered_at = now()
  WHERE delivery_id = p_delivery_id
    AND status = 'out_for_delivery';
END;
$$;
