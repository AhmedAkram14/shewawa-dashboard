-- ── Phase 5: Factories + Factory Orders ──────────────────────────────────────
-- Depends on: 001 (businesses), 004 (product_variants), 005 (listings), 006 (orders)
-- Uses: set_updated_at() from 004

-- factories -------------------------------------------------------------------

CREATE TABLE public.factories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  contact     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_factories_business_id ON public.factories(business_id);

CREATE TRIGGER set_factories_updated_at
  BEFORE UPDATE ON public.factories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "factories: select own" ON public.factories FOR SELECT
  USING (business_id = public.get_my_business_id());
CREATE POLICY "factories: insert own" ON public.factories FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());
CREATE POLICY "factories: update own" ON public.factories FOR UPDATE
  USING (business_id = public.get_my_business_id());

-- products: add factory_id ---------------------------------------------------
-- Nullable — existing products are not yet assigned to a factory.
ALTER TABLE public.products
  ADD COLUMN factory_id uuid REFERENCES public.factories(id) ON DELETE SET NULL;

-- factory_orders --------------------------------------------------------------

CREATE TABLE public.factory_orders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  factory_id  uuid        NOT NULL REFERENCES public.factories(id) ON DELETE RESTRICT,
  reference   text,
  status      text        NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'placed')),
  notes       text,
  placed_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.factory_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_factory_orders_business_id ON public.factory_orders(business_id);
CREATE INDEX idx_factory_orders_factory_id  ON public.factory_orders(factory_id);
CREATE INDEX idx_factory_orders_status      ON public.factory_orders(business_id, status);

CREATE TRIGGER set_factory_orders_updated_at
  BEFORE UPDATE ON public.factory_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- No DELETE — factory orders are permanent business records.
CREATE POLICY "factory_orders: select own" ON public.factory_orders FOR SELECT
  USING (business_id = public.get_my_business_id());
CREATE POLICY "factory_orders: insert own" ON public.factory_orders FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());
CREATE POLICY "factory_orders: update own" ON public.factory_orders FOR UPDATE
  USING (business_id = public.get_my_business_id());

-- factory_order_lines ---------------------------------------------------------
-- Immutable after creation — no updated_at, no UPDATE policy.

CREATE TABLE public.factory_order_lines (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  factory_order_id uuid        NOT NULL REFERENCES public.factory_orders(id) ON DELETE CASCADE,
  listing_id       uuid        NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  variant_id       uuid        NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity         integer     NOT NULL CHECK (quantity > 0),
  unit_cost        integer     NOT NULL CHECK (unit_cost >= 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.factory_order_lines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fol_factory_order_id ON public.factory_order_lines(factory_order_id);
CREATE INDEX idx_fol_listing_id       ON public.factory_order_lines(listing_id);

CREATE POLICY "factory_order_lines: select own" ON public.factory_order_lines FOR SELECT
  USING (business_id = public.get_my_business_id());
CREATE POLICY "factory_order_lines: insert own" ON public.factory_order_lines FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

-- listings: add factory_order_id ---------------------------------------------
ALTER TABLE public.listings
  ADD COLUMN factory_order_id uuid REFERENCES public.factory_orders(id) ON DELETE SET NULL;
