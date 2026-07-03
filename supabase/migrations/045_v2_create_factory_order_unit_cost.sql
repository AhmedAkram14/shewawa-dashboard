-- Migration 045: pass unit_cost per variant group in create_factory_order
-- Each group in p_groups can now carry an optional unit_cost (integer, piastres).
-- If provided, it is set directly on the factory_order_line at creation time.

CREATE OR REPLACE FUNCTION public.create_factory_order(
  p_factory_id uuid,
  p_notes      text,
  p_groups     jsonb  -- [{product_variant_id, order_line_ids: [uuid,...], unit_cost?: integer}]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_factory_order_id       uuid;
  v_factory_order_number   integer;
  v_factory_order_line_id  uuid;
  v_group                  jsonb;
  v_group_i                integer := 0;
  v_expected_variant_id    uuid;
  v_actual_variant_id      uuid;
  v_order_line_id          uuid;
  v_order_line_ids         uuid[];
  v_group_qty              integer;
  v_unit_cost              integer;
  v_affected               integer;
BEGIN
  -- ── Validation (runs before any write) ──────────────────────────────────

  IF p_factory_id IS NULL THEN
    RAISE EXCEPTION 'create_factory_order: factory_id is required';
  END IF;

  PERFORM 1 FROM factories
  WHERE id = p_factory_id AND business_id = get_my_business_id();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'create_factory_order: factory not found';
  END IF;

  IF p_groups IS NULL OR jsonb_array_length(p_groups) = 0 THEN
    RAISE EXCEPTION 'create_factory_order: at least one line group is required';
  END IF;

  FOR v_group IN SELECT * FROM jsonb_array_elements(p_groups) LOOP
    v_group_i := v_group_i + 1;
    v_expected_variant_id := (v_group->>'product_variant_id')::uuid;

    IF v_group->'order_line_ids' IS NULL OR
       jsonb_array_length(v_group->'order_line_ids') = 0 THEN
      RAISE EXCEPTION 'create_factory_order: group % has no order lines', v_group_i;
    END IF;

    FOR v_order_line_id IN
      SELECT (value)::uuid FROM jsonb_array_elements_text(v_group->'order_line_ids')
    LOOP
      SELECT ol.product_variant_id INTO v_actual_variant_id
      FROM order_lines ol
      JOIN orders o ON o.id = ol.order_id
      WHERE ol.id = v_order_line_id
        AND o.business_id = get_my_business_id()
        AND ol.status = 'pending';

      IF NOT FOUND THEN
        RAISE EXCEPTION
          'create_factory_order: order line % is not available (not found, wrong business, or not pending)',
          v_order_line_id;
      END IF;

      IF v_actual_variant_id != v_expected_variant_id THEN
        RAISE EXCEPTION
          'create_factory_order: order line % does not match declared variant',
          v_order_line_id;
      END IF;
    END LOOP;
  END LOOP;

  -- ── Writes ───────────────────────────────────────────────────────────────

  INSERT INTO business_counters (business_id, factory_order_count)
  VALUES (get_my_business_id(), 1)
  ON CONFLICT (business_id) DO UPDATE
    SET factory_order_count = business_counters.factory_order_count + 1
  RETURNING factory_order_count INTO v_factory_order_number;

  INSERT INTO factory_orders (factory_order_number, factory_id, notes)
  VALUES (v_factory_order_number, p_factory_id, p_notes)
  RETURNING id INTO v_factory_order_id;

  FOR v_group IN SELECT * FROM jsonb_array_elements(p_groups) LOOP
    v_expected_variant_id := (v_group->>'product_variant_id')::uuid;

    -- Parse optional unit_cost; NULL or 0 → stored as NULL
    v_unit_cost := NULLIF((v_group->>'unit_cost')::integer, 0);

    SELECT ARRAY(
      SELECT (value)::uuid FROM jsonb_array_elements_text(v_group->'order_line_ids')
    ) INTO v_order_line_ids;

    SELECT COALESCE(SUM(quantity), 0) INTO v_group_qty
    FROM order_lines
    WHERE id = ANY(v_order_line_ids);

    INSERT INTO factory_order_lines (factory_order_id, product_variant_id, quantity, unit_cost)
    VALUES (v_factory_order_id, v_expected_variant_id, v_group_qty, v_unit_cost)
    RETURNING id INTO v_factory_order_line_id;

    UPDATE order_lines ol
    SET status                = 'at_factory',
        factory_order_line_id = v_factory_order_line_id
    FROM orders o
    WHERE ol.id = ANY(v_order_line_ids)
      AND ol.order_id = o.id
      AND o.business_id = get_my_business_id()
      AND ol.status = 'pending';

    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected != array_length(v_order_line_ids, 1) THEN
      RAISE EXCEPTION
        'create_factory_order: one or more order lines were already moved (concurrency conflict)';
    END IF;
  END LOOP;

  RETURN v_factory_order_id;
END;
$$;
