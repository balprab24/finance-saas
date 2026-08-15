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

## Update — July 28, 2026 (dependency + hardening pass)

A follow-up audit found several transitive advisories published after the June
review, plus a few consistency gaps. Changes made:

- **Dependencies.** Cleared the critical `node-tar` advisory and patched the
  Next.js image pipeline: Next moved to a patched 15.5.x and `sharp` is pinned to
  `^0.35.3` via `overrides`. **`npm audit --omit=dev --audit-level=high` is now 0**
  (runtime dependencies are clean). At the time of that pass a residual
  `brace-expansion` advisory remained in the ESLint dev toolchain with no
  non-breaking fix, which is why CI treats dev-dependency advisories as
  visibility-only (see below); it has since been fixed upstream.
- **CI.** The blocking audit gate is now `npm audit --omit=dev --audit-level=high`
  (runtime); a non-blocking full `npm audit` surfaces dev-toolchain advisories. Added
  a `permissions: { contents: read }` least-privilege block and a `tsc --noEmit`
  typecheck step.
- **Observability.** Added a `beforeSend`/`beforeSendLog` secret scrubber
  (`lib/sentry-scrub.ts`) across the server, edge, and client Sentry configs, so
  tokens / Postgres URLs / the cron secret can no longer leak through error or log
  messages even if interpolated into them.
- **Auth hardening.** The cron `CRON_SECRET` bearer check now uses
  `crypto.timingSafeEqual`; the Plaid webhook JWT verification pins
  `algorithms: ['ES256']`.

### Rebase refresh — August 15, 2026

This pass sat unmerged long enough that its dependency tree went stale, so it was
rebased onto `main` and re-audited before landing:

- Cleared seven runtime advisories that accumulated in the interim — `hono`
  (CORS-middleware ReDoS), `next`, `postcss` (path traversal in source-map
  auto-loading), `axios`, `nanoid`, `fast-uri`, and `brace-expansion`. All resolved
  via non-breaking upgrades; `hono` moved 4.12 → 4.13.2 and `next` to 15.5.23.
  **Both `npm audit` and `npm audit --omit=dev` are now 0.**
- The Hono 4.13 RPC types tightened: `InferResponseType` without a status argument
  now unions error responses, so destructuring `data` no longer narrows.
  `use-bulk-delete-transactions.ts` was pinned to `, 200`, matching the idiom
  already used in `use-delete-transaction.ts` and `use-restore-transactions.ts`.
