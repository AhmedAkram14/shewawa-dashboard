-- =============================================================================
-- v2 Migration 019 — Canonical tenancy: DEFAULT get_my_business_id()
--
-- Adds DEFAULT get_my_business_id() to every table where clients INSERT
-- business-owned rows. The DB fills in business_id from the caller's JWT
-- context, so no client code ever needs to know or pass business_id.
--
-- business_id remains NOT NULL — the DEFAULT satisfies this constraint.
--
-- business_id immutability:
--   The UPDATE RLS policies use USING + WITH CHECK (business_id = get_my_business_id()).
--   A caller can only update rows they own and the result must still be owned
--   by them, so business_id cannot be changed to any other value in practice.
-- =============================================================================

-- ── Pre-v2 tables (column exists, add DEFAULT) ────────────────────────────────

ALTER TABLE public.products
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();

ALTER TABLE public.product_variants
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();

ALTER TABLE public.customers
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();

ALTER TABLE public.factories
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();

-- ── v2 tables from migrations 016–018 ────────────────────────────────────────

ALTER TABLE public.deliveries
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();

ALTER TABLE public.factory_orders
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();

ALTER TABLE public.orders
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();

ALTER TABLE public.available_stock
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();
