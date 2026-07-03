-- Migration 034: get_today_summary RPC
-- Returns KPI snapshot for the Today dashboard.

CREATE OR REPLACE FUNCTION public.get_today_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid          uuid;
  v_today_start  timestamptz;

  v_pending_count          int;
  v_ready_count            int;
  v_out_for_delivery_count int;
  v_delivered_today_count  int;
  v_pieces_at_factory      bigint;
  v_total_active_value     bigint;
  v_deposits_on_active     bigint;
  v_outstanding_balance    bigint;
BEGIN
  v_bid         := get_my_business_id();
  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC');

  SELECT COUNT(*) INTO v_pending_count
  FROM orders WHERE business_id = v_bid AND status = 'pending';

  SELECT COUNT(*) INTO v_ready_count
  FROM orders WHERE business_id = v_bid AND status = 'ready';

  SELECT COUNT(*) INTO v_out_for_delivery_count
  FROM orders WHERE business_id = v_bid AND status = 'out_for_delivery';

  SELECT COUNT(*) INTO v_delivered_today_count
  FROM orders
  WHERE business_id = v_bid
    AND status = 'delivered'
    AND delivered_at >= v_today_start;

  SELECT COALESCE(SUM(ol.quantity), 0) INTO v_pieces_at_factory
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  WHERE o.business_id = v_bid
    AND ol.status = 'at_factory';

  -- Financial snapshot for active orders (pending / ready / out_for_delivery)
  WITH active_order_totals AS (
    SELECT
      o.deposit_amount,
      COALESCE(
        SUM(ol.quantity * ol.unit_price) FILTER (WHERE ol.status != 'cancelled'),
        0
      ) AS line_total
    FROM orders o
    LEFT JOIN order_lines ol ON ol.order_id = o.id
    WHERE o.business_id = v_bid
      AND o.status NOT IN ('delivered', 'cancelled')
    GROUP BY o.id, o.deposit_amount
  )
  SELECT
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(deposit_amount), 0),
    COALESCE(SUM(line_total - deposit_amount), 0)
  INTO v_total_active_value, v_deposits_on_active, v_outstanding_balance
  FROM active_order_totals;

  RETURN json_build_object(
    'pending_count',            v_pending_count,
    'ready_count',              v_ready_count,
    'out_for_delivery_count',   v_out_for_delivery_count,
    'delivered_today_count',    v_delivered_today_count,
    'pieces_at_factory',        v_pieces_at_factory,
    'total_active_value',       v_total_active_value,
    'deposits_on_active',       v_deposits_on_active,
    'outstanding_balance',      v_outstanding_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_summary() TO authenticated;
