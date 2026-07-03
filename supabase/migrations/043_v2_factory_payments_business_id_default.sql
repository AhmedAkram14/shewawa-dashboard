-- Migration 043: add DEFAULT get_my_business_id() to factory_payments.business_id
-- Without this, INSERT without an explicit business_id fails the RLS WITH CHECK
-- (business_id = get_my_business_id()) because the column has no default and
-- the client does not pass business_id directly.

ALTER TABLE public.factory_payments
  ALTER COLUMN business_id SET DEFAULT get_my_business_id();
