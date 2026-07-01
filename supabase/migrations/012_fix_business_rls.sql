-- ── Fix businesses RLS policy conflict ───────────────────────────────────────
-- Migration 009 added "businesses: update own" with no role check.
-- PostgreSQL applies OR logic between same-command policies on the same table,
-- so that policy was overriding the owner-only restriction from 001.
-- Drop the permissive policy; the original businesses_update_owner is sufficient.

DROP POLICY IF EXISTS "businesses: update own" ON public.businesses;
