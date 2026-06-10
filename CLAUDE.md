# Finance SaaS — Agent Reference

## What this is

Aurex is a personal-finance SaaS for tracking accounts, categories, transactions,
CSV imports, and dashboard analytics. It is a Next.js app with a typed Hono API,
Postgres persistence, Clerk authentication, and a light, document-grade UI
("Light Counter": near-white paper, graphite ink, no brand hue). See `DESIGN.md`.

## Current stack

- **Next.js 15 App Router** with React 19 and TypeScript.
- **npm** for package scripts and lockfile management.
- **Tailwind v4** plus in-repo shadcn/ui primitives under `components/ui/`.
- **Clerk** via `@clerk/nextjs` and `@clerk/hono`.
- **Hono** mounted at `app/api/[[...route]]/route.ts`; route files live next to it.
- **Drizzle ORM + Postgres** using `pgTable` schemas and SQL migrations in `drizzle/`.
- **postgres** driver in `db/drizzle.ts`.
- **TanStack Query** plus Hono RPC client from `lib/hono.ts`.
- **react-hook-form + zod** for client forms and `@hono/zod-validator` for API input.
- **Recharts** for dashboard charts.
- **papaparse/react-papaparse** for browser CSV import.

## Folder map

```text
app/
  (auth)/sign-in/[[...sign-in]]/page.tsx
  (auth)/sign-up/[[...sign-up]]/page.tsx
  (dashboard)/layout.tsx              protected app shell + sheet provider
  (dashboard)/page.tsx                dashboard
  (dashboard)/accounts/page.tsx       account list
  (dashboard)/categories/page.tsx     category list
  (dashboard)/transactions/page.tsx   table + CSV import flow
  api/[[...route]]/route.ts           Hono mount point
  api/[[...route]]/*.ts               Hono route modules and tests
db/
  schema.ts                           Drizzle tables and insert schemas
  drizzle.ts                          Postgres client export
drizzle/
  *.sql                               generated migrations
features/<resource>/
  api/                                React Query hooks
  components/                         forms and sheets
  hooks/                              zustand sheet/dialog state
lib/
  api-schemas.ts                      public API validation schemas
  api-helpers.ts                      auth/error helpers
  hono.ts                             typed Hono RPC client
  date-range.ts                       dashboard/transaction date-window helpers
scripts/
  seed.ts                             demo workspace seed
  screenshot-auth-cdp.ts              authenticated visual QA via Chrome CDP
```

## Non-negotiable rules

1. **Money is stored as integer milliunits.** One dollar is `1000`. Never store or
   compare currency as floats. Negative amounts are expenses; positive amounts
   are income.
2. **Every API query must be scoped by Clerk `userId`.** Multi-tenant isolation is
   the core security invariant.
3. **React code does not call the DB directly.** CRUD goes through Hono so RPC
   types, server validation, auth, and cache invalidation stay coherent.
4. **Validate on both sides.** Client forms use zod through react-hook-form; API
   handlers use schemas from `lib/api-schemas.ts`.
5. **No secrets in tracked files.** `.env.local` is gitignored. Do not print full
   Clerk keys, database URLs, or tokens.
6. **Account deletion is data-sensitive.** Accounts with transactions must be
   archived, not hard-deleted. Transaction history must survive account archival.
7. **Cache invalidation must match query keys.** Account list queries are keyed as
   `['accounts', { includeArchived }]`; invalidating `['accounts']` intentionally
   refreshes all account-list variants.
8. **Middleware protects by default.** `middleware.ts` runs Clerk's `auth.protect()`
   on every matched path except the public allowlist (`/`, `/sign-in/*`,
   `/sign-up/*`). To expose a new public page, add it to the allowlist —
   never the reverse. New dashboard routes need no middleware change.

## Data model notes

- `accounts.archivedAt` marks hidden/inactive accounts. Default account lists and
  new transaction pickers exclude archived accounts.
- Historical transactions keep their `accountId`; transaction reads still join to
  archived accounts so old rows display correctly.
