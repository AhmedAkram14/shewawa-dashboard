-- Migration 025: Align update_order guard with approved business rules.
--
-- Old guard: v_status != 'pending'
-- New guard: v_status IN ('ready', 'out_for_delivery', 'delivered', 'cancelled')
--
-- Both conditions are currently equivalent (the only pre-ready status is 'pending'),
-- but the blocklist form is semantically correct: it locks deposit/notes only once
-- the order reaches Ready, not generically when it leaves Pending. This ensures any
-- future intermediate order status would remain editable without touching this rule.

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

  -- Deposit and notes are locked once the order reaches Ready or beyond.
  IF v_status IN ('ready', 'out_for_delivery', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'update_order: deposit and notes cannot be changed once the order reaches %', v_status;
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
