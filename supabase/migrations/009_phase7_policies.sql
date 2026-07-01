-- ── Phase 7: Missing RLS policies for Settings ───────────────────────────────
-- Adds UPDATE policies that are required for business name and user profile editing.
-- No new tables.

-- businesses: update own ------------------------------------------------------
CREATE POLICY "businesses: update own" ON public.businesses FOR UPDATE
  USING (id = public.get_my_business_id())
  WITH CHECK (id = public.get_my_business_id());

-- users: update own (profile only) -------------------------------------------
CREATE POLICY "users: update own" ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
