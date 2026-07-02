-- Migration 022: record_factory_receipts RPC
-- Atomically records a batch of factory receipts, applies FIFO allocations,
-- routes surplus to available_stock, transitions order statuses, and closes
-- the factory_order when all lines are fully received.

CREATE OR REPLACE FUNCTION public.record_factory_receipts(
  p_factory_order_id uuid,
  p_received_at      timestamptz,
  p_notes            text,
  p_receipts         jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_receipt           jsonb;
  v_i                 integer := 0;
  v_fol_id            uuid;
  v_receipt_qty       integer;
  v_fol_ordered_qty   integer;
  v_fol_received_qty  integer;
  v_allocation        jsonb;
  v_j                 integer;
  v_ol_id             uuid;
  v_alloc_qty         integer;
  v_ol_quantity       integer;
  v_ol_allocated_qty  integer;
  v_ol_status         text;
  v_alloc_sum         integer;
  v_surplus           integer;
  v_variant_id        uuid;
  v_fo_number         integer;
  v_order_id          uuid;
  v_seen_fol_ids      uuid[] := '{}';
  v_incomplete_count  integer;
BEGIN
  -- ── Validation ──────────────────────────────────────────────────────────

  IF p_factory_order_id IS NULL THEN
    RAISE EXCEPTION 'record_factory_receipts: factory_order_id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM factory_orders
    WHERE id = p_factory_order_id AND business_id = get_my_business_id()
  ) THEN
    RAISE EXCEPTION 'record_factory_receipts: factory_order not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM factory_orders
    WHERE id = p_factory_order_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'record_factory_receipts: factory_order is already closed';
  END IF;

  IF p_receipts IS NULL OR jsonb_array_length(p_receipts) = 0 THEN
    RAISE EXCEPTION 'record_factory_receipts: at least one receipt entry is required';
  END IF;

  -- Validate each receipt entry before any writes
  FOR v_receipt IN SELECT * FROM jsonb_array_elements(p_receipts) LOOP
    v_i := v_i + 1;
    v_fol_id    := (v_receipt->>'factory_order_line_id')::uuid;
    v_receipt_qty := (v_receipt->>'quantity')::integer;

    IF v_fol_id IS NULL THEN
      RAISE EXCEPTION 'record_factory_receipts: receipt % missing factory_order_line_id', v_i;
    END IF;

    -- No duplicate factory_order_line in a single batch
    IF v_fol_id = ANY(v_seen_fol_ids) THEN
      RAISE EXCEPTION 'record_factory_receipts: duplicate factory_order_line_id in receipt %', v_i;
    END IF;
    v_seen_fol_ids := array_append(v_seen_fol_ids, v_fol_id);

    -- factory_order_line must belong to this factory_order
    SELECT quantity INTO v_fol_ordered_qty
    FROM factory_order_lines
    WHERE id = v_fol_id AND factory_order_id = p_factory_order_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'record_factory_receipts: receipt %: factory_order_line not found in this factory_order', v_i;
    END IF;

    IF v_receipt_qty IS NULL OR v_receipt_qty <= 0 THEN
      RAISE EXCEPTION 'record_factory_receipts: receipt % quantity must be greater than zero', v_i;
    END IF;

    -- Refinement 3: existing_received + new must not exceed ordered quantity
    SELECT COALESCE(SUM(quantity), 0) INTO v_fol_received_qty
    FROM factory_receipts
    WHERE factory_order_line_id = v_fol_id AND reversal_of IS NULL;

    IF v_fol_received_qty + v_receipt_qty > v_fol_ordered_qty THEN
      RAISE EXCEPTION
        'record_factory_receipts: receipt % would exceed ordered quantity (ordered=%, already_received=%, new=%)',
        v_i, v_fol_ordered_qty, v_fol_received_qty, v_receipt_qty;
    END IF;

    -- Validate each allocation within this receipt entry
    v_alloc_sum := 0;
    v_j := 0;
    FOR v_allocation IN SELECT * FROM jsonb_array_elements(v_receipt->'allocations') LOOP
      v_j := v_j + 1;
      v_ol_id     := (v_allocation->>'order_line_id')::uuid;
      v_alloc_qty := (v_allocation->>'quantity')::integer;

      IF v_ol_id IS NULL THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation % missing order_line_id', v_i, v_j;
      END IF;

      IF v_alloc_qty IS NULL OR v_alloc_qty < 0 THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation % quantity must be zero or greater', v_i, v_j;
      END IF;

      -- order_line must be linked to this factory_order_line
      SELECT ol.quantity, ol.allocated_quantity, ol.status
      INTO v_ol_quantity, v_ol_allocated_qty, v_ol_status
      FROM order_lines ol
      WHERE ol.id = v_ol_id AND ol.factory_order_line_id = v_fol_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation %: order_line not linked to this factory_order_line', v_i, v_j;
      END IF;

      IF v_ol_status = 'cancelled' THEN
        RAISE EXCEPTION 'record_factory_receipts: receipt %, allocation %: cannot allocate to a cancelled order_line', v_i, v_j;
      END IF;

      -- Allocation must not exceed unmet demand
      IF v_ol_allocated_qty + v_alloc_qty > v_ol_quantity THEN
        RAISE EXCEPTION
          'record_factory_receipts: receipt %, allocation %: allocation exceeds unmet demand (ordered=%, already_allocated=%, new_alloc=%)',
          v_i, v_j, v_ol_quantity, v_ol_allocated_qty, v_alloc_qty;
      END IF;

      v_alloc_sum := v_alloc_sum + v_alloc_qty;
    END LOOP;

    -- Total allocations must not exceed received quantity
    IF v_alloc_sum > v_receipt_qty THEN
      RAISE EXCEPTION
        'record_factory_receipts: receipt % total allocations (%) exceed received quantity (%)',
        v_i, v_alloc_sum, v_receipt_qty;
    END IF;
  END LOOP;

  -- ── Writes ───────────────────────────────────────────────────────────────

  FOR v_receipt IN SELECT * FROM jsonb_array_elements(p_receipts) LOOP
    v_fol_id      := (v_receipt->>'factory_order_line_id')::uuid;
    v_receipt_qty := (v_receipt->>'quantity')::integer;

    INSERT INTO factory_receipts (factory_order_line_id, quantity, received_at, notes)
    VALUES (v_fol_id, v_receipt_qty, p_received_at, p_notes);

    -- Apply each allocation
    v_alloc_sum := 0;
    FOR v_allocation IN SELECT * FROM jsonb_array_elements(v_receipt->'allocations') LOOP
      v_ol_id     := (v_allocation->>'order_line_id')::uuid;
      v_alloc_qty := (v_allocation->>'quantity')::integer;
      v_alloc_sum := v_alloc_sum + v_alloc_qty;

      IF v_alloc_qty > 0 THEN
        UPDATE order_lines
        SET
          allocated_quantity = allocated_quantity + v_alloc_qty,
          status = CASE
            WHEN allocated_quantity + v_alloc_qty >= quantity THEN 'allocated'
            ELSE status
          END
        WHERE id = v_ol_id;
      END IF;
    END LOOP;

    -- Route surplus to available_stock
    v_surplus := v_receipt_qty - v_alloc_sum;
    IF v_surplus > 0 THEN
      SELECT product_variant_id INTO v_variant_id
      FROM factory_order_lines WHERE id = v_fol_id;

      SELECT factory_order_number INTO v_fo_number
      FROM factory_orders WHERE id = p_factory_order_id;

      INSERT INTO available_stock (product_variant_id, quantity, source, notes)
      VALUES (
        v_variant_id,
        v_surplus,
        'factory_surplus',
        'Surplus from FO #' || v_fo_number
      );
    END IF;
  END LOOP;

  -- ── Transition order statuses to 'ready' ────────────────────────────────

  FOR v_order_id IN
    SELECT DISTINCT ol.order_id
    FROM order_lines ol
    JOIN factory_order_lines fol ON fol.id = ol.factory_order_line_id
    WHERE fol.factory_order_id = p_factory_order_id
  LOOP
    UPDATE orders
    SET status = 'ready'
    WHERE id = v_order_id
      AND status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM order_lines
        WHERE order_id = v_order_id
          AND status NOT IN ('allocated', 'cancelled')
      );
  END LOOP;

  -- ── Close factory_order if all lines fully received ──────────────────────

  SELECT COUNT(*) INTO v_incomplete_count
  FROM factory_order_lines fol
  WHERE fol.factory_order_id = p_factory_order_id
    AND (
      SELECT COALESCE(SUM(fr.quantity), 0)
      FROM factory_receipts fr
      WHERE fr.factory_order_line_id = fol.id
        AND fr.reversal_of IS NULL
    ) < fol.quantity;

  IF v_incomplete_count = 0 THEN
    UPDATE factory_orders SET status = 'closed'
    WHERE id = p_factory_order_id;
  END IF;
END;
$$;
