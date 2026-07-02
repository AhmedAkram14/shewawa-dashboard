-- =============================================================================
-- v2 Migration 014 — Drop v1 domain tables
--
-- The v1 domain (Listings / Collections) has been superseded by the v2
-- domain model. Drop all v1-specific tables in reverse dependency order,
-- then remove v1-only columns from surviving tables.
--
-- Surviving tables (products, product_variants, customers, factories,
-- businesses, users) are left intact and updated in 015.
-- =============================================================================


-- ── 1. Junction / leaf tables ─────────────────────────────────────────────────

-- delivery_orders joined v1 orders to v1 deliveries
DROP TABLE IF EXISTS public.delivery_orders;

-- available_stock referenced v1 listings
DROP TABLE IF EXISTS public.available_stock;

-- factory_order_lines referenced v1 listings and v1 factory_orders
DROP TABLE IF EXISTS public.factory_order_lines;


-- ── 2. v1 orders (was really an order-line in v2 terms) ──────────────────────
-- Must drop before listings because orders.listing_id → listings

DROP TABLE IF EXISTS public.orders;


-- ── 3. listings (referenced by factory_order_lines, orders, available_stock) ─

DROP TABLE IF EXISTS public.listings;


-- ── 4. factory_orders ────────────────────────────────────────────────────────
-- listings.factory_order_id was the only reverse reference; listings is gone.

DROP TABLE IF EXISTS public.factory_orders;


-- ── 5. collections ───────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.collections;


-- ── 6. Remove v1-only columns from surviving tables ──────────────────────────

-- products.factory_id was added in migration 007 and is not part of v2
ALTER TABLE public.products DROP COLUMN IF EXISTS factory_id;
