# Aurex — Project Status & Next Steps

_Last reviewed: 2026-06-25_

## Where the project stands

Aurex is a genuinely solid full-stack personal-finance app, best positioned as a
personal workspace that is safe for a reviewer to try with demo, manual, CSV, or
Plaid Sandbox data. The foundation is well past hobby level: Clerk auth, typed Hono
routes, Drizzle/Postgres persistence, Plaid token encryption, a database-backed sync
queue, replay-protected webhooks, and non-destructive account archival are all in
place.

The June 25, 2026 hardening pass added authenticated rate limits to the non-Plaid
API surface, centralized rate-limit responses, added browser security headers, moved
old dashboard planning specs to `docs/archive/`, migrated linting off deprecated
`next lint`, and adjusted navigation so the core account/transaction/bank workflow
comes first.

### Assessment by area

| Area | State | Notes |
|---|---|---|
| **UI / visual identity** | Good | Light Counter is distinctive and on-brand, not generic. No purple/glow/gradient/serif. Audited + polished. See `DESIGN.md`. |
| **UX** | Good | Statement-style dashboard (net = in − out, cash-flow chart, category ledger). Primary nav now emphasizes Overview, Transactions, Accounts, and Banks before secondary planning/analysis tools. |
| **Backend** | Strong / production-hardened | Typed Hono API, every query scoped by Clerk `userId`, money as integer milliunits, account archival, authenticated API rate limits, Plaid with encrypted + rotatable tokens, Vercel cron sync, Sentry. |
| **Database** | Sound | Drizzle + Postgres, SQL migrations, per-user case-insensitive unique indexes, deliberate FK strategy (restrict vs `set null`). |
| **Security** | Good | CSP and baseline browser headers are configured; dependency audits report 0 vulnerabilities. See `docs/security-review.md`. |
| **Tests / CI** | Good | 163 passing Vitest unit/API tests, 4 DB integration tests skipped without `DATABASE_URL`, Playwright e2e for the landing, GitHub Actions CI. |

**Bottom line:** the foundations (security, data model, API) are strong. The next work
should be product focus, deployment verification, and mobile workflow polish rather
than backend rework.

## Next steps (prioritized)

### Now — small polish (deferred P2 from the UI review)
- **Transactions on mobile** _(done)_: the `DataTable` mobile branch now renders a
  purpose-built transaction card (payee + signed amount, then date · category · account,
  with select and the row menu as quiet affordances) via an opt-in `renderMobileRow` prop;
  no horizontal scrolling. Accounts/categories keep the generic transpose. Still worth a
  visual check at a phone viewport against live data.
- **Accessibility sweep**: keyboard-only pass of the primary flows, focus-ring consistency,
  screen-reader labels on icon-only buttons (the `…` row menu, filter icons).
- **CSP smoke test in deployment**: verify Clerk, Plaid Link, and Sentry all work under
  the enforced production CSP.

### Next — product depth
- **Recurring → upcoming bills**: surface the next recurring charges as a forward-looking
  "what's due" view, not just a detected list.
- **Budgets vs actuals over time**: a small trend so a budget shows history, not just the
  current month.
- **Search & saved filters** on transactions (date range + category + account presets).
- **CSV import mapping memory**: remember column mappings per bank so repeat imports are
  one click.

### Later — platform
- **Deploy**: production Clerk (`pk_live`/`sk_live`), a hosted Postgres (Neon/Supabase/RDS),
  Vercel with the cron + `CRON_SECRET`, Sentry env wired. (`docs/` already has a
  deploy-readiness checklist.)
- **Plaid production access** (currently sandbox): requires Plaid's production approval.
- **Observability dashboards**: confirm the cron drain, rate-limit pressure, and Sentry
  monitors in prod.

## Known non-issues / decisions on record
- Repo is intentionally **public**; secret hygiene verified (no keys in tree or history,
  `.env.local` + `/screenshots` gitignored).
- Light Counter is the committed identity — do **not** reintroduce dark mode, an indigo/
  violet accent, glows, or a serif headline (those were the rejected "AI slop" tells).
