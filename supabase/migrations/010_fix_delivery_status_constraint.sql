-- ── Fix deliveries status check constraint ────────────────────────────────────
-- The original constraint was created without 'out_for_delivery'.
-- Drop and recreate with the full canonical set.

ALTER TABLE public.deliveries DROP CONSTRAINT deliveries_status_check;

ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_status_check
  CHECK (status IN ('pending', 'out_for_delivery', 'delivered', 'refused', 'failed'));
