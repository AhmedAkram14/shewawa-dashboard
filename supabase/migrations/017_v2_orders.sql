-- =============================================================================
-- v2 Migration 017 — Orders domain
--
-- Creates:
--   orders              proper order headers (one per customer transaction)
--   order_lines         line items within an order
--   factory_receipts    records of physical factory deliveries (immutable)
--
-- Depends on: 016 (deliveries, factory_order_lines must exist first)
-- =============================================================================


-- ── orders ────────────────────────────────────────────────────────────────────
-- One row per customer transaction. An order is atomic: the customer receives
-- everything or waits — no partial deliveries.
-- Status lifecycle: pending → ready → out_for_delivery → delivered
--                                   ↘ cancelled (terminal)
-- delivered_at is set by completeDelivery and is the basis for delivered_today KPI.

CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid         NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  order_number     integer      NOT NULL,
  customer_id      uuid         NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  status           text         NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_id      uuid         REFERENCES public.deliveries (id) ON DELETE RESTRICT,
  deposit_amount   integer      NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  delivered_at     timestamptz,
  notes            text,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),

  UNIQUE (business_id, order_number)
);

CREATE INDEX IF NOT EXISTS orders_business_id_idx     ON public.orders (business_id);
CREATE INDEX IF NOT EXISTS orders_business_status_idx ON public.orders (business_id, status);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx     ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS orders_delivery_id_idx     ON public.orders (delivery_id);
-- Supports delivered_today KPI: filters by delivered_at date in business timezone
CREATE INDEX IF NOT EXISTS orders_delivered_at_idx    ON public.orders (business_id, delivered_at)
  WHERE delivered_at IS NOT NULL;

CREATE OR REPLACE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select"
  ON public.orders FOR SELECT
  USING (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert"
  ON public.orders FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update"
  ON public.orders FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── order_lines ───────────────────────────────────────────────────────────────
-- One row per product variant within an order.
-- allocated_quantity tracks confirmed allocation from factory or available stock.
-- Status lifecycle: pending → at_factory → allocated
--                          ↘ cancelled (terminal, triggered by cancelOrder)
--
-- factory_order_line_id: set when the line is sent to factory (status → at_factory).
-- Null means the line is either pending or fulfilled from available stock.

CREATE TABLE IF NOT EXISTS public.order_lines (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid         NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_variant_id    uuid         NOT NULL REFERENCES public.product_variants (id) ON DELETE RESTRICT,
  quantity              integer      NOT NULL CHECK (quantity > 0),
  unit_price            integer      NOT NULL CHECK (unit_price >= 0),
  allocated_quantity    integer      NOT NULL DEFAULT 0
                                     CHECK (allocated_quantity >= 0)
                                     CHECK (allocated_quantity <= quantity),
  factory_order_line_id uuid         REFERENCES public.factory_order_lines (id) ON DELETE RESTRICT,
  status                text         NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'at_factory', 'allocated', 'cancelled')),
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_lines_order_id_idx              ON public.order_lines (order_id);
CREATE INDEX IF NOT EXISTS order_lines_factory_order_line_id_idx ON public.order_lines (factory_order_line_id)
  WHERE factory_order_line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_lines_status_idx                ON public.order_lines (status);
CREATE INDEX IF NOT EXISTS order_lines_variant_id_idx            ON public.order_lines (product_variant_id);

CREATE OR REPLACE TRIGGER order_lines_set_updated_at
  BEFORE UPDATE ON public.order_lines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;

-- RLS via parent orders (no business_id column on this table by design)
DROP POLICY IF EXISTS "order_lines_select" ON public.order_lines;
CREATE POLICY "order_lines_select"
  ON public.order_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_lines.order_id
        AND o.business_id = public.get_my_business_id()
    )
  );

DROP POLICY IF EXISTS "order_lines_insert" ON public.order_lines;
CREATE POLICY "order_lines_insert"
  ON public.order_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_lines.order_id
        AND o.business_id = public.get_my_business_id()
    )
  );

DROP POLICY IF EXISTS "order_lines_update" ON public.order_lines;
CREATE POLICY "order_lines_update"
  ON public.order_lines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_lines.order_id
        AND o.business_id = public.get_my_business_id()
    )
  );


-- ── factory_receipts ──────────────────────────────────────────────────────────
-- Immutable record of a physical factory delivery event.
-- Normal receipts: quantity > 0, reversal_of IS NULL.
-- Reversal receipts: quantity < 0, reversal_of references the original row.
-- Zero quantity is never permitted.
-- Neither row type may be edited or deleted after insertion.
--
-- quantity_received for a factory_order_line is always derived:
--   SELECT SUM(quantity) FROM factory_receipts WHERE factory_order_line_id = X

CREATE TABLE IF NOT EXISTS public.factory_receipts (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_order_line_id uuid         NOT NULL REFERENCES public.factory_order_lines (id) ON DELETE RESTRICT,
  quantity              integer      NOT NULL CHECK (quantity != 0),
  reversal_of           uuid         REFERENCES public.factory_receipts (id),
  received_at           date         NOT NULL,
  notes                 text,
  created_at            timestamptz  NOT NULL DEFAULT now(),

  -- Immutability invariant: negative quantity iff reversal_of is set
  CONSTRAINT receipt_sign_matches_type CHECK (
    (reversal_of IS NULL     AND quantity > 0) OR
    (reversal_of IS NOT NULL AND quantity < 0)
  )
);

CREATE INDEX IF NOT EXISTS factory_receipts_factory_order_line_id_idx ON public.factory_receipts (factory_order_line_id);
-- Supports reversal lookup and audit trail
CREATE INDEX IF NOT EXISTS factory_receipts_reversal_of_idx           ON public.factory_receipts (reversal_of)
  WHERE reversal_of IS NOT NULL;

ALTER TABLE public.factory_receipts ENABLE ROW LEVEL SECURITY;

-- RLS via factory_order_lines → factory_orders (two-level EXISTS)
DROP POLICY IF EXISTS "factory_receipts_select" ON public.factory_receipts;
CREATE POLICY "factory_receipts_select"
  ON public.factory_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.factory_order_lines fol
      JOIN   public.factory_orders fo ON fo.id = fol.factory_order_id
      WHERE  fol.id = factory_receipts.factory_order_line_id
        AND  fo.business_id = public.get_my_business_id()
    )
  );

DROP POLICY IF EXISTS "factory_receipts_insert" ON public.factory_receipts;
CREATE POLICY "factory_receipts_insert"
  ON public.factory_receipts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.factory_order_lines fol
      JOIN   public.factory_orders fo ON fo.id = fol.factory_order_id
      WHERE  fol.id = factory_receipts.factory_order_line_id
        AND  fo.business_id = public.get_my_business_id()
    )
  );
-- No UPDATE or DELETE policies — factory_receipts are immutable by design.
