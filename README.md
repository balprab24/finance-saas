# Finance SaaS

A full-stack personal finance dashboard for tracking accounts, categories, and transactions. The app includes Clerk authentication, typed Hono API routes, Drizzle/Postgres persistence, CSV import helpers, and dashboard charts for income, expenses, remaining balance, and category spend.

## Preview

The marketing landing page introduces the workspace at a glance — every account, category, and transaction in one dashboard.

![Aurex landing — hero and dashboard preview](docs/screenshots/hero.png)

The Insights section ships with a real Area / Line / Bar toggle backed by the finance-tuned palette (green for income, red for expenses).

![Aurex landing — Insights chart panel](docs/screenshots/chart.png)

The interface follows the **Light Counter** design system: a light, document-grade UI (graphite ink on near-white paper, with color reserved for financial meaning) — see [`DESIGN.md`](DESIGN.md).

## Features

- Authenticated dashboard powered by Clerk
- Account, category, and transaction CRUD
- Bulk transaction import from CSV
- Date and account filters for reports
- Statement-style dashboard: net cash position, a cash-flow chart, and a ranked category ledger (Recharts)
- Monthly budgets with per-category tracking
- Spending insights: recurring subscriptions, category movers, and unusual-spend detection
- Optional Plaid bank linking with encrypted, rotatable access tokens and a cron-driven sync
- Tenant-scoped API queries using the signed-in Clerk user id
- Server and client validation with Zod and Drizzle schemas
- Drizzle migrations for PostgreSQL

## Tech Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Tailwind CSS v4 and shadcn-style local UI components
- Clerk for authentication
- Hono for typed API routes under `/api`
- Drizzle ORM with PostgreSQL
- TanStack Query for client data fetching
- Sentry for production error monitoring, cron check-ins, and traces
- React Hook Form, Zod, and drizzle-zod for forms and validation
- Vitest for focused unit/API tests

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

If `.env.example` is not present, create `.env.local` with these variable names and fill in your own local values:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local database with Docker

The fastest path to a local Postgres matching what the app expects is the bundled `docker-compose.yml`:

```bash
docker compose up -d db
```

This starts Postgres 16 on `localhost:5432` with the default `postgres` database, user `postgres`, password `postgres`. Set the matching `DATABASE_URL` in your `.env.local`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

Any other Postgres (Neon, Supabase, RDS, a system-installed daemon, `brew install postgresql@16`) works just as well — Docker is just the simplest local path. Just point `DATABASE_URL` at it.

Run database migrations:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # Start the Next.js dev server
npm run build        # Build for production
npm run start        # Start the production server
npm run lint         # Run ESLint on source files
npm run test         # Run Vitest tests
npm run e2e          # Build/start the app and run deterministic Playwright tests
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply Drizzle migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed demo data for one Clerk user id
npm run plaid:verify    # End-to-end Plaid Sandbox verification (see docs runbook)
npm run screenshot      # Capture a public/local page screenshot
npm run screenshot:auth # Capture authenticated QA screenshots via Chrome CDP
```

Seed data for a specific Clerk user:

```bash
npm run db:seed -- user_xxxxxxxxx
```

The seed script is scoped to the provided user id and refuses production seeding unless explicitly overridden.

## Project Structure

```text
app/
  (auth)/                 Clerk sign-in and sign-up pages
  (dashboard)/            Protected dashboard routes
  api/[[...route]]/       Hono route handlers
