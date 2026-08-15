# Deploy readiness (Vercel)

> **Status: Aurex is not deployed, by choice.** It is maintained as a source-available
> reference implementation; standing up a hosted instance means paying for a domain and
> running three third-party account setups for a demo. This document is the checklist for
> whoever deploys it later — it is kept accurate, not stale.

Pre/post-deploy checklist for Aurex. Items marked **✅ verified in repo** are
checked into the codebase and confirmed; items marked **⚠️ confirm in Vercel/prod**
require the Vercel dashboard or the production database and cannot be verified from
the repo alone.

## 0. Prerequisites worth knowing before you start

- **A custom domain is effectively required.** A Clerk *production* instance (the source
  of `pk_live_*` / `sk_live_*` keys) needs CNAME records on a domain you control, and you
  cannot set DNS records on a `*.vercel.app` subdomain. Deploying to `*.vercel.app` is
  possible, but only with Clerk *development* keys, which render a "development mode"
  banner on the auth screens.
- **CSP and Clerk.** `lib/csp.ts` derives the Clerk frontend-API origin from the
  publishable key (`clerkFapiOrigin`) because `*.clerk.com` does not match a production
  instance's `clerk.<your-domain>` host, and `'strict-dynamic'` does not cover
  `connect-src`. `NEXT_PUBLIC_*` is inlined at build time, so **rotating the Clerk key
  requires a redeploy, not a restart.**
- **Plaid is optional.** With `PLAID_*` unset the app builds and runs; `getPlaidClient()`
  is lazy and only throws when a Plaid route is actually called. The `/banks` route will
  error if a signed-in user opens it, so either configure Plaid or expect that surface to
  be unavailable.

Related: the Plaid-specific slice of this list lives in
[`plaid-sandbox-verification.md`](./features/plaid-sandbox-verification.md) §5.

## 1. Database migrations

**✅ verified in repo** — `drizzle/0000_*` … `0010_*` are all present and all
listed in `drizzle/meta/_journal.json` (no gaps).

| Migration | Adds |
| --- | --- |
| `0007_silly_fixer` | Plaid sync-job retry/backoff columns |
| `0008_misty_energizer` | `plaid_webhook_events` + `rate_limits` |
| `0009_overrated_human_fly` | `budgets` (Budget MVP) |
| `0010_majestic_wiccan` | `recurring_ignores` (spending insights) |

`0009` and `0010` are **additive** (new tables, no backfill, no constraints on
existing rows) — safe to apply to a populated production database.

**⚠️ confirm in prod** — run migrations against the production `DATABASE_URL`:

```bash
npm run db:migrate
```

Until `budgets` and `recurring_ignores` exist, the `/budgets` and `/insights`
pages (and their API routes) will error.

## 2. Vercel environment variables

**⚠️ confirm in Vercel** — set for the Production environment:

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and the
  `NEXT_PUBLIC_CLERK_*` sign-in/up URL vars.
- **Database**: `DATABASE_URL`.
- **Plaid**: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, `PLAID_PRODUCTS`,
  `PLAID_COUNTRY_CODES`, `PLAID_TOKEN_ENCRYPTION_KEY` (+ keyring vars if rotating).
- **App origin**: `NEXT_PUBLIC_APP_URL` = the production origin (drives the Plaid
  webhook URL via `getPlaidWebhookUrl()`).
- **Cron**: `CRON_SECRET` (Vercel injects it as the cron `Authorization: Bearer`
  header).
- **Sentry** (optional but recommended — see §4).

## 3. Cron cadence

**✅ verified in repo** — `vercel.json` schedules `/api/cron/plaid-sync` at
`0 6 * * *` (daily), and `app/api/cron/plaid-sync/route.ts` rejects calls without
the `CRON_SECRET` bearer token.

**⚠️ confirm in Vercel** — the daily cadence is deliberate: the **Hobby** plan only
runs cron jobs once per day. The queue is designed for `*/5 * * * *`; on **Pro**,
change the schedule and set `SENTRY_PLAID_SYNC_MONITOR_SCHEDULE` to match so the
Sentry Cron monitor does not raise false missed-check-in alerts.

## 4. Sentry observability

**✅ verified in repo** — `instrumentation.ts`, `instrumentation-client.ts`,
`sentry.server.config.ts`, and `sentry.edge.config.ts` are present and read:

- Server/edge: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ENVIRONMENT`,
  `SENTRY_TRACES_SAMPLE_RATE`.
- Client: `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`,
  `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`.

**⚠️ confirm in Vercel** — set the DSNs/environment vars above. `SENTRY_AUTH_TOKEN`
is only needed for source-map upload; builds warn without it (expected). **Never
expose `SENTRY_AUTH_TOKEN` to the browser.**

## 5. Post-deploy smoke

- Sign in; load `/dashboard`, `/budgets`, `/insights` — no 500s.
- Link a Plaid item (sandbox or production per `PLAID_ENV`); confirm accounts and
  transactions import (see the Plaid runbook for the full flow).
- Confirm a `plaid_sync_jobs` row drains on the expected cron cadence.
