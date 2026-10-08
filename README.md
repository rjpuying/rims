# RIMS — Rice POS & Inventory Management System

Production system for **Brick Eight Trading Inc.** One warehouse. Rice and Palay tracked separately. All inventory mutations are atomic database transactions.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage, RLS, RPC)
- Vercel deployment

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in the Supabase values.
4. Apply database migrations: `supabase link --project-ref <ref>` then `supabase db push`
5. Run the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000).

## Scripts

```text
npm run dev       development server
npm run build     production build
npm run lint      eslint
npm run test:db   database test suite (rollback-only, safe on the remote DB)
npm run db:sql    run ad-hoc SQL: npm run db:sql -- -c "select 1"
```

## Documentation

- `features.md` — full feature specification
- `database_architecture.md` — database schema, RLS, and RPC specification
- `ui_ux_constitution.md` — mobile-first UI/UX rules
- `docs/database-architecture.md` — implemented schema reference (Phase 1) + ERD
- `docs/test-cases.md` — database test suite (§74–77 coverage)

## Environment Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public anon key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Never expose to the client |
| `SUPABASE_DB_URL` | tooling | Direct Postgres connection for migrations |

`.env.local` is gitignored. Never commit secrets.

## Deploy

GitHub → Vercel. Set the environment variables in the Vercel project settings, then deploy.
