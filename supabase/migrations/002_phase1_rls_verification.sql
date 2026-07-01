-- =============================================================================
-- Phase 1 — RLS Verification (throwaway table)
-- Per spec §Phase 1: "RLS policy pattern established and tested on a throwaway
-- table before any real data model is built."
--
-- STEP 1  Run this file in the Supabase SQL Editor.
-- STEP 2  Follow the VERIFICATION STEPS below using two separate accounts.
-- STEP 3  Once verified, run 003_phase1_rls_cleanup.sql to drop this table.
--         Do NOT proceed to Phase 2 until verification passes.
-- =============================================================================


-- ─── Throwaway test table ─────────────────────────────────────────────────────

CREATE TABLE public.rls_test (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  value       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rls_test ENABLE ROW LEVEL SECURITY;


-- Apply the same policy pattern that every future table will use

CREATE POLICY "rls_test_select"
  ON public.rls_test FOR SELECT
  USING (business_id = public.get_my_business_id());

CREATE POLICY "rls_test_insert"
  ON public.rls_test FOR INSERT
  WITH CHECK (business_id = public.get_my_business_id());

CREATE POLICY "rls_test_delete"
  ON public.rls_test FOR DELETE
  USING (business_id = public.get_my_business_id());


-- =============================================================================
-- VERIFICATION STEPS
-- =============================================================================
--
-- These steps verify that RLS actually denies cross-tenant access.
-- Use the Supabase SQL Editor or the app's sign-up flow.
--
-- ── Account A ────────────────────────────────────────────────────────────────
-- 1. Sign up as user_a@example.com (creates business_a automatically via trigger)
--
-- 2. In the SQL Editor, switch to "API" mode and authenticate as user_a,
--    OR use the running dev server sign-in to get a session, then run via JS:
--
--    const { data } = await supabase
--      .from('rls_test')
--      .insert({ business_id: (await supabase.rpc('get_my_business_id')).data, value: 'secret_a' })
--    console.log(data)   // should show the inserted row
--
-- 3. Read back:
--    const { data } = await supabase.from('rls_test').select()
--    console.log(data)   // should return [ { value: 'secret_a', ... } ]
--
-- ── Account B ────────────────────────────────────────────────────────────────
-- 4. Sign up as user_b@example.com (creates business_b automatically)
--
-- 5. Attempt to read:
--    const { data } = await supabase.from('rls_test').select()
--    console.log(data)   // MUST return [] — zero rows, not user_a's data
--
-- ── Confirm ──────────────────────────────────────────────────────────────────
-- 6. If step 5 returns [] ✓  RLS is working correctly. Run 003 to clean up.
--    If step 5 returns user_a's row ✗  DO NOT proceed — re-check policies.
--
-- =============================================================================
