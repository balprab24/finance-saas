# Aurex Security And Codebase Review

_Reviewed: June 25, 2026_

## Executive Summary

Aurex is best treated as a personal finance workspace that is safe for a resume
reviewer to try with demo, manual, CSV, or Plaid Sandbox data. The core backend is
solid: Clerk authentication, tenant-scoped queries, encrypted Plaid tokens, a
database-backed sync queue, replay-protected webhooks, and non-destructive account
archival are all in place.

This pass closed two main gaps: general authenticated API rate limits and baseline
browser security headers. The app now has protection beyond the Plaid-specific
limits that already existed.

## What Is Strong

- Every private dashboard/API path is protected by Clerk, with narrow public
  exceptions for marketing/legal pages, Plaid webhooks, and the cron drain.
- API queries and mutations are scoped by Clerk `userId`.
- Plaid access tokens are encrypted at rest with a rotatable keyring.
- Plaid webhook bodies are verified and replay-guarded before sync work is queued.
- Plaid sync jobs use a database queue with one active job per item, row locking,
  retry backoff, stale-worker reclaim, and a secret-protected cron drain.
- Money is stored as integer milliunits, not floating-point values.
- Accounts with transaction history are archived instead of hard-deleted.
- Demo data lets reviewers test the product without connecting real accounts.

## Changes From This Pass

- Added shared authenticated API rate-limit helpers in `lib/api-rate-limit.ts`.
- Applied user-scoped limits to accounts, categories, transactions, budgets,
  insights, summary, and onboarding/demo endpoints.
- Kept Plaid-specific rate limits, now using the shared rate-limit response helper.
- Added security headers in `next.config.ts`: CSP, frame restrictions, referrer
  policy, MIME sniff protection, permissions policy, and production HSTS.
- Migrated linting from deprecated `next lint` to the ESLint CLI with a source-only
  scope that excludes generated/tool-cache folders.
- Reframed dashboard navigation around the primary flow: Overview, Transactions,
  Accounts, Banks first; Categories, Budgets, Insights second.
- Archived old dashboard design planning docs under `docs/archive/`.

## Remaining Risks

- Plaid production use still depends on production credentials, production Clerk,
  hosted Postgres, deployed cron, and a verified Plaid production approval path.
- The DB-backed Plaid queue integration tests remain skipped unless `DATABASE_URL`
  is available.
- Dashboard and transactions first-load bundles are still relatively large
  (`/dashboard` ~392 kB, `/transactions` ~336 kB in the latest build).
- CSP should be checked in the real deployed environment after Clerk/Plaid/Sentry
  are configured, because third-party script/frame origins can change by tenant.

## Verification

- `npm run lint` passed.
- `npm test` passed: 163 tests, with 4 DB integration tests skipped.
- `npm run build` passed after allowing network access for `next/font`.
- `npm audit` passed with 0 vulnerabilities.
- `npm audit --omit=dev` passed with 0 vulnerabilities.
