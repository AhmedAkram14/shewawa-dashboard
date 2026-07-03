-- Migration 037: append_factory_order RPC
--
-- Allows adding more order lines to an existing OPEN factory order.
-- Business rule: append-only — existing quantities are never reduced.
-- If a variant already has a factory_order_line, its quantity grows.
-- If the variant is new to this factory order, a new line is created.
-- All work happens atomically; any validation failure rolls back everything.

CREATE OR REPLACE FUNCTION public.append_factory_order(
  p_factory_order_id uuid,
  p_order_line_ids   uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid     uuid;
  v_status  text;
  v_variant RECORD;
  v_fol_id  uuid;
BEGIN
  v_bid := get_my_business_id();

  -- Validate factory order exists, is open, and belongs to this business
  SELECT status INTO v_status
  FROM factory_orders
  WHERE id = p_factory_order_id AND business_id = v_bid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'append_factory_order: factory order not found';
  END IF;

  IF v_status != 'open' THEN
    RAISE EXCEPTION 'append_factory_order: factory order is % — only open orders can be extended', v_status;
  END IF;

  IF cardinality(p_order_line_ids) = 0 THEN
    RAISE EXCEPTION 'append_factory_order: no order lines provided';
  END IF;

  -- Validate every order line: must be pending, unassigned, and belong to this business
  IF EXISTS (
    SELECT 1 FROM unnest(p_order_line_ids) AS lid(id)
    WHERE NOT EXISTS (
      SELECT 1
      FROM order_lines ol
      JOIN orders o ON o.id = ol.order_id
      WHERE ol.id            = lid.id
        AND o.business_id    = v_bid
        AND ol.status        = 'pending'
        AND ol.factory_order_line_id IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'append_factory_order: one or more order lines are not pending or are already assigned to a factory order';
  END IF;

  -- Process each unique variant found in the selected order lines
  FOR v_variant IN
    SELECT
      ol.product_variant_id,
      SUM(ol.quantity)  AS total_qty,
      array_agg(ol.id)  AS line_ids
    FROM order_lines ol
    JOIN orders o ON o.id = ol.order_id
    WHERE ol.id = ANY(p_order_line_ids)
      AND o.business_id = v_bid
    GROUP BY ol.product_variant_id
  LOOP
    -- Attempt to find an existing factory_order_line for this variant
    SELECT id INTO v_fol_id
    FROM factory_order_lines
    WHERE factory_order_id   = p_factory_order_id
      AND product_variant_id = v_variant.product_variant_id;

    IF FOUND THEN
      -- Append-only: increase the quantity that was already sent to the factory
      UPDATE factory_order_lines
      SET quantity = quantity + v_variant.total_qty
      WHERE id = v_fol_id;
    ELSE
      -- New variant for this factory order: create a fresh line
      INSERT INTO factory_order_lines (factory_order_id, product_variant_id, quantity)
      VALUES (p_factory_order_id, v_variant.product_variant_id, v_variant.total_qty)
      RETURNING id INTO v_fol_id;
    END IF;

    -- Link order_lines to the factory_order_line and advance their status
    UPDATE order_lines
    SET status                = 'at_factory',
        factory_order_line_id = v_fol_id,
        updated_at            = now()
    WHERE id = ANY(v_variant.line_ids);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.append_factory_order(uuid, uuid[]) TO authenticated;
