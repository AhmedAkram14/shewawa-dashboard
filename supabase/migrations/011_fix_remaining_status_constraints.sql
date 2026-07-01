-- ── Fix remaining status check constraints ───────────────────────────────────
-- Drops and recreates status CHECK constraints on listings, orders, and
-- factory_orders to guarantee the live DB matches the canonical domain values.
-- Safe to run even if the values are already correct.

-- listings --------------------------------------------------------------------
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN (
    'collecting', 'decision', 'ordered',
    'receiving', 'ready_for_packing',
    'reconciled', 'cancelled'
  ));

-- orders ----------------------------------------------------------------------
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('active', 'cancelled'));

-- factory_orders --------------------------------------------------------------
ALTER TABLE public.factory_orders DROP CONSTRAINT IF EXISTS factory_orders_status_check;
ALTER TABLE public.factory_orders
  ADD CONSTRAINT factory_orders_status_check
  CHECK (status IN ('draft', 'placed'));
