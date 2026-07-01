-- =============================================================================
-- Phase 3 — Collections & Listings
-- Run in Supabase SQL Editor after 004_phase2_catalog.sql.
-- set_updated_at() was created in 004 and is reused here.
-- =============================================================================


-- ─── collections ─────────────────────────────────────────────────────────────
-- A collection groups listings into a named round (e.g. "Summer 2025").
-- collection_id on listings is nullable — a listing can exist without one.

CREATE TABLE public.collections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX collections_business_id_idx ON public.collections (business_id);

CREATE TRIGGER collections_set_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_select"
  ON public.collections FOR SELECT
  USING (business_id = public.get_my_business_id());

CREATE POLICY "collections_insert"
  ON public.collections FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "collections_update"
  ON public.collections FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());

-- No DELETE policy — collections are business history.


-- ─── listings ────────────────────────────────────────────────────────────────
-- One listing = one selling round of one catalog product.
-- Status lifecycle: collecting → decision → ordered → receiving
--                                        → ready_for_packing → reconciled
--                             ↘ cancelled (terminal)
--                             ↗ collecting  (Extend action resets closes_on)
--
-- Transitions are enforced at the API layer, not here.
-- No DELETE policy — listings are permanent business history.

CREATE TABLE public.listings (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid        NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  catalog_product_id uuid        NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  collection_id      uuid        REFERENCES public.collections (id) ON DELETE SET NULL,
  closes_on          timestamptz NOT NULL,
  threshold          integer     CHECK (threshold IS NULL OR threshold > 0),
  status             text        NOT NULL DEFAULT 'collecting'
                                 CHECK (status IN (
                                   'collecting', 'decision', 'ordered',
                                   'receiving', 'ready_for_packing',
                                   'reconciled', 'cancelled'
                                 )),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Composite index on (business_id, status) for status-filtered list queries
CREATE INDEX listings_business_status_idx        ON public.listings (business_id, status);
CREATE INDEX listings_catalog_product_id_idx     ON public.listings (catalog_product_id);
CREATE INDEX listings_collection_id_idx          ON public.listings (collection_id)
  WHERE collection_id IS NOT NULL;

CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_select"
  ON public.listings FOR SELECT
  USING (business_id = public.get_my_business_id());

CREATE POLICY "listings_insert"
  ON public.listings FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "listings_update"
  ON public.listings FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());
