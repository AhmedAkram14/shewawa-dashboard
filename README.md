# SHE WAWA Dashboard

A mobile-first pre-order management dashboard for clothing businesses. Manages product listings, customer orders, factory commitments, deliveries, and live financial exposure across all active cycles simultaneously.

---

## Tech Stack

| Layer             | Technology                                        |
| ----------------- | ------------------------------------------------- |
| Framework         | Next.js 15 (App Router)                           |
| Language          | TypeScript (strict)                               |
| Styling           | Tailwind CSS v4 + shadcn/ui                       |
| Server state      | TanStack Query v5                                 |
| Validation        | Zod v4                                            |
| Backend           | Supabase (Auth · Postgres · RLS · Edge Functions) |
| Draft persistence | IndexedDB via `idb`                               |
| Linting           | ESLint + Prettier                                 |
| Pre-commit        | Husky + lint-staged                               |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/                # Sign-in page (Phase 2)
│   ├── (dashboard)/              # Protected route group
│   │   ├── today/                # Daily triage cockpit (Phase 7)
│   │   ├── orders/               # Full order list (Phase 3)
│   │   ├── customers/            # Customer book (Phase 2)
│   │   └── more/                 # Library hub (Phase 8)
│   ├── layout.tsx                # Root layout — QueryProvider
│   └── globals.css               # Design tokens + shadcn CSS vars
│
├── features/                     # One folder per domain — each isolated
│   ├── orders/                   # Order capture · lifecycle · cancellation
│   ├── listings/                 # Product cycles · demand · go/no-go
│   ├── customers/                # Customer book · reliability signals
│   ├── factory-orders/           # Factory commitments · consolidation
│   ├── deliveries/               # Bundled parcels · COD · refusal-to-stock
│   ├── available-stock/          # Resale pool · sunk-cost recovery
│   ├── money/                    # Live financial truth (owner only)
│   └── settings/                 # Business defaults (owner only)
│
│   Each feature contains:
│   ├── components/               # React components
│   ├── hooks/                    # Custom hooks (TanStack Query)
│   ├── api/                      # Supabase client calls
│   └── schemas/                  # Zod validation schemas
│
├── components/
│   ├── ui/                       # shadcn/ui generated components
│   └── providers/
│       └── query-provider.tsx    # TanStack QueryClient provider
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client (Client Components)
│   │   └── server.ts             # Server Supabase client (RSC / Route Handlers)
│   ├── env.ts                    # Zod-validated environment variables
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
│
├── hooks/                        # Global shared hooks
├── types/                        # Global TypeScript types (UserRole, Json, …)
└── middleware.ts                 # Session refresh + auth route guard
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd "SHEWAWA Dashboard"
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase project values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are available in your Supabase dashboard under **Settings → API**.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects `/` → `/today`.
Without a Supabase connection, the middleware will redirect every route to `/login`.

---

## Available Scripts

| Script                 | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start dev server with Turbopack  |
| `npm run build`        | Production build                 |
| `npm start`            | Start production server          |
| `npm run lint`         | Run ESLint                       |
| `npm run lint:fix`     | Run ESLint with auto-fix         |
| `npm run format`       | Format all files with Prettier   |
| `npm run format:check` | Check formatting without writing |
| `npm run type-check`   | TypeScript type-check (no emit)  |

---

## Environment Variables

| Variable                        | Required | Description                   |
| ------------------------------- | -------- | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Your Supabase project URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Your Supabase anon/public key |

Both are `NEXT_PUBLIC_` — they are safe to expose in the browser. They only allow requests that pass Supabase Row Level Security policies, which enforce tenant isolation and role-based access at the database level.

The app validates these at startup using `src/lib/env.ts`. If either is missing or malformed, the process throws immediately with a clear error message.

---

## Development Workflow

### Branching

```
main          — production-ready code only
dev           — integration branch
feat/<name>   — feature branches (one per phase or sub-feature)
fix/<name>    — bug fix branches
```

### Pre-commit hook

Husky runs `lint-staged` on every commit:

- `*.{ts,tsx}` — ESLint fix + Prettier format
- `*.{json,css,md}` — Prettier format

### Adding a shadcn component

```bash
npx shadcn@latest add <component-name>
```

Components land in `src/components/ui/`. Import them from `@/components/ui/<name>`.

---

## Architecture Decisions

### Why Next.js App Router?

Server Components allow direct Supabase queries without an additional API layer for read-heavy screens. Route Handlers provide a clean location for any server-side logic that doesn't belong in Supabase Edge Functions (e.g. form processing).

### Why Supabase JS client instead of Prisma?

Supabase RLS (Row Level Security) enforces tenant isolation and role-based access at the Postgres level. The JS client sends the user's JWT with every request, so RLS policies apply automatically. Prisma would bypass RLS on the server side, requiring manual tenant filtering on every query.

Two clients are provided:

- `src/lib/supabase/client.ts` — browser singleton, used in Client Components and TanStack Query hooks
- `src/lib/supabase/server.ts` — server client using `@supabase/ssr` + Next.js cookies, used in Server Components and Route Handlers

### Why TanStack Query?

The spec defines explicit query keys per feature (`['orders', filters]`, `['listing', id]`, etc.). TanStack Query provides deterministic cache invalidation, background refetching, and optimistic updates — all needed for a live financial dashboard where stale data has real consequences.

### Why Supabase Edge Functions for business logic?

Operations like `createOrder`, `decideListing`, and `generateFactoryOrder` must enforce invariants atomically (e.g. available-stock unit sold in one transaction, refuse → stock created per-unit). Edge Functions run inside Supabase's infrastructure with a direct Postgres connection, enabling proper transactions and bypassing RLS where the function itself enforces the rules.

### Role model

Three roles enforced at the Supabase RLS level:

- `owner` — full access including Money and Settings screens
- `staff` — operational access; Money and Settings rows are **absent**, not disabled
- `viewer` — read-only; no write actions shown

---

## Development Phases

| Phase | Scope                                           | Status   |
| ----- | ----------------------------------------------- | -------- |
| 0     | Project scaffold                                | Complete |
| 1     | Auth + tenancy foundation                       | Next     |
| 2     | Core data layer (Factories, Catalog, Customers) | Pending  |
| 3     | Listings + Orders (core loop)                   | Pending  |
| 4     | Factory Orders + consolidation logic            | Pending  |
| 5     | Fulfillment (Deliveries + Ready for Packing)    | Pending  |
| 6     | Money + Available Stock                         | Pending  |
| 7     | Today (aggregation screen)                      | Pending  |
| 8     | Collections + Settings + state audit            | Pending  |
| 9     | PWA + offline decision                          | Pending  |
| 10    | QA + owner walkthrough + production deploy      | Pending  |
