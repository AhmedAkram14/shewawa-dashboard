-- =============================================================================
-- Phase 1 — Tenancy Foundation
-- Run this in the Supabase SQL Editor (project → SQL Editor → New query).
-- Execute the entire file in one shot.
-- =============================================================================


-- ─── 1. businesses ───────────────────────────────────────────────────────────
-- One row per tenant. Every other table will reference this via business_id.

CREATE TABLE public.businesses (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ─── 2. users ────────────────────────────────────────────────────────────────
-- Extends auth.users with the tenant link and role.
-- id mirrors auth.users.id exactly — no separate PK sequence.

CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'owner'
                   CHECK (role IN ('owner', 'staff', 'viewer')),
  full_name   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast tenant-scoped lookups (used by get_my_business_id() on every query)
CREATE INDEX users_business_id_idx ON public.users (business_id);


-- ─── 3. Row Level Security ────────────────────────────────────────────────────

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;


-- Helper function ─────────────────────────────────────────────────────────────
-- Returns the business_id for the currently authenticated user.
-- SECURITY DEFINER bypasses RLS on the users table so the function
-- can read the row without triggering infinite policy recursion.
-- search_path is pinned to public to prevent search-path injection.

CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.users WHERE id = auth.uid()
$$;


-- businesses policies ─────────────────────────────────────────────────────────

-- Any authenticated member can read their own business record
CREATE POLICY "businesses_select_own"
  ON public.businesses FOR SELECT
  USING (id = public.get_my_business_id());

-- Only the owner role may update the business record
CREATE POLICY "businesses_update_owner"
  ON public.businesses FOR UPDATE
  USING (
    id = public.get_my_business_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'owner'
  )
  WITH CHECK (id = public.get_my_business_id());


-- users policies ──────────────────────────────────────────────────────────────

-- Any member can read all users within their business (needed for staff lists etc.)
CREATE POLICY "users_select_own_business"
  ON public.users FOR SELECT
  USING (business_id = public.get_my_business_id());

-- Only owner may insert new users (staff invitations — Phase 2+)
CREATE POLICY "users_insert_owner"
  ON public.users FOR INSERT
  WITH CHECK (
    business_id = public.get_my_business_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'owner'
  );

-- Only owner may update roles
CREATE POLICY "users_update_owner"
  ON public.users FOR UPDATE
  USING (
    business_id = public.get_my_business_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'owner'
  )
  WITH CHECK (business_id = public.get_my_business_id());


-- ─── 4. Auto-provision business + user on sign-up ────────────────────────────
-- Fires after every INSERT on auth.users (sign-up, manual creation in
-- Supabase dashboard, or magic-link invite).
-- Creates a businesses row, then a users row with role = 'owner'.
-- Reads optional metadata from the sign-up call:
--   { data: { business_name: "...", full_name: "..." } }

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_business_id uuid;
BEGIN
  INSERT INTO public.businesses (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'))
  RETURNING id INTO new_business_id;

  INSERT INTO public.users (id, business_id, role, full_name)
  VALUES (
    NEW.id,
    new_business_id,
    'owner',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
