# Aurex Security And Codebase Review

_Originally reviewed: June 25, 2026 · Last updated: August 15, 2026_

> This document is a chronological log. The sections below are kept as written at the
> time of each pass; later sections supersede earlier ones where they conflict. The
> current state of the codebase is described by **Final pass — August 15, 2026**.

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

## Final pass — August 15, 2026

Closing out the project. A stack of security work written on July 18 had never been
merged, while the July 28 pass independently re-implemented parts of it. Both were
reconciled and landed.

### Newly enforced controls

- **Default-deny API authentication.** `app/api/[[...route]]/route.ts` now applies a
  Clerk session guard at the Hono root with an explicit public allowlist (the Plaid
  webhook only, which authenticates via its own signed JWT). Per-route `requireAuth`
  is retained as defense-in-depth. Previously a route added without its own guard was
  simply unauthenticated; `route-auth.test.ts` proves the backstop, the webhook
  exemption, and normal pass-through.
- **Postgres transport security.** `lib/db-config.ts` requires TLS for any non-loopback
  database host, honors an explicit `sslmode`/`ssl` parameter in the URL as deliberate
  operator intent, and refuses in production when the ambient `DATABASE_SSL=disable`
  escape hatch would silently downgrade a remote connection to plaintext. Also bounds
  the connection pool for serverless (`max: 5`, bounded idle/connect/lifetime),
  complementing the existing `prepare: false` for pooler compatibility.
- **Operational data retention.** `lib/db-maintenance.ts` prunes expired `rate_limits`
  rows and `plaid_webhook_events` older than 30 days from the cron drain, non-fatally,
  so the replay-guard table cannot grow without bound.
- **Response bounds.** The transactions list clamps its date span to 366 days and caps
  at 2000 rows; `/insights/recurring` caps its scan at 5000 rows; `/plaid/items` gained
  the one rate limiter it was missing; the middleware cron bypass was narrowed to the
  exact drain path.

### Reconciled duplicates

- **`lib/sentry-scrub.ts`** existed in two divergent versions. They were merged rather
  than one discarded, because the layers are complementary and none is sufficient
  alone: (a) redaction by the runtime *value* of known secret env vars, the only thing
  that catches a shapeless secret like `CRON_SECRET`; (b) redaction by credential
  *shape*, which also works in the browser where env values are absent; and (c)
  redaction by sensitive *key name*, which catches a secret that is neither a known env
  value nor a recognizable shape. On top of that, `request.headers` / `cookies` / `data`
  are dropped wholesale and query strings stripped from URLs. All three Sentry runtimes
  wire `beforeSend`, `beforeSendLog`, and `beforeBreadcrumb`.
- The duplicated ES256 pin in `lib/plaid-webhook.ts` was collapsed to one, keeping both
  branches' tests (wrong-algorithm rejection, stale tokens, missing `kid`).

### Corrected

- **The tenant-isolation integration test had never passed anywhere**, including CI.
  Drizzle wraps driver errors in a `DrizzleQueryError`, so the Postgres SQLSTATE lives
  on `.cause`, not on the thrown error — the assertion was checking the wrong level. The
  control itself was always correct: Postgres rejects the cross-tenant insert via
  `transactions_account_user_fk` with SQLSTATE 23503. Now genuinely verified.
- **Content-Security-Policy would have broken Clerk in production.** A Clerk production
  instance serves its frontend API from `clerk.<your-domain>`, matching neither
  `*.clerk.com` nor `*.clerk.accounts.dev`. `script-src` tolerates that via
  `'strict-dynamic'`, but that keyword has no effect on `connect-src`, so Clerk's XHR
  would have been blocked on the live domain while working perfectly in development.
  `lib/csp.ts` now derives the origin from the publishable key itself
  (`clerkFapiOrigin`), returning `null` rather than widening the policy on a malformed
  key. The Sentry EU ingest host was allowlisted alongside US.

### Verification

- `npm run lint`, `npm run typecheck`, `npm run build` — all clean.
- `npm test` — 263 passing (255 unit/API + 8 real-Postgres integration).
- `npm run e2e` — 4 passing, including a zero-CSP-violations assertion.
- `npm audit` and `npm audit --omit=dev` — **0 vulnerabilities**.
- CSP verified by rebuilding with a production-form `pk_live` key and reading the
  emitted header: the derived origin appears in `script-src`, `connect-src`, and
  `frame-src`.

### Known, accepted gaps

- No Clerk `user.deleted` webhook: deleting a Clerk account leaves that user's Postgres
  rows in place. Documented in the README rather than fixed.
- `/banks` errors when Plaid is unconfigured (`getPlaidClient()` throws lazily); the
  route is only reachable by a signed-in user.
- Playwright coverage remains public-surface only; authenticated flows are covered by
  the API-route suites.
