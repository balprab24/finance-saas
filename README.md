# Aurex — Personal Finance SaaS

A full-stack personal-finance workspace for tracking accounts, categories, and transactions,
importing bank CSVs, linking real banks through Plaid, and reading cash flow through a
document-grade dashboard. Money is exact to the cent, every query is tenant-isolated, and the
whole API is type-safe end to end.

![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-RPC-E36002?logo=hono&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)
![Postgres](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)

![Aurex landing — hero and dashboard preview](docs/screenshots/hero.png)

## What it is

Aurex ("Light Counter" design system) is a workspace for one person to see their complete
financial picture — reconcile income against spending, categorize a batch of transactions,
import a bank CSV, and check whether the month's cash flow is healthy. Currency is stored as
**integer milliunits** and every figure is shown exactly; the product's credibility lives in
that precision. The interface is deliberately quiet: near-white paper, graphite ink, and color
reserved strictly for financial meaning (green income, red expense). See
[`DESIGN.md`](DESIGN.md) and [`PRODUCT.md`](PRODUCT.md).

## Screenshots

| The Statement dashboard | Transactions + CSV import |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Transactions](docs/screenshots/transactions.png) |
| Net position, cash-flow chart, and a ranked category ledger. | Sortable, filterable table with bulk actions and CSV import. |

| Spending insights | Monthly budgets |
| --- | --- |
| ![Insights](docs/screenshots/insights.png) | ![Budgets](docs/screenshots/budgets.png) |
| Recurring-subscription detection, category movers, unusual spend. | Per-category limits with live spend and on-track status. |

## Engineering highlights

The parts of this project worth a code review:

- **End-to-end type safety, no codegen.** The Hono API exports its own type
  (`AppType` from `app/api/[[...route]]/route.ts`) and the client consumes it with
  `hc<AppType>()` — [`lib/hono.ts`](lib/hono.ts) is nine lines. Every TanStack Query hook
  infers its request and response types straight from the server (`InferRequestType` /
  `InferResponseType`), so renaming a field or changing a route is a **compile error on the
  client**, not a runtime surprise.
- **Money as integer milliunits.** Amounts are `bigint` columns in
  [`db/schema.ts`](db/schema.ts) and validated as bounded `.int()` milliunits in
  [`lib/api-schemas.ts`](lib/api-schemas.ts) — no floats anywhere. The sign encodes meaning:
  negative is an expense, positive is income.
- **Multi-tenancy enforced by the database, not just app code.** Every query is scoped to the
  Clerk `userId`, and the schema backs that up with **composite `(id, user_id)` foreign keys**
  (`drizzle/0004_tenant_fk_hardening.sql`) so a row physically cannot point at another tenant's
  account or category — even if application code slipped. Cross-tenant reads are locked to
  `404` by tests.
- **Production hardening, layered.** Per-request **nonce CSP** with `strict-dynamic`,
  DB-backed **per-user rate limiting** (separate buckets for reads, mutations, bulk ops, and
  reports), **AES-GCM envelope-encrypted** Plaid tokens with a versioned keyring, a **backoff
  job queue** (`plaid_sync_jobs`, claimed with `FOR UPDATE SKIP LOCKED`) drained by cron, and
  **replay-guarded** webhooks (constant-time body-hash comparison + a dedup table). Errors
  flow to Sentry.
- **Tested and CI-gated.** 27 Vitest suites (API route tests colocated with the handlers, plus
  library unit tests) and Playwright e2e. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
  runs `audit → lint → migrate → test → build → e2e` against a real `postgres:16` service on
  every push and PR.

## Features

- Authenticated dashboard powered by Clerk
- Account, category, and transaction CRUD with bulk actions
- Bulk transaction import from CSV, with column mapping and a validate-before-import review
- Statement-style dashboard: net cash position, a cash-flow chart, and a ranked category ledger
- Monthly budgets with per-category spend tracking
- Spending insights: recurring subscriptions, category movers, and unusual-spend detection
- Optional Plaid bank linking with encrypted, rotatable access tokens and a cron-driven sync
- Date and account filters across reports
- Account archival that preserves transaction history (never a destructive hard-delete)

## Tech stack

| Area | Choice | Why it matters |
| --- | --- | --- |
| Framework | **Next.js 15** App Router, **React 19**, TypeScript | Server components + a single deployable app; strict types throughout. |
| API | **Hono 4** mounted at `/api`, `@hono/zod-validator` | Small, fast, and exports its own RPC types — the API contract *is* the TypeScript type. |
| Data | **Drizzle ORM 0.45** + **PostgreSQL** (`postgres-js`) | SQL-first schema, typed queries, and hand-written migrations where Postgres semantics need it. |
| Auth | **Clerk** (`@clerk/nextjs`, `@clerk/hono`) | Middleware protects routes by default; Hono routes re-check with `requireAuth`. |
| Client data | **TanStack Query 5** + typed Hono client | Caching, invalidation keyed to the data, and end-to-end inferred types. |
| Forms | **react-hook-form** + **Zod 4** (`drizzle-zod`) | The same schemas validate on the client and re-validate on the server. |
| UI | **Tailwind v4** + in-repo shadcn/ui primitives, **Recharts 3** | A restrained, document-grade design system (see `DESIGN.md`). |
| Bank linking | **Plaid** + `react-plaid-link` | Real institution connections with a background sync queue. |
| Observability | **Sentry** | Server/API/cron error capture and traces. |
| Quality | **Vitest 3**, **Playwright**, ESLint | Unit + API + e2e coverage, enforced in CI. |

