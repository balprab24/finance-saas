# Aurex — Project Status

_Last reviewed: 2026-08-31_

An independent review on 2026-08-31 (see `docs/security-review.md`) re-verified the
August 15 close-out from scratch and found no critical or high-severity issues. It
added CodeQL scanning, coverage tooling, and a Node `engines` pin; no product behavior
changed.

## Where the project stands

Aurex is **complete and closed out**. It is a full-stack personal-finance workspace —
Clerk auth, a typed Hono API, Drizzle/Postgres persistence, CSV import and export,
budgets, spending insights, and optional Plaid bank linking with encrypted tokens and
a database-backed sync queue — presented as a **source-available reference
implementation rather than a hosted product**.

The **Light Counter** identity (light paper, graphite ink, color only for financial
meaning) unifies every authenticated surface on shared statement primitives
(`StatementSheet`, `PageMasthead`, `LedgerAmount`).

### Assessment by area

| Area | State | Notes |
|---|---|---|
| **UI / visual identity** | Good | Light Counter is distinctive and on-brand. No purple/glow/gradient/serif. See `DESIGN.md`. |
| **UX** | Good | Statement-style dashboard (net = in − out, cash-flow chart, category ledger). Empty workspaces get a one-click **Load sample data** path seeding 75 days across three accounts. |
| **Backend** | Strong | Typed Hono API, every query scoped by Clerk `userId`, money as integer milliunits, account archival, default-deny API auth, per-user rate limits, Plaid with encrypted rotatable tokens. |
| **Database** | Sound | Drizzle + Postgres, SQL migrations, per-user case-insensitive unique indexes, composite `(id, user_id)` FKs, deliberate restrict-vs-`set null` strategy, TLS required for remote hosts. |
| **Security** | Strong | Nonce CSP, default-deny auth, tenant isolation enforced by schema and proven by integration test, Sentry secret scrubbing, replay-guarded webhooks. `npm audit` is 0 in both scopes. See `docs/security-review.md`. |
| **Tests / CI** | Good | 263 tests (Vitest unit/API + real-Postgres integration), Playwright public-surface e2e, GitHub Actions running `audit → lint → typecheck → migrate → test → build → e2e`. |
| **Deployment** | **Not deployed — by choice** | See below. |

## Why it is not deployed

A public instance would require a paid domain plus three third-party account setups
purely to host a demo:

- A Clerk **production** instance needs CNAME records on a domain you control. DNS
  records cannot be set on a `*.vercel.app` subdomain, so `pk_live_*` keys are not
  obtainable without buying a domain. Deploying with Clerk *development* keys works
  but renders a "development mode" banner on the auth screens.
- Hosted Postgres, a Sentry project, and Plaid credentials each need their own account.

The judgment was that the engineering is the artifact, and the cost/benefit of hosting
a single-user finance demo did not justify the recurring spend and setup. The repo is
kept in a state where deploying is a checklist, not a project:
`docs/deploy-readiness.md` is maintained and accurate, `vercel.json` ships a cron
cadence valid on every Vercel plan, and `lib/csp.ts` already derives the Clerk
production frontend-API origin correctly.

## What landed in the final pass (August 15, 2026)

- **Unblocked CI.** `main` had been red since July 22 on a single
  `npm audit --audit-level=high` gate that included dev dependencies. Split into a
  blocking runtime gate plus a non-blocking dev-toolchain report.
- **Cleared all dependency advisories** — 0 in both `npm audit` and
  `npm audit --omit=dev`. Adapted to the Hono 4.13 RPC type tightening.
- **Landed a stack of security work** that had sat unmerged since July 18: the
  Postgres TLS policy and pool bounds (`lib/db-config.ts`), default-deny API auth at
  the Hono root (`route-auth.test.ts`), ops-table pruning (`lib/db-maintenance.ts`),
  `/plaid/items` rate limiting, and response bounds on transactions and insights.
- **Fixed the tenant-isolation integration test**, which had never passed anywhere:
  Drizzle wraps `PostgresError` in a `DrizzleQueryError`, so the SQLSTATE assertion
  had to target `.cause`. The control itself was always working.
- **Merged two divergent Sentry scrubbers** into one covering env-value redaction,
  credential shapes, sensitive key names, request stripping, and breadcrumbs.
- **Added CSV export** with formula-injection-safe escaping and exact milliunit
  round-tripping.
- **Fixed the production CSP** — a Clerk production instance serves its frontend API
  from `clerk.<domain>`, which the existing wildcards did not match and which
  `'strict-dynamic'` cannot rescue on `connect-src`.

## Deliberately not done

- Deployment, hosting accounts, custom domain, Sentry project, Plaid production access
- Authenticated Playwright e2e (CI has no Clerk session; API-route suites cover those flows)
- A Clerk `user.deleted` webhook — deleting a Clerk account leaves Postgres rows behind;
  documented in the README rather than built
- Budgets in the demo seed (`/budgets` is empty until you add one)
- Graceful degradation on `/banks` when Plaid is unconfigured (that route errors)
- Bundle trimming (`/dashboard` ~392 kB first-load JS)
- Multi-currency, shared/household workspaces, upcoming-bills insights

## Decisions on record

- Repo is intentionally **public**; secret hygiene verified (no keys in tree or history,
  `.env.local` and `/screenshots` gitignored).
- Light Counter is the committed identity — do **not** reintroduce dark mode, an indigo/
  violet accent, glows, or a serif headline (the rejected "AI slop" tells).
- Money is integer milliunits everywhere. Accounts with transactions are archived, never
  hard-deleted.
