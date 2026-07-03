-- Migration 031: Remove v1 customer_id from deliveries
--
-- The v1 deliveries table had customer_id NOT NULL (one delivery per customer).
-- The v2 design dropped customer_id because a delivery can bundle orders from
-- multiple customers. Drop the column so inserts succeed without it.

ALTER TABLE public.deliveries
  DROP COLUMN IF EXISTS customer_id;