- `transactions.accountId` uses a restricted foreign key, not cascade delete.
- `transactions.categoryId` uses `onDelete: 'set null'`, so deleting a category
  preserves transactions as uncategorized.
- Account/category names are unique per user case-insensitively through
  `(user_id, lower(name))` indexes.

## Useful commands

```bash
npm run dev              # next dev on http://localhost:3000
npm run build            # production build
npm run start            # serve production build
npm test                 # vitest suite
npm run db:generate      # generate Drizzle migration after schema changes
npm run db:migrate       # apply migrations to DATABASE_URL
npm run db:studio        # inspect local Postgres with Drizzle Studio
npm run db:seed -- <id>  # seed demo data for a Clerk user id
npm run screenshot:auth  # authenticated screenshot QA via Chrome CDP
```

## Local database

Use the README Docker flow unless a local Postgres service is already running.
The expected local URL is:

```text
postgresql://postgres:postgres@localhost:5432/postgres
```

Run migrations before relying on local data:

```bash
npm run db:migrate
```

## Auth and visual QA

- Clerk pages use catch-all routes under `/sign-in/[[...sign-in]]` and
  `/sign-up/[[...sign-up]]`.
- `middleware.ts` protects dashboard pages. Hono route modules run Clerk
  middleware and `requireAuth`.
- Authenticated screenshots use Chrome CDP on port `9222`. On macOS, Chrome often
  needs a custom `--user-data-dir` for the debug port to bind.
- Prefer `npm run build && npm run start` for screenshot captures when checking
  Recharts output. Next dev can show screenshot-only chart timing artifacts.

## Implementation habits

- Prefer existing feature/module patterns over new abstractions.
- Keep Drizzle schema, migrations, API validation, and tests in sync.
- Use `readApiError` in mutation hooks so server errors surface in toasts.
- Do not rewrite `.env.local`, generated screenshots, or unrelated files.
- If a migration can fail on existing local data, document the cleanup path in
  README before handing off.

## Design workflow

The UI is maintained with the in-repo **Impeccable** design skill. Its commands are
pinned as `/shortcuts` (e.g. `/critique`, `/harden`, `/polish`). Use them as a loop, not
in isolation: `audit`/`critique` only *diagnose*; the execution commands turn those
reports into design-system-aware edits. `PRODUCT.md` and `DESIGN.md` are the source of
truth every command reads first.

**The loop (per surface):**

1. **Diagnose** — `/critique <surface>` (design / AI-slop; writes a snapshot under
   `.impeccable/critique/`) and `/audit <surface>` (a11y / responsive / perf).
2. **Direct** — read critique's Priority Issues; pick the axis that matters.
3. **Execute** — `/harden` first (empty / error / edge states), then the targeted fix:
   `/layout`, `/typeset`, `/clarify`, `/adapt`, `/onboard`, or `/distill`.
4. **Seal** — `/polish <surface>` last (it reads the critique snapshot as its backlog),
   then re-run `/audit` or `/critique` to confirm the score moved; `/optimize` if perf
   regressed.
5. **Systematize** (periodic) — `/extract` a pattern that repeats 3+ times into the
   design system; `/document` to refresh `DESIGN.md` / `.impeccable/design.json`.

**Reach for it when:**

| Command | When |
|---|---|
| `/harden` | Missing empty / error / edge states |
| `/onboard` | A first-time user lands on a blank table |
| `/layout` | Sparse or monotone spacing, weak hierarchy |
| `/typeset` | Money-figure type drift (Geist Mono vs sans) |
| `/clarify` | Templatey or vague copy, error / empty messages |
| `/adapt` | Tables / forms unverified on mobile |
| `/distill` | Redundant variants diluting a view |
| `/extract`, `/document` | A pattern repeats 3+ times; `DESIGN.md` drifted |

**Scope rule.** Aurex is the **restrained product register** (light paper, graphite ink,
no brand hue, no slop). Stay in the command set above. The louder Enhance/Direction
commands (`bolder`, `colorize`, `delight`, `animate`, `overdrive`) are out of scope unless
a specific surface clearly justifies one *and* it stays inside the no-glow,
no-decorative-color brand.
