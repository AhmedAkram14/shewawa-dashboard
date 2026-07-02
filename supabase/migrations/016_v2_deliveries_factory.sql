-- =============================================================================
-- v2 Migration 016 — Deliveries + Factory domain
--
-- Creates these tables in dependency order so foreign keys resolve:
--   deliveries            (referenced by orders.delivery_id in 017)
--   factory_orders        (referenced by factory_order_lines below)
--   factory_order_lines   (referenced by order_lines.factory_order_line_id in 017)
--
-- All monetary values are stored as integers (smallest currency unit — piastres)
-- to avoid floating-point rounding and PostgREST numeric→string coercion.
-- =============================================================================


-- ── deliveries ────────────────────────────────────────────────────────────────
-- A delivery dispatches one or more ready orders to a customer.
-- Orders link to their delivery via orders.delivery_id (set on createDelivery).
-- Status lifecycle: pending → dispatched → completed

CREATE TABLE IF NOT EXISTS public.deliveries (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid         NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  delivery_number integer      NOT NULL,
  status          text         NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'dispatched', 'completed')),
  dispatched_at   timestamptz,
  notes           text,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),

  UNIQUE (business_id, delivery_number)
);

CREATE INDEX IF NOT EXISTS deliveries_business_id_idx     ON public.deliveries (business_id);
CREATE INDEX IF NOT EXISTS deliveries_business_status_idx ON public.deliveries (business_id, status);

CREATE OR REPLACE TRIGGER deliveries_set_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliveries_select" ON public.deliveries;
CREATE POLICY "deliveries_select"
  ON public.deliveries FOR SELECT
  USING (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "deliveries_insert" ON public.deliveries;
CREATE POLICY "deliveries_insert"
  ON public.deliveries FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "deliveries_update" ON public.deliveries;
CREATE POLICY "deliveries_update"
  ON public.deliveries FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── factory_orders ────────────────────────────────────────────────────────────
-- One open factory order per factory per business at any time.
-- The partial unique index enforces this at the database level.
-- Status lifecycle: open → closed

CREATE TABLE IF NOT EXISTS public.factory_orders (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          uuid         NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  factory_order_number integer      NOT NULL,
  factory_id           uuid         NOT NULL REFERENCES public.factories (id) ON DELETE RESTRICT,
  status               text         NOT NULL DEFAULT 'open'
                                    CHECK (status IN ('open', 'closed')),
  notes                text,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now(),

  UNIQUE (business_id, factory_order_number)
);

-- Enforces the domain invariant: at most one open factory order per factory
-- per business. Violations are caught at the database level, not just application.
CREATE UNIQUE INDEX IF NOT EXISTS factory_orders_one_open_per_factory
  ON public.factory_orders (business_id, factory_id)
  WHERE (status = 'open');

CREATE INDEX IF NOT EXISTS factory_orders_business_id_idx    ON public.factory_orders (business_id);
CREATE INDEX IF NOT EXISTS factory_orders_factory_status_idx ON public.factory_orders (business_id, factory_id, status);

CREATE OR REPLACE TRIGGER factory_orders_set_updated_at
  BEFORE UPDATE ON public.factory_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.factory_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "factory_orders_select" ON public.factory_orders;
CREATE POLICY "factory_orders_select"
  ON public.factory_orders FOR SELECT
  USING (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "factory_orders_insert" ON public.factory_orders;
CREATE POLICY "factory_orders_insert"
  ON public.factory_orders FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "factory_orders_update" ON public.factory_orders;
CREATE POLICY "factory_orders_update"
  ON public.factory_orders FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── factory_order_lines ───────────────────────────────────────────────────────
-- One line per product variant per factory order.
-- quantity_received is always derived: SUM(factory_receipts.quantity)
-- for this factory_order_line_id — never stored here.
-- Immutable after creation: no updated_at, no UPDATE policy.

CREATE TABLE IF NOT EXISTS public.factory_order_lines (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_order_id    uuid         NOT NULL REFERENCES public.factory_orders (id) ON DELETE CASCADE,
  product_variant_id  uuid         NOT NULL REFERENCES public.product_variants (id) ON DELETE RESTRICT,
  quantity            integer      NOT NULL CHECK (quantity > 0),
  created_at          timestamptz  NOT NULL DEFAULT now(),

  UNIQUE (factory_order_id, product_variant_id)
);

CREATE INDEX IF NOT EXISTS factory_order_lines_factory_order_id_idx ON public.factory_order_lines (factory_order_id);
CREATE INDEX IF NOT EXISTS factory_order_lines_variant_id_idx       ON public.factory_order_lines (product_variant_id);

ALTER TABLE public.factory_order_lines ENABLE ROW LEVEL SECURITY;

-- RLS via parent factory_orders (no business_id column on this table by design)
DROP POLICY IF EXISTS "factory_order_lines_select" ON public.factory_order_lines;
CREATE POLICY "factory_order_lines_select"
  ON public.factory_order_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.factory_orders fo
      WHERE fo.id = factory_order_lines.factory_order_id
        AND fo.business_id = public.get_my_business_id()
    )
  );

DROP POLICY IF EXISTS "factory_order_lines_insert" ON public.factory_order_lines;
CREATE POLICY "factory_order_lines_insert"
  ON public.factory_order_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.factory_orders fo
      WHERE fo.id = factory_order_lines.factory_order_id
        AND fo.business_id = public.get_my_business_id()
    )
  );
