-- =============================================================================
-- Phase 1 — RLS Cleanup
-- Run ONLY after completing the verification steps in 002_phase1_rls_verification.sql
-- and confirming that cross-tenant access is correctly denied.
-- =============================================================================

DROP TABLE IF EXISTS public.rls_test;
