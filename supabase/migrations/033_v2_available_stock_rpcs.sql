-- Migration 033: Available stock RPCs
--
-- allocate_from_stock : consume stock row → order_line allocated_quantity bump
-- add_manual_stock    : owner-entered surplus addition

-- ── allocate_from_stock ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.allocate_from_stock(
  p_stock_id      uuid,
  p_order_line_id uuid,
  p_quantity      integer
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_stock_qty      integer;
  v_stock_variant  uuid;
  v_line_variant   uuid;
  v_line_qty       integer;
  v_line_alloc     integer;
  v_order_id       uuid;
BEGIN
  -- Validate stock row belongs to this business
  SELECT product_variant_id, quantity
  INTO   v_stock_variant, v_stock_qty
  FROM   available_stock
  WHERE  id = p_stock_id AND business_id = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'allocate_from_stock: stock entry not found';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'allocate_from_stock: quantity must be greater than zero';
  END IF;

  IF p_quantity > v_stock_qty THEN
    RAISE EXCEPTION 'allocate_from_stock: requested % exceeds available %',
      p_quantity, v_stock_qty;
  END IF;

  -- Validate order line (tenancy via orders JOIN — order_lines has no business_id)
  SELECT ol.product_variant_id, ol.quantity, ol.allocated_quantity, ol.order_id
  INTO   v_line_variant, v_line_qty, v_line_alloc, v_order_id
  FROM   order_lines ol
  JOIN   orders o ON o.id = ol.order_id
  WHERE  ol.id = p_order_line_id
    AND  o.business_id = get_my_business_id()
    AND  ol.status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'allocate_from_stock: order line not found or not pending';
  END IF;

  IF v_line_variant != v_stock_variant THEN
    RAISE EXCEPTION 'allocate_from_stock: stock variant does not match order line variant';
  END IF;

  IF p_quantity > (v_line_qty - v_line_alloc) THEN
    RAISE EXCEPTION 'allocate_from_stock: quantity % exceeds line remaining %',
      p_quantity, (v_line_qty - v_line_alloc);
  END IF;

  -- Update order line; transition to allocated when fully filled
  UPDATE order_lines
  SET allocated_quantity = allocated_quantity + p_quantity,
      status = CASE
                 WHEN allocated_quantity + p_quantity >= quantity THEN 'allocated'
                 ELSE status
               END
  WHERE id = p_order_line_id;

  -- Consume stock: delete row when exhausted, otherwise decrement
  IF v_stock_qty - p_quantity = 0 THEN
    DELETE FROM available_stock WHERE id = p_stock_id;
  ELSE
    UPDATE available_stock
    SET quantity = quantity - p_quantity
    WHERE id = p_stock_id;
  END IF;

  -- Promote order to ready if all non-cancelled lines are now allocated
  IF NOT EXISTS (
    SELECT 1 FROM order_lines
    WHERE  order_id = v_order_id
      AND  status NOT IN ('allocated', 'cancelled')
  ) THEN
    UPDATE orders SET status = 'ready'
    WHERE  id = v_order_id AND status = 'pending';
  END IF;
END;
$$;


-- ── add_manual_stock ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.add_manual_stock(
  p_product_variant_id uuid,
  p_quantity           integer,
  p_notes              text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'add_manual_stock: quantity must be greater than zero';
  END IF;

  PERFORM 1 FROM product_variants
  WHERE id = p_product_variant_id AND business_id = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'add_manual_stock: product variant not found';
  END IF;

  INSERT INTO available_stock (product_variant_id, quantity, source, notes)
  VALUES (p_product_variant_id, p_quantity, 'manual', p_notes);
END;
$$;
