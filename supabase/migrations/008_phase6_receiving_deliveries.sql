-- ── Phase 6: Deliveries + Available Stock ────────────────────────────────────
-- Depends on: 001 (businesses), 004 (product_variants), 005 (listings),
--             006 (orders), 006 (customers)
-- Uses: set_updated_at() from 004

-- deliveries ------------------------------------------------------------------
-- A delivery is a customer shipment that may bundle orders from multiple listings.

CREATE TABLE public.deliveries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid        NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status      text        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'out_for_delivery', 'delivered', 'refused', 'failed')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_deliveries_business_id  ON public.deliveries(business_id);
CREATE INDEX idx_deliveries_customer_id  ON public.deliveries(customer_id);
CREATE INDEX idx_deliveries_status       ON public.deliveries(business_id, status);

CREATE TRIGGER set_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- No DELETE — deliveries are permanent business records.
CREATE POLICY "deliveries: select own" ON public.deliveries FOR SELECT
  USING (business_id = public.get_my_business_id());
CREATE POLICY "deliveries: insert own" ON public.deliveries FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());
CREATE POLICY "deliveries: update own" ON public.deliveries FOR UPDATE
  USING (business_id = public.get_my_business_id());

-- delivery_orders -------------------------------------------------------------
-- Junction table — links multiple orders to one delivery. Immutable after creation.

CREATE TABLE public.delivery_orders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  delivery_id uuid        NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  order_id    uuid        NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (delivery_id, order_id)
);

ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_delivery_orders_delivery_id ON public.delivery_orders(delivery_id);
CREATE INDEX idx_delivery_orders_order_id    ON public.delivery_orders(order_id);

-- No UPDATE or DELETE — junction rows are immutable.
CREATE POLICY "delivery_orders: select own" ON public.delivery_orders FOR SELECT
  USING (business_id = public.get_my_business_id());
CREATE POLICY "delivery_orders: insert own" ON public.delivery_orders FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

-- available_stock -------------------------------------------------------------
-- Persistent stock entity. Each row is one intentional addition event (audited).
-- listing_id is nullable: manual additions may have no originating listing,
-- but business-generated stock (cancellations, refusals, overstock) should
-- populate it for traceability.

CREATE TABLE public.available_stock (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  variant_id  uuid        NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  listing_id  uuid        REFERENCES public.listings(id) ON DELETE SET NULL,
  quantity    integer     NOT NULL CHECK (quantity > 0),
  reason      text        NOT NULL
              CHECK (reason IN (
                'factory_extra',
                'inventory_correction',
                'returned_item',
                'old_stock',
                'other'
              )),
  notes       text,
  created_by  uuid        REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.available_stock ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_available_stock_business_id ON public.available_stock(business_id);
CREATE INDEX idx_available_stock_variant_id  ON public.available_stock(variant_id);
CREATE INDEX idx_available_stock_listing_id  ON public.available_stock(listing_id);

CREATE TRIGGER set_available_stock_updated_at
  BEFORE UPDATE ON public.available_stock
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- No DELETE — stock entries are permanent audit records.
CREATE POLICY "available_stock: select own" ON public.available_stock FOR SELECT
  USING (business_id = public.get_my_business_id());
CREATE POLICY "available_stock: insert own" ON public.available_stock FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());
CREATE POLICY "available_stock: update own" ON public.available_stock FOR UPDATE
  USING (business_id = public.get_my_business_id());
