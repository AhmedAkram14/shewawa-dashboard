-- Migration 030: Add delivery_number column to deliveries
--
-- Migration 028 failed to add this column because a later statement in the
-- same transaction (the status check constraint) was rejected, rolling back
-- the whole batch. The table is now clean (migration 029), so add it directly.

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS delivery_number integer;

-- No rows exist at this point so the backfill is a no-op;
-- the UPDATE keeps the logic correct if any future re-run finds rows.
UPDATE public.deliveries d
SET delivery_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at) AS rn
  FROM public.deliveries
  WHERE delivery_number IS NULL
) sub
WHERE d.id = sub.id;

ALTER TABLE public.deliveries
  ALTER COLUMN delivery_number SET NOT NULL;

ALTER TABLE public.deliveries
  DROP CONSTRAINT IF EXISTS deliveries_business_id_delivery_number_key;

ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_business_id_delivery_number_key
  UNIQUE (business_id, delivery_number);