components/               Shared dashboard and UI components
db/                       Drizzle schema and database client
drizzle/                  Generated migrations and snapshots
features/                 Resource-specific API hooks, forms, and sheets
hooks/                    Shared React hooks
lib/                      Utilities, typed Hono client, date/CSV helpers
providers/                Query and sheet providers
scripts/                  Seed and screenshot helpers
```

## Deployment

The app is a standard Next.js 15 App Router build with a Postgres backend and Clerk for auth. Any host that runs Node 20 and can reach your Postgres instance (Vercel, Fly, Render, a VM) will work.

### Required environment variables

All variables must be set in the host's environment (or `.env.local` for local runs). See `.env.example` for the template.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client SDK key. Production needs a `pk_live_*` key from a production Clerk instance. |
| `CLERK_SECRET_KEY` | Clerk server SDK key. Production needs a `sk_live_*` key. Never expose to the browser. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Path to the sign-in page (`/sign-in`). |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Path to the sign-up page (`/sign-up`). |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Where Clerk redirects after a successful sign-in (`/dashboard`). |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Where Clerk redirects after a successful sign-up (`/dashboard`). |
| `DATABASE_URL` | Postgres connection string. Required at runtime and build time — `db/drizzle.ts` throws on startup if unset. |
| `NEXT_PUBLIC_APP_URL` | Public origin of the deployment, e.g. `https://finance.example.com`. Used as the canonical origin, for Plaid webhook URLs, and by the visual-QA scripts. |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | Plaid API credentials for the environment named by `PLAID_ENV`. |
| `PLAID_ENV` | `sandbox` or `production`; must match the credentials above. |
| `PLAID_PRODUCTS` / `PLAID_COUNTRY_CODES` | Comma-separated Plaid products (default `transactions`) and country codes (default `US`). |
| `PLAID_TOKEN_ENCRYPTION_KEY` | Base64-encoded 32-byte key that encrypts Plaid access tokens at rest. Required wherever tokens are written or read. |
| `PLAID_TOKEN_ENCRYPTION_KEYS` / `PLAID_TOKEN_ENCRYPTION_KEY_VERSION` | Optional rotation keyring (`v1=<base64>,v2=<base64>`) plus the active version. See `npm run plaid:rotate-key`. |
| `CRON_SECRET` | Bearer secret for the `/api/cron/plaid-sync` drain endpoint. Vercel injects it as the cron `Authorization` header; set it in the project env. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSNs for server and browser reporting. These may be the same public DSN. Leave blank locally to disable sending. |
| `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Sentry environment names, e.g. `production`, `preview`, or `development`. |
| `SENTRY_TRACES_SAMPLE_RATE` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Trace sample rates from `0` to `1`; defaults are intentionally low for production. |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Optional source-map upload configuration for CI/Vercel builds. Keep the auth token server-side only. |
| `SENTRY_PLAID_SYNC_MONITOR_SLUG` / `SENTRY_PLAID_SYNC_MONITOR_SCHEDULE` | Optional Sentry Cron monitor settings for `/api/cron/plaid-sync`; default slug is `plaid-sync-cron` and default schedule is `*/5 * * * *`. |

### Local DB vs hosted Postgres

- **Local:** the bundled `docker-compose.yml` runs Postgres 16 on `localhost:5432` (`postgres`/`postgres`). A system-installed `postgresql@16` works just as well.
- **Production:** any managed Postgres ≥ 14 — Neon, Supabase, RDS, Fly Postgres, etc. The Drizzle schema is dialect-agnostic; the same migrations apply. For serverless Postgres providers (e.g. Neon), `postgres-js` with `prepare: false` (already set in `db/drizzle.ts`) is the correct client setup.

### Migrations

Run on every deploy after a schema change:

```bash
npm run db:migrate
```

The command is safe to re-run — Drizzle tracks applied migrations and skips ones already in the journal. Migration files live in `drizzle/`.

### Dependency security

Both `npm audit` and `npm audit --omit=dev` report **0 vulnerabilities**. Vitest/Vite are pinned to clean versions, and the package override set keeps transitive esbuild versions on patched releases while preserving the Drizzle and TSX toolchains.

### General API and browser hardening

Authenticated non-Plaid API endpoints are DB-rate-limited per Clerk user. Normal
reads, report queries, mutations, bulk imports/deletes, and demo seeding use
separate buckets so a runaway client cannot make endless writes or expensive report
queries.

The app also emits baseline browser security headers from `next.config.ts`,
including CSP, frame restrictions, referrer policy, MIME sniff protection,
permissions policy, and production HSTS. See
[`docs/security-review.md`](docs/security-review.md) for the latest codebase and
security review.

### Plaid sync drain (cron)

Bank syncs run as background jobs (`plaid_sync_jobs`) rather than inside the request that triggered them. Two things drain the queue:

- **Vercel Cron** (the reliability backbone) calls `GET /api/cron/plaid-sync` on the schedule in `vercel.json` (every 5 minutes). The endpoint authenticates with `CRON_SECRET` (Vercel injects it as the `Authorization: Bearer` header), claims due jobs with `FOR UPDATE SKIP LOCKED`, and retries transient failures with exponential backoff. Crashed-worker jobs stuck in `running` are reclaimed after a few minutes.
- **A warm-path drain** runs immediately after a manual sync or a Plaid webhook (via Next's `after()`), so users usually don't wait for the next tick.

> **Vercel plan note:** the Hobby plan runs cron jobs **once per day** only — the `*/5 * * * *` cadence requires **Pro**. On Hobby the warm path still drains the happy path, but a job that fails and backs off won't be retried until the daily run.

Generate `CRON_SECRET` with `openssl rand -hex 32` and set it in the host environment.

### Plaid API hardening

Authenticated Plaid actions are DB-rate-limited per Clerk user, and the public Plaid webhook is DB-rate-limited per forwarded client IP before JWT verification. Over-limit requests return `429` with `Retry-After` and `X-RateLimit-*` headers.

Verified Plaid webhook bodies are recorded by `request_body_sha256` in `plaid_webhook_events`. Duplicate deliveries or replayed signed bodies are acknowledged with `{ ok: true }` but are not reprocessed, so they cannot enqueue repeated sync work or repeat item-error transitions. Run `npm run db:migrate` before deploying this stage so `drizzle/0008_misty_energizer.sql` creates `rate_limits` and `plaid_webhook_events`.

To verify the whole Plaid flow against the live Sandbox (linking, exchange, sync, dedup, replay guard, rate limit, reconnect) run `npm run plaid:verify`. The full runbook — including the manual UI smoke test, the cloudflared webhook test, and the deploy-readiness checklist — is in [`docs/features/plaid-sandbox-verification.md`](docs/features/plaid-sandbox-verification.md).

### Sentry observability

Stage 3 observability is wired through `@sentry/nextjs`:

- Next.js request errors are captured through `instrumentation.ts` and App Router render errors through `app/global-error.tsx`.
- The Hono API catch-all reports uncaught API handler errors with method/path tags before returning the generic 500 response.
- The Plaid sync queue drain is wrapped in a custom Sentry span with processed/succeeded/failed counts.
- Terminal Plaid sync job failures are captured as Sentry messages tagged by `plaid_sync.item_id`, `plaid.error_code`, failure class, and whether the failure requires user item repair.
- The cron drain endpoint sends Sentry Cron check-ins using the `plaid-sync-cron` monitor by default and records failures separately.
- The browser SDK has Session Replay disabled by default because this app handles financial data; enable it only after reviewing masking/privacy settings.

For production source maps, set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` in Vercel/CI. Do not expose `SENTRY_AUTH_TOKEN` to the browser. If the deployment is on Vercel Hobby, set `SENTRY_PLAID_SYNC_MONITOR_SCHEDULE` to the actual daily cadence to avoid false missed-check-in alerts.

