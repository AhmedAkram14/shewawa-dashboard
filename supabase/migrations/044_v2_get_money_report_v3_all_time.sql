-- Migration 044: get_money_report v3 — all-time scope on both sides
-- Previously customer revenue only counted active (non-delivered, non-cancelled) orders,
-- while factory payments were all-time. This mismatch caused factory paid to appear
-- while customer revenue showed 0. Now both sides are all-time totals.
-- active_order_count still reflects in-flight orders for the subtitle only.

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

  WITH

  -- ── All orders (non-cancelled) for financial totals ──────────────────────
  all_orders AS (
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
      AND  o.status != 'cancelled'
    GROUP  BY o.id, o.order_number, o.status, o.deposit_amount, c.name
  ),

  -- Active orders (in-flight only) — used for pipeline breakdown + subtitle count
  active_orders AS (
    SELECT * FROM all_orders
    WHERE status NOT IN ('delivered', 'cancelled')
  ),

  customer_summary AS (
    SELECT
      COALESCE(SUM(order_value),                  0)::bigint AS revenue,
      COALESCE(SUM(deposit_amount),               0)::bigint AS collected,
      COALESCE(SUM(order_value - deposit_amount), 0)::bigint AS outstanding,
      COALESCE(COUNT(*),                          0)::int    AS order_count
    FROM all_orders
  ),

  active_count AS (
    SELECT COALESCE(COUNT(*), 0)::int AS cnt FROM active_orders
  ),

  status_breakdown AS (
    SELECT
      status,
      COUNT(*)::int                                              AS order_count,
      COALESCE(SUM(order_value),                  0)::bigint    AS value,
      COALESCE(SUM(deposit_amount),               0)::bigint    AS deposits,
      COALESCE(SUM(order_value - deposit_amount), 0)::bigint    AS balance
    FROM active_orders
    GROUP BY status
  ),

  -- ── Factory side: all factory orders for this business ───────────────────
  factory_line_costs AS (
    SELECT
      fol.factory_order_id,
      fol.id AS line_id,
      fol.unit_cost,
      fol.quantity,
      CASE WHEN fol.unit_cost IS NOT NULL
           THEN (fol.quantity * fol.unit_cost)::bigint
           ELSE NULL
      END AS line_cost
    FROM   factory_order_lines fol
    JOIN   factory_orders fo ON fo.id = fol.factory_order_id
    WHERE  fo.business_id = v_bid
  ),

  factory_cost_summary AS (
    SELECT
      COALESCE(SUM(line_cost),                          0)::bigint AS cost_agreed,
      COUNT(*) FILTER (WHERE unit_cost IS NULL)::int               AS cost_lines_unknown
    FROM factory_line_costs
  ),

  factory_payment_summary AS (
    SELECT COALESCE(SUM(fp.amount), 0)::bigint AS total_paid
    FROM   factory_payments fp
    WHERE  fp.business_id = v_bid
  )

  SELECT json_build_object(
    -- Customer (all-time, non-cancelled)
    'customer_revenue',      cs.revenue,
    'customer_collected',    cs.collected,
    'customer_outstanding',  cs.outstanding,
    'active_order_count',    ac.cnt,
    'by_status',             COALESCE(
                               (SELECT json_object_agg(
                                  status,
                                  json_build_object(
                                    'order_count', order_count,
                                    'value',       value,
                                    'deposits',    deposits,
                                    'balance',     balance
                                  )
                                ) FROM status_breakdown),
                               '{}'::json
                             ),
    'orders',                COALESCE(
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
                                ) FROM active_orders),
                               '[]'::json
                             ),
    -- Factory (all-time)
    'factory_cost_agreed',       fcs.cost_agreed,
    'factory_cost_lines_unknown', fcs.cost_lines_unknown,
    'factory_paid',              fps.total_paid,
    'factory_outstanding',       GREATEST(fcs.cost_agreed - fps.total_paid, 0),
    -- Profit
    'gross_profit_expected',     cs.revenue - fcs.cost_agreed,
    'gross_margin_pct',          CASE WHEN cs.revenue > 0
                                      THEN ROUND(
                                        (cs.revenue - fcs.cost_agreed)::numeric
                                        / cs.revenue * 100,
                                        1
                                      )
                                      ELSE NULL
                                 END
  ) INTO v_result
  FROM customer_summary cs, active_count ac, factory_cost_summary fcs, factory_payment_summary fps;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_money_report() TO authenticated;
