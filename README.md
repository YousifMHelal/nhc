# NHC CRM

نظام إدارة علاقات العملاء للشركة الوطنية لخدمات الإسكان — an RTL Arabic CRM
prototype built with Next.js (App Router), React 19, and Tailwind CSS v4.

The UI follows a single source of truth: **`docs/nhc-design-spec.md`**. Read it
before changing any screen.

## Data modes

The data-access layer (`src/lib/queries.ts`) runs in one of two modes, chosen
automatically by the presence of `DATABASE_URL`:

- **Demo mode — default (no `DATABASE_URL`).** Every screen reads from the
  in-memory mock data in `src/lib/mock-data`, and interactive create/update/delete
  flows mutate those in-memory arrays. The app is a fully self-contained,
  client-side demo with **no backend and no database** — this is the intended
  deployment mode. Mutations persist for the life of the server process and reset
  on restart.
- **Database mode (`DATABASE_URL` set).** Queries hit PostgreSQL via Prisma
  (Neon or any standard Postgres). Use `npm run db:migrate` / `db:seed` to set up.

Because of this, the production demo deploys with **no environment variables** —
nothing to leak, no database to secure.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000  (demo mode unless .env sets DATABASE_URL)
```

**Demo login:** `admin@nhc.sa` / `demo1234`

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm start` | Serve the production build |
| `npm run db:migrate` | Run Prisma migrations (database mode) |
| `npm run db:seed` | Seed the database from mock data |
| `npm run db:reset` | Reset + reseed the database |

## Notes

- The login gate and session are client-side (`sessionStorage`) — appropriate for
  a demo. If this is ever exposed to real users with a real database, add
  server-side authentication and authorization on the pages and `/api/*` routes
  before launch.
- RTL Arabic UI. Use Tailwind logical properties (`ps-/pe-/ms-/me-/start-/end-`),
  never physical (`pl-/pr-/left-/right-`) — enforced by the `nhc-rtl` ESLint rule.
