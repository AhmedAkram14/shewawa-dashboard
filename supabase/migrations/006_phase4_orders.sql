-- ── Phase 4: Customers + Orders ──────────────────────────────────────────────
-- Depends on: 001 (businesses), 004 (product_variants), 005 (listings)
-- Uses: set_updated_at() from 004

-- customers -------------------------------------------------------------------

CREATE TABLE public.customers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  address     text        NOT NULL,
  phone       text        CHECK (phone IS NULL OR char_length(phone) <= 50),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_customers_business_id ON public.customers(business_id);

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "customers: select own"
  ON public.customers FOR SELECT
  USING (business_id = public.get_my_business_id());

CREATE POLICY "customers: insert own"
  ON public.customers FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "customers: update own"
  ON public.customers FOR UPDATE
  USING (business_id = public.get_my_business_id());

-- orders ----------------------------------------------------------------------

CREATE TABLE public.orders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  listing_id  uuid        NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  customer_id uuid        NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  variant_id  uuid        NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity    integer     NOT NULL CHECK (quantity > 0),
  unit_price  integer     NOT NULL CHECK (unit_price >= 0),
  notes       text,
  status      text        NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_listing_id         ON public.orders(listing_id);
CREATE INDEX idx_orders_customer_id        ON public.orders(customer_id);
CREATE INDEX idx_orders_business_id_status ON public.orders(business_id, status);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- No DELETE policy — order history is permanent.
CREATE POLICY "orders: select own"
  ON public.orders FOR SELECT
  USING (business_id = public.get_my_business_id());

CREATE POLICY "orders: insert own"
  ON public.orders FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "orders: update own"
  ON public.orders FOR UPDATE
  USING (business_id = public.get_my_business_id());
