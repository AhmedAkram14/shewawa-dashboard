-- Migration 021: create_factory_order RPC
-- Atomic factory order creation: counter increment + factory_orders INSERT +
-- factory_order_lines INSERTs + order_lines status update to at_factory.
-- All validation runs before any write. Quantity is derived from live
-- order_line rows — never trusted from the client.

CREATE OR REPLACE FUNCTION public.create_factory_order(
  p_factory_id uuid,
  p_notes      text,
  p_groups     jsonb  -- [{product_variant_id, order_line_ids: [uuid, ...]}]
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
      SELECT product_variant_id INTO v_actual_variant_id
      FROM order_lines
      WHERE id = v_order_line_id
        AND business_id = get_my_business_id()
        AND status = 'pending';

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

  UPDATE business_counters
  SET    factory_order_count = factory_order_count + 1
  WHERE  business_id = get_my_business_id()
  RETURNING factory_order_count INTO v_factory_order_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'create_factory_order: no business_counters row for current user';
  END IF;

  INSERT INTO factory_orders (factory_order_number, factory_id, notes)
  VALUES (v_factory_order_number, p_factory_id, p_notes)
  RETURNING id INTO v_factory_order_id;

  FOR v_group IN SELECT * FROM jsonb_array_elements(p_groups) LOOP
    v_expected_variant_id := (v_group->>'product_variant_id')::uuid;

    SELECT ARRAY(
      SELECT (value)::uuid FROM jsonb_array_elements_text(v_group->'order_line_ids')
    ) INTO v_order_line_ids;

    -- Quantity derived from live rows, not from client payload
    SELECT COALESCE(SUM(quantity), 0) INTO v_group_qty
    FROM order_lines
    WHERE id = ANY(v_order_line_ids);

    INSERT INTO factory_order_lines (factory_order_id, product_variant_id, quantity)
    VALUES (v_factory_order_id, v_expected_variant_id, v_group_qty)
    RETURNING id INTO v_factory_order_line_id;

    -- Concurrency guard: exact row count must match
    UPDATE order_lines
    SET status               = 'at_factory',
        factory_order_line_id = v_factory_order_line_id
    WHERE id = ANY(v_order_line_ids)
      AND business_id = get_my_business_id()
      AND status = 'pending';

    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected != array_length(v_order_line_ids, 1) THEN
      RAISE EXCEPTION
        'create_factory_order: one or more order lines were already moved (concurrency conflict)';
    END IF;
  END LOOP;

  RETURN v_factory_order_id;
END;
$$;
