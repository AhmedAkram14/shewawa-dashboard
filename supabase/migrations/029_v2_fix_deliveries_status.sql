-- Migration 029: Clear v1 delivery data and apply v2 status constraint
--
-- The v1 deliveries table has rows whose status values are not in the v2
-- allowed set ('pending', 'dispatched', 'completed'), so migration 028 could
-- not add the check constraint. This migration:
--   1. Detaches any orders that reference old deliveries.
--   2. Deletes all v1 delivery rows.
--   3. Resets the business_counters.delivery_count to 0.
--   4. Applies the v2 status check constraint.

-- Detach orders from stale deliveries so the FK doesn't block the DELETE
UPDATE public.orders
SET delivery_id = NULL,
    status      = CASE
                    WHEN status = 'out_for_delivery' THEN 'ready'
                    WHEN status = 'delivered'        THEN 'delivered'
                    ELSE status
                  END
WHERE delivery_id IS NOT NULL;

-- Wipe v1 delivery rows
DELETE FROM public.deliveries;

-- Reset counter so delivery numbering starts at 1
UPDATE public.business_counters
SET delivery_count = 0
WHERE business_id = (
  SELECT business_id FROM public.orders LIMIT 1
);

-- Now the table is empty — safe to add the constraint
ALTER TABLE public.deliveries
  DROP CONSTRAINT IF EXISTS deliveries_status_check;

ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_status_check
  CHECK (status IN ('pending', 'dispatched', 'completed'));
