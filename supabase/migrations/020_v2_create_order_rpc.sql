-- Migration 020: create_order RPC
-- Atomic order creation: counter increment + orders INSERT + order_lines INSERTs
-- All validation runs before any write so a failed call leaves no side effects.

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_id    uuid,
  p_deposit_amount integer,
  p_notes          text,
  p_lines          jsonb   -- [{product_variant_id, quantity, unit_price}]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id     uuid;
  v_order_number integer;
  v_line         jsonb;
  v_i            integer := 0;
BEGIN
  -- ── Validation (runs before any write) ──────────────────────────────────

  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'create_order: customer_id is required';
  END IF;

  PERFORM 1 FROM customers
  WHERE id = p_customer_id AND business_id = get_my_business_id();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'create_order: customer not found';
  END IF;

  IF p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'create_order: order must contain at least one line';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_i := v_i + 1;

    IF (v_line->>'quantity') IS NULL OR (v_line->>'quantity')::integer <= 0 THEN
      RAISE EXCEPTION 'create_order: line % quantity must be greater than zero', v_i;
    END IF;

    IF (v_line->>'unit_price') IS NULL OR (v_line->>'unit_price')::integer < 0 THEN
      RAISE EXCEPTION 'create_order: line % unit_price must be zero or greater', v_i;
    END IF;

    PERFORM 1 FROM product_variants
    WHERE id = (v_line->>'product_variant_id')::uuid
      AND business_id = get_my_business_id();
    IF NOT FOUND THEN
      RAISE EXCEPTION 'create_order: line % references an unknown product variant', v_i;
    END IF;
  END LOOP;

  -- ── Writes ───────────────────────────────────────────────────────────────

  UPDATE business_counters
  SET    order_count = order_count + 1
  WHERE  business_id = get_my_business_id()
  RETURNING order_count INTO v_order_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'create_order: no business_counters row for current user';
  END IF;

  INSERT INTO orders (order_number, customer_id, deposit_amount, notes)
  VALUES (v_order_number, p_customer_id, p_deposit_amount, p_notes)
  RETURNING id INTO v_order_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    INSERT INTO order_lines (order_id, product_variant_id, quantity, unit_price)
    VALUES (
      v_order_id,
      (v_line->>'product_variant_id')::uuid,
      (v_line->>'quantity')::integer,
      (v_line->>'unit_price')::integer
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;
