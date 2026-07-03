-- Migration 040: Add unit_cost to factory_order_lines
-- The agreed per-unit factory price in piastres.
-- Nullable: cost is negotiated and set separately from order creation.
-- A positive CHECK ensures zero-price lines are never silently accepted.

ALTER TABLE public.factory_order_lines
  ADD COLUMN IF NOT EXISTS unit_cost integer CHECK (unit_cost > 0);
