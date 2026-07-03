-- Migration 028: Align deliveries table with v2 schema
--
-- Migration 016 used CREATE TABLE IF NOT EXISTS, so if the v1 deliveries table
-- already existed the new columns were silently skipped.
-- This migration adds the missing v2 columns idempotently.

-- ── Add missing columns ───────────────────────────────────────────────────────

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;

-- delivery_number requires careful handling because it is NOT NULL + UNIQUE.
-- Add it nullable first, backfill, then enforce NOT NULL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'deliveries'
      AND column_name  = 'delivery_number'
  ) THEN
    ALTER TABLE public.deliveries ADD COLUMN delivery_number integer;

    -- Assign sequential numbers within each business (no existing data = no-op)
    WITH numbered AS (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at) AS rn
      FROM public.deliveries
    )
    UPDATE public.deliveries d
    SET    delivery_number = n.rn
    FROM   numbered n
    WHERE  d.id = n.id;

    ALTER TABLE public.deliveries ALTER COLUMN delivery_number SET NOT NULL;

    ALTER TABLE public.deliveries
      ADD CONSTRAINT deliveries_business_id_delivery_number_key
      UNIQUE (business_id, delivery_number);
  END IF;
END;
$$;

-- ── Ensure status check covers v2 values ─────────────────────────────────────

ALTER TABLE public.deliveries
  DROP CONSTRAINT IF EXISTS deliveries_status_check;

ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_status_check
  CHECK (status IN ('pending', 'dispatched', 'completed'));

-- ── Ensure business_id DEFAULT is set (same as orders) ───────────────────────

ALTER TABLE public.deliveries
  ALTER COLUMN business_id SET DEFAULT public.get_my_business_id();

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS deliveries_business_id_idx
  ON public.deliveries (business_id);

CREATE INDEX IF NOT EXISTS deliveries_business_status_idx
  ON public.deliveries (business_id, status);

-- ── RLS policies (idempotent) ─────────────────────────────────────────────────

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

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER deliveries_set_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