## Architecture at a glance

React never touches the database. Every read and write flows through one typed pipeline:

```
React component → TanStack Query hook → typed Hono RPC (/api) → Drizzle → Postgres
                                              ↑ all scoped by Clerk userId
```

```text
app/
  (auth)/                 Clerk sign-in and sign-up pages
  (dashboard)/            Protected dashboard routes (dashboard, transactions,
                          accounts, categories, budgets, insights, banks)
  api/[[...route]]/       Hono route handlers + colocated tests
db/                       Drizzle schema and Postgres client
drizzle/                  Generated + hand-written SQL migrations
features/<resource>/      React Query hooks, forms, and sheets per resource
lib/                      Typed Hono client, api-schemas, helpers, date/CSV utils
scripts/                  Seed and screenshot helpers
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Clerk keys + DATABASE_URL
```

Start a local Postgres (the bundled compose file is the fastest path — Postgres 16 on
`localhost:5432`, `postgres`/`postgres`):

```bash
docker compose up -d db
```

Set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres` in `.env.local`
(any Neon/Supabase/RDS/system Postgres works too), then migrate and run:

```bash
npm run db:migrate
npm run dev            # http://localhost:3000
```

Optionally seed a demo workspace for your Clerk user id (scoped to that user; refuses
production unless explicitly overridden):

```bash
npm run db:seed -- user_xxxxxxxxx
```

### Scripts

```bash
npm run dev          # Next.js dev server
npm run build        # production build
npm run start        # serve the production build
npm test             # Vitest unit + API tests
npm run e2e          # Playwright end-to-end tests
npm run lint         # ESLint
npm run db:generate  # generate a Drizzle migration after a schema change
npm run db:migrate   # apply migrations
npm run db:studio    # inspect Postgres with Drizzle Studio
npm run db:seed      # seed demo data for one Clerk user id
```

## Testing

```bash
npm test       # 27 Vitest suites (API routes + library units)
npm run e2e    # Playwright smoke tests against a production build
```

CI runs the full gate — `npm audit --audit-level=high`, lint, migrate, test, build, and e2e —
against a real Postgres service on every push and pull request.

## Deployment

Aurex runs anywhere that has Node 20 and can reach Postgres (Vercel, Fly, Render, a VM). The
full operational reference — environment variables, Plaid background sync, Sentry wiring, Clerk
production setup, and the authenticated visual-QA workflow — lives in
[`docs/deployment.md`](docs/deployment.md). Walk the
[deploy-readiness checklist](docs/deploy-readiness.md) before a first production deploy.

## Security

Aurex handles financial data, so security is layered rather than bolted on:

- **Tenant isolation, twice** — every query is scoped to the Clerk `userId`, and composite
  `(id, user_id)` foreign keys enforce it at the schema level. Cross-tenant access by id is
  locked to `404` by tests.
- **Auth by default** — `middleware.ts` runs Clerk's `auth.protect()` on every route outside a
  small public allowlist; Hono routes additionally run Clerk middleware plus a `requireAuth`
  guard.
- **Validated on both sides** — client forms use Zod via react-hook-form; the API re-validates
  with the same schemas (bounded lengths, integer milliunit amounts, bulk caps), behind a
  global 2 MB request-body limit.
- **Strict Content-Security-Policy** — scripts run under a per-request nonce with
  `strict-dynamic`; HSTS, `frame-ancestors 'none'`, `nosniff`, and a locked-down
  Permissions-Policy ship on every response.
- **Encrypted secrets & verified webhooks** — Plaid access tokens are AES-GCM encrypted with a
  versioned keyring; the Plaid webhook requires a signed JWT, compares the body hash in
  constant time, and is replay-protected.
- **Dependency hygiene** — CI blocks on `npm audit --audit-level=high`, and Dependabot files
  weekly update PRs.

Full write-up in [`docs/security-review.md`](docs/security-review.md). Never commit
`.env.local` or real credentials; `NEXT_PUBLIC_*` values are browser-visible by design, so
secrets stay in server-only variables like `CLERK_SECRET_KEY` and `DATABASE_URL`.

## Design

The UI follows the **Light Counter** design system — a light, document-grade aesthetic with no
brand hue, where color carries financial meaning rather than decoration. The full spec is in
[`DESIGN.md`](DESIGN.md); the product brief and voice are in [`PRODUCT.md`](PRODUCT.md).
