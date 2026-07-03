-- Migration 039: get_money_report RPC
-- Financial exposure view across ALL active orders for the Money screen.
-- Active = not delivered and not cancelled.
-- All monetary values are in piastres (integer, 1/100 EGP).

CREATE OR REPLACE FUNCTION public.get_money_report()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid    uuid;
  v_result json;
BEGIN
  v_bid := get_my_business_id();

  WITH active_orders AS (
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.deposit_amount,
      c.name AS customer_name,
      COALESCE(
        SUM(ol.quantity * ol.unit_price) FILTER (WHERE ol.status != 'cancelled'),
        0
      )::bigint AS order_value
    FROM   orders      o
    JOIN   customers   c  ON c.id  = o.customer_id
    LEFT JOIN order_lines ol ON ol.order_id = o.id
    WHERE  o.business_id = v_bid
      AND  o.status NOT IN ('delivered', 'cancelled')
    GROUP  BY o.id, o.order_number, o.status, o.deposit_amount, c.name
  ),
  status_breakdown AS (
    SELECT
      status,
      COUNT(*)::int                              AS order_count,
      COALESCE(SUM(order_value),    0)::bigint   AS value,
      COALESCE(SUM(deposit_amount), 0)::bigint   AS deposits,
      COALESCE(SUM(order_value - deposit_amount), 0)::bigint AS balance
    FROM active_orders
    GROUP BY status
  )
  SELECT json_build_object(
    'total_active_value',  COALESCE((SELECT SUM(order_value)                   FROM active_orders), 0),
    'deposits_collected',  COALESCE((SELECT SUM(deposit_amount)                FROM active_orders), 0),
    'outstanding_balance', COALESCE((SELECT SUM(order_value - deposit_amount)  FROM active_orders), 0),
    'active_order_count',  COALESCE((SELECT COUNT(*)                           FROM active_orders), 0),
    'by_status',           COALESCE(
                             (SELECT json_object_agg(
                                status,
                                json_build_object(
                                  'order_count', order_count,
                                  'value',       value,
                                  'deposits',    deposits,
                                  'balance',     balance
                                )
                              )
                              FROM status_breakdown),
                             '{}'::json
                           ),
    'orders',              COALESCE(
                             (SELECT json_agg(
                                json_build_object(
                                  'id',             id,
                                  'order_number',   order_number,
                                  'customer_name',  customer_name,
                                  'status',         status,
                                  'order_value',    order_value,
                                  'deposit_amount', deposit_amount,
                                  'balance_due',    order_value - deposit_amount
                                )
                                ORDER BY order_number DESC
                              )
                              FROM active_orders),
                             '[]'::json
                           )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_money_report() TO authenticated;