### Clerk URLs and callbacks

In the Clerk dashboard (Production instance):

- Add `NEXT_PUBLIC_APP_URL` to **Allowed origins**.
- Set the **Application home URL** and **Sign-in / Sign-up URLs** to match the four `NEXT_PUBLIC_CLERK_*_URL` env vars.
- For Google OAuth, add `NEXT_PUBLIC_APP_URL` to the Google Cloud OAuth client's authorized redirect URIs (Clerk's docs walk through this).
- Use production-tier (`pk_live_*` / `sk_live_*`) keys in production — the `pk_test_*` keys are tied to Clerk's test instance and won't accept production users.

### Visual QA

After deploying, you can spot-check the running site with the screenshot helpers — see [Authenticated visual QA](#authenticated-visual-qa) below. Useful commands:

```bash
npm run screenshot <url>   # one-off public/local page capture
npm run screenshot:auth    # authenticated dashboard capture via Chrome CDP
```

### Account archival and hard-delete safety

Accounts with transactions are archived instead of deleted. The `accounts.archived_at` column hides inactive accounts from default account lists and new transaction pickers, while historical transactions keep their account link. The `transactions.accountId` foreign key is `onDelete: 'restrict'`, and `DELETE /accounts/:id` only succeeds for accounts with zero transactions.

Use the account page or `POST /api/accounts/:id/archive` for normal user-facing removal. Use `POST /api/accounts/:id/restore` to make an archived account available again. Bulk account actions archive selected accounts; they do not hard-delete transaction history.

The accounts page has a **Show archived** toggle that lists archived accounts inline with active ones (marked with an "Archived" badge). The row action menu surfaces **Restore** for archived rows and **Archive** for active ones. `GET /api/accounts?includeArchived=true` is the underlying query.

### Local-data caveat for the case-insensitive uniqueness migration

Migration `0002` switches the unique index on account/category names from case-sensitive to case-insensitive (`LOWER(name)`). If a local database already contains case-only duplicates for the same user (e.g. both `Savings` and `savings`), `npm run db:migrate` will fail when it tries to create the new unique index. The fix is a one-time rename:

```sql
-- inspect collisions:
SELECT user_id, lower(name), array_agg(name) FROM accounts GROUP BY user_id, lower(name) HAVING count(*) > 1;
-- rename one of each pair, then re-run npm run db:migrate
```

Production was migrated from empty data, so this only affects long-running local DBs.

## Authenticated visual QA

Clerk's Google OAuth flow refuses to complete inside a fresh Playwright
Chromium build, which blocks `scripts/screenshot.ts --login` for any account
that signs in via Google. The supported path is to attach Playwright to a
real Chrome that you have already signed in to, over the Chrome DevTools
Protocol.

```bash
# 1. Fully quit Chrome.
# 2. Launch Chrome with the debug port open:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# 3. In that Chrome window, open the app and sign in once:
#      http://localhost:3000/sign-in
#    Leave the window open after sign-in completes.

# 4. Make sure the dev server and a seeded database are up:
npm run dev
npm run db:seed -- <your_clerk_user_id>   # optional, populates demo data

# 5. Capture all required authenticated screenshots into screenshots/auth/:
npm run screenshot:auth

# Or scope to one scenario:
npm run screenshot:auth -- dashboard-desktop
npm run screenshot:auth -- --list
```

Scenario keys produced under `screenshots/auth/`:

- `dashboard-desktop.png`, `dashboard-mobile.png`
- `transactions-desktop.png`, `transactions-mobile.png`
- `accounts-desktop.png`, `accounts-mobile.png`
- `categories-desktop.png`, `categories-mobile.png`
- `transaction-new-sheet.png`
- `transaction-edit-sheet.png` (requires at least one seeded transaction)
- `csv-import-map.png`
- `csv-import-review.png` (driven by `scripts/fixtures/import-sample.csv`,
  which intentionally contains an unparseable-date row, a missing-payee
  row, and one duplicate row)

The script disconnects from Chrome rather than closing it, so your real
browser session stays intact. If you see `The attached Chrome is NOT
signed in`, complete sign-in in the CDP-attached Chrome window and re-run.

If automation is unavailable, capture the same filenames manually by
opening each URL in a 1440x900 (desktop) or 390x844 (mobile) window and
saving full-page screenshots into `screenshots/auth/` using the keys
above.

### Caveats

- **macOS Chrome and the debug port.** On recent Chrome builds
  `--remote-debugging-port=9222` silently fails to bind unless Chrome
  also gets a fresh `--user-data-dir`. If `curl -s
  http://localhost:9222/json/version` returns nothing after launch, fully
  quit Chrome and relaunch with:

  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port=9222 \
    --user-data-dir="$HOME/Library/Application Support/Google/Chrome-CDP" \
    --no-first-run --no-default-browser-check
  ```

  That's an isolated profile, so sign in to Clerk once in that window
  before running `npm run screenshot:auth`.

- **Capture against the production server, not `next dev`.** Under `npm
  run dev`, Playwright's `fullPage` screenshots of the dashboard
  sometimes show chart titles, legends, axes, and grid lines but not
  the actual Recharts area/line/pie paths. This is a dev-mode artifact
  (HMR + React strict-mode + `ResponsiveContainer` measurement
  interaction); against `npm run build && npm run start` the same
  scenarios capture the charts correctly. If chart paths look missing,
  rerun the capture against the production server before treating it as
  a real bug.

- **The "N" overlay is dev-only.** The small black circle with an "N"
  near the bottom-left of every screenshot is the Next.js dev-mode
  indicator. It is not present in `npm run build && npm run start`
  output.

## Security

Aurex handles financial data, so security is layered rather than bolted on:

- **Tenant isolation, twice.** Every API query is scoped to the authenticated
  Clerk `userId`, and the schema backs that up with composite foreign keys
  referencing `(id, user_id)` — a row can't point at another tenant's data
  even if application code slipped. Cross-tenant access by id is locked to
  `404` by tests.
- **Auth by default.** `middleware.ts` runs Clerk's `auth.protect()` on every
  route outside a small public allowlist; Hono API routes additionally run
  Clerk middleware plus a `requireAuth` guard.
- **Validated on both sides.** Client forms use zod via react-hook-form; the
  API re-validates everything with shared schemas (bounded lengths, integer
  milliunit amounts, 500-row bulk caps). A global 2 MB request body limit
  rejects oversized payloads before any work happens.
- **Strict Content-Security-Policy.** Scripts run under a per-request nonce
  with `strict-dynamic` — no `unsafe-inline` script execution in modern
  browsers. HSTS, `frame-ancestors 'none'`, `nosniff`, and a locked-down
  Permissions-Policy ship on every response.
- **Verified webhooks.** The Plaid webhook requires a signed JWT, compares
  the body hash in constant time, and is replay-protected; the cron endpoint
  fails closed unless its `CRON_SECRET` bearer matches.
- **Encrypted tokens.** Plaid access tokens are stored AES-GCM encrypted with
  a versioned keyring, never in plaintext.
- **Rate limiting.** Per-user, per-bucket limits (reads, mutations, bulk
  operations, demo seeding) enforced before database work; the public webhook
  is IP-rate-limited before signature verification.
- **Dependency hygiene.** CI blocks on `npm audit --audit-level=high`, and
  Dependabot files weekly update PRs for npm and GitHub Actions.

Operational notes:

- Do not commit `.env.local` or real credentials.
- `.env`, `.env*.local`, local database files, screenshots, and auth artifacts are gitignored.
- `NEXT_PUBLIC_*` values are browser-visible by design; keep secrets in server-only variables such as `CLERK_SECRET_KEY` and `DATABASE_URL`.
