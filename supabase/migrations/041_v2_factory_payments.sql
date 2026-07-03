-- Migration 041: factory_payments — actual money sent to factories
-- A factory receipt confirms goods received; a factory payment confirms money sent.
-- These are independent events: a business may pay before, during, or after receipt.
-- Payments are immutable ledger entries — no UPDATE or DELETE policies.

CREATE TABLE IF NOT EXISTS public.factory_payments (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid         NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  factory_order_id uuid         NOT NULL REFERENCES public.factory_orders (id) ON DELETE RESTRICT,
  amount           integer      NOT NULL CHECK (amount > 0),
  paid_at          date         NOT NULL,
  reference        text,
  notes            text,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS factory_payments_business_id_idx      ON public.factory_payments (business_id);
CREATE INDEX IF NOT EXISTS factory_payments_factory_order_id_idx ON public.factory_payments (factory_order_id);

ALTER TABLE public.factory_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "factory_payments_select" ON public.factory_payments;
CREATE POLICY "factory_payments_select"
  ON public.factory_payments FOR SELECT
  USING (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "factory_payments_insert" ON public.factory_payments;
CREATE POLICY "factory_payments_insert"
  ON public.factory_payments FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

-- ── set_factory_line_cost RPC ─────────────────────────────────────────────────
-- Updates unit_cost on a single factory_order_line.
-- Verifies ownership via the parent factory_order.business_id.
-- factory_order_lines has no UPDATE RLS policy by design (lines are immutable
-- structurally); cost negotiation is a financial annotation, handled here via
-- SECURITY DEFINER with an explicit ownership check.

CREATE OR REPLACE FUNCTION public.set_factory_line_cost(
  p_line_id   uuid,
  p_unit_cost integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_unit_cost IS NOT NULL AND p_unit_cost <= 0 THEN
    RAISE EXCEPTION 'unit_cost must be positive';
  END IF;

  UPDATE factory_order_lines fol
  SET    unit_cost = p_unit_cost
  FROM   factory_orders fo
  WHERE  fol.id             = p_line_id
    AND  fo.id              = fol.factory_order_id
    AND  fo.business_id     = get_my_business_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'factory_order_line not found or access denied';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_factory_line_cost(uuid, integer) TO authenticated;
