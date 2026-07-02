-- Migration 024: update_order and cancel_order RPCs
--
-- update_order: edits deposit_amount and notes while order is pending.
-- cancel_order: atomically cancels all non-cancelled lines, frees any
--   allocated quantities to available_stock, then cancels the order.

-- ── update_order ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_order(
  p_order_id       uuid,
  p_deposit_amount integer,
  p_notes          text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM orders
  WHERE id = p_order_id AND business_id = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'update_order: order not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'update_order: order cannot be edited in status %', v_status;
  END IF;

  IF p_deposit_amount IS NULL OR p_deposit_amount < 0 THEN
    RAISE EXCEPTION 'update_order: deposit_amount must be zero or greater';
  END IF;

  UPDATE orders
  SET deposit_amount = p_deposit_amount,
      notes          = p_notes
  WHERE id = p_order_id;
END;
$$;


-- ── cancel_order ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status     text;
  v_line       RECORD;
  v_order_num  integer;
BEGIN
  SELECT status, order_number INTO v_status, v_order_num
  FROM orders
  WHERE id = p_order_id AND business_id = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cancel_order: order not found';
  END IF;

  IF v_status NOT IN ('pending', 'ready') THEN
    RAISE EXCEPTION 'cancel_order: order cannot be cancelled in status %', v_status;
  END IF;

  -- Process every non-cancelled line
  FOR v_line IN
    SELECT id, status, allocated_quantity, product_variant_id
    FROM order_lines
    WHERE order_id = p_order_id AND status != 'cancelled'
  LOOP
    -- Free any allocated quantity back to available stock
    IF v_line.allocated_quantity > 0 THEN
      INSERT INTO available_stock (product_variant_id, quantity, source, notes)
      VALUES (
        v_line.product_variant_id,
        v_line.allocated_quantity,
        'cancellation',
        'Freed from cancelled order #' || v_order_num
      );
    END IF;

    UPDATE order_lines SET status = 'cancelled'
    WHERE id = v_line.id;
  END LOOP;

  UPDATE orders SET status = 'cancelled'
  WHERE id = p_order_id;
END;
$$;
