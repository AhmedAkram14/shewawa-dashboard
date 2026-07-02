-- =============================================================================
-- v2 Migration 015 — Infrastructure updates
--
-- 1. Add businesses.timezone for business-local date calculations.
-- 2. Add factories.notes (v2 field, missing from v1).
-- 3. Create business_counters — monotonically increasing business numbers
--    for orders, factory orders, and deliveries. Not a domain entity.
-- =============================================================================


-- ── 1. businesses.timezone ───────────────────────────────────────────────────
-- IANA timezone name. All "today" KPI calculations use this value so that
-- day boundaries follow the owner's business location, not the server UTC offset.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';


-- ── 2. factories.notes ───────────────────────────────────────────────────────

ALTER TABLE public.factories
  ADD COLUMN IF NOT EXISTS notes text;


-- ── 3. business_counters ─────────────────────────────────────────────────────
-- One row per business. Incremented in the same transaction as each entity
-- INSERT so the returned count becomes the business-facing number.
-- Gaps are acceptable — failed transactions do not reclaim skipped numbers.

CREATE TABLE IF NOT EXISTS public.business_counters (
  business_id           uuid    PRIMARY KEY
                                REFERENCES public.businesses (id) ON DELETE CASCADE,
  order_count           integer NOT NULL DEFAULT 0,
  factory_order_count   integer NOT NULL DEFAULT 0,
  delivery_count        integer NOT NULL DEFAULT 0
);

ALTER TABLE public.business_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_counters_select" ON public.business_counters;
CREATE POLICY "business_counters_select"
  ON public.business_counters FOR SELECT
  USING (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "business_counters_insert" ON public.business_counters;
CREATE POLICY "business_counters_insert"
  ON public.business_counters FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

DROP POLICY IF EXISTS "business_counters_update" ON public.business_counters;
CREATE POLICY "business_counters_update"
  ON public.business_counters FOR UPDATE
  USING  (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── 4. Auto-seed counter row on business creation ────────────────────────────
-- Extend handle_new_user to insert a business_counters row alongside the
-- businesses row. Idempotent — ON CONFLICT DO NOTHING handles re-runs.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_business_id uuid;
BEGIN
  INSERT INTO public.businesses (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'))
  RETURNING id INTO new_business_id;

  INSERT INTO public.users (id, business_id, role, full_name)
  VALUES (
    NEW.id,
    new_business_id,
    'owner',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  );

  INSERT INTO public.business_counters (business_id)
  VALUES (new_business_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
