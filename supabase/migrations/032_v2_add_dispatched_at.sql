-- Migration 032: Add dispatched_at column to deliveries
-- Migration 028 was rolled back in full; this adds the column that was lost.

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
