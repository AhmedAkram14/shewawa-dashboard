-- Migration 038: extend get_today_summary with workflow-relevant counts
-- Adds available_stock_count and pending_lines_count to drive the
-- Workflow Recommendation system without an extra RPC call.

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
  v_available_stock_count  bigint;
  v_pending_lines_count    bigint;
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

  -- Available stock entries (all rows have quantity > 0 by CHECK constraint;
  -- exhausted rows are deleted, never zeroed)
  SELECT COUNT(*) INTO v_available_stock_count
  FROM available_stock
  WHERE business_id = v_bid;

  -- Pending order lines not yet assigned to any factory order
  SELECT COUNT(*) INTO v_pending_lines_count
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  WHERE o.business_id = v_bid
    AND ol.status = 'pending'
    AND ol.factory_order_line_id IS NULL;

  RETURN json_build_object(
    'pending_count',            v_pending_count,
    'ready_count',              v_ready_count,
    'out_for_delivery_count',   v_out_for_delivery_count,
    'delivered_today_count',    v_delivered_today_count,
    'pieces_at_factory',        v_pieces_at_factory,
    'total_active_value',       v_total_active_value,
    'deposits_on_active',       v_deposits_on_active,
    'outstanding_balance',      v_outstanding_balance,
    'available_stock_count',    v_available_stock_count,
    'pending_lines_count',      v_pending_lines_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_summary() TO authenticated;
