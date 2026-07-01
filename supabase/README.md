# Supabase — Database Migrations

Migrations are plain SQL files run manually in the **Supabase SQL Editor**
(project → SQL Editor → New query → paste → Run).

The Supabase CLI is not required for local development. Files are numbered
sequentially per phase.

## Running order

| File                              | When to run                                        |
| --------------------------------- | -------------------------------------------------- |
| `001_phase1_tenancy.sql`          | Phase 1 — immediately after project is provisioned |
| `002_phase1_rls_verification.sql` | Phase 1 — after 001, before any other phase        |
| `003_phase1_rls_cleanup.sql`      | Phase 1 — after RLS verification passes            |

## RLS verification (mandatory before Phase 2)

See the comments inside `002_phase1_rls_verification.sql` for step-by-step
instructions. Cross-tenant access must be confirmed as denied before
proceeding. This is a hard gate in the development roadmap.

## Supabase project setup checklist

1. Create a new Supabase project at supabase.com
2. Copy **Project URL** and **anon/public key** from Settings → API
3. Paste into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In the SQL Editor, run `001_phase1_tenancy.sql`
5. Run `002_phase1_rls_verification.sql`
6. Follow the verification steps in that file using two test accounts
7. Run `003_phase1_rls_cleanup.sql`
8. Enable **Email** auth provider in Authentication → Providers (enabled by default)
9. Optionally disable **Confirm email** in Authentication → Settings for
   faster local development (re-enable before production)
