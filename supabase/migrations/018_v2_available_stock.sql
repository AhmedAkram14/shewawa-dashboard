-- =============================================================================
-- v2 Migration 018 — Available Stock
--
-- available_stock rows are permanent audit records.
-- Each row represents one intentional stock addition event.
-- Rows are removed (via application DELETE) only when fully allocated —
-- they are never updated in place.
--
-- source values:
--   factory_surplus  — surplus quantity from a confirmed factory receipt allocation
--   cancellation     — released from a cancelled order that had allocated_quantity > 0
--   manual           — owner-entered adjustment
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.available_stock (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid         NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  product_variant_id  uuid         NOT NULL REFERENCES public.product_variants (id) ON DELETE RESTRICT,
  quantity            integer      NOT NULL CHECK (quantity > 0),
  source              text         NOT NULL
                                   CHECK (source IN ('factory_surplus', 'cancellation', 'manual')),
  notes               text,
  created_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS available_stock_business_id_idx ON public.available_stock (business_id);
CREATE INDEX IF NOT EXISTS available_stock_variant_idx     ON public.available_stock (business_id, product_variant_id);

ALTER TABLE public.available_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "available_stock_select" ON public.available_stock;
CREATE POLICY "available_stock_select"
  ON public.available_stock FOR SELECT
  USING (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "available_stock_insert" ON public.available_stock;
CREATE POLICY "available_stock_insert"
  ON public.available_stock FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

-- UPDATE is needed so the application can decrement quantity during partial allocation.
-- A row whose quantity reaches zero is deleted, not zeroed, to honour the CHECK constraint.
DROP POLICY IF EXISTS "available_stock_update" ON public.available_stock;
CREATE POLICY "available_stock_update"
  ON public.available_stock FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());

-- DELETE is permitted so exhausted rows can be removed atomically within the
-- allocateFromStock transaction.
DROP POLICY IF EXISTS "available_stock_delete" ON public.available_stock;
CREATE POLICY "available_stock_delete"
  ON public.available_stock FOR DELETE
  USING (business_id = public.get_my_business_id());
