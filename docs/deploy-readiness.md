# Deploy readiness (Vercel)

Pre/post-deploy checklist for Aurex. Items marked **✅ verified in repo** are
checked into the codebase and confirmed; items marked **⚠️ confirm in Vercel/prod**
require the Vercel dashboard or the production database and cannot be verified from
the repo alone.

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
`*/5 * * * *`, and `app/api/cron/plaid-sync/route.ts` rejects calls without the
`CRON_SECRET` bearer token.

**⚠️ confirm in Vercel** — `*/5` (every 5 min) requires **Vercel Pro**. On the
**Hobby** plan the cron only runs **daily**; if so, set
`SENTRY_PLAID_SYNC_MONITOR_SCHEDULE` to the actual cadence so the Sentry Cron
monitor does not raise false missed-check-in alerts.

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
