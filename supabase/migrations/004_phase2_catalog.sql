-- =============================================================================
-- Phase 2 — Product Catalog
-- Run in Supabase SQL Editor after 001_phase1_tenancy.sql.
-- =============================================================================


-- ─── Shared trigger function ──────────────────────────────────────────────────
-- Keeps updated_at current on any table that has the column.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ─── products ─────────────────────────────────────────────────────────────────

CREATE TABLE public.products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text        CHECK (char_length(description) <= 500),
  image_url   text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_business_id_idx ON public.products (business_id);

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select"
  ON public.products FOR SELECT
  USING (business_id = public.get_my_business_id());

CREATE POLICY "products_insert"
  ON public.products FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "products_update"
  ON public.products FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "products_delete"
  ON public.products FOR DELETE
  USING (business_id = public.get_my_business_id());


-- ─── product_variants ─────────────────────────────────────────────────────────
-- business_id is denormalised here so RLS can use get_my_business_id() directly
-- without a join to products, keeping policies simple and fast.
--
-- Prices are stored as integers (smallest currency unit — piastres/cents) to
-- avoid floating-point rounding and the numeric→string coercion that PostgREST
-- applies to NUMERIC columns. Divide by 100 in the UI when displaying as EGP.

CREATE TABLE public.product_variants (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  business_id   uuid        NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  name          text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  sku           text        CHECK (char_length(sku) <= 50),
  cost_price    integer     NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  selling_price integer     NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_variants_product_id_idx  ON public.product_variants (product_id);
CREATE INDEX product_variants_business_id_idx ON public.product_variants (business_id);

CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants_select"
  ON public.product_variants FOR SELECT
  USING (business_id = public.get_my_business_id());

CREATE POLICY "product_variants_insert"
  ON public.product_variants FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "product_variants_update"
  ON public.product_variants FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "product_variants_delete"
  ON public.product_variants FOR DELETE
  USING (business_id = public.get_my_business_id());
