# Aurex — Project Status & Next Steps

_Last reviewed: 2026-06-08_

## Where the project stands

Aurex is a genuinely solid full-stack personal-finance app — the foundation is well past
hobby level. The recent work replaced the old dark/indigo "AI SaaS" look with the **Light
Counter** identity (light paper, graphite ink, color only for financial meaning) and
finished a multi-pass UI/UX review.

### Assessment by area

| Area | State | Notes |
|---|---|---|
| **UI / visual identity** | Good | Light Counter is distinctive and on-brand, not generic. No purple/glow/gradient/serif. Audited + polished. See `DESIGN.md`. |
| **UX** | Good | Statement-style dashboard (net = in − out, cash-flow chart, category ledger). Clear nav, restrained operational page titles, retryable errors, honest empty/loading states. |
| **Backend** | Strong / production-hardened | Typed Hono API, every query scoped by Clerk `userId`, money as integer milliunits, account archival (no destructive deletes), rate limiting, Plaid with encrypted + rotatable tokens, Vercel cron sync, Sentry. |
| **Database** | Sound | Drizzle + Postgres, SQL migrations, per-user case-insensitive unique indexes, deliberate FK strategy (restrict vs `set null`). |
| **Tests / CI** | Good | 159 passing Vitest unit/API tests, Playwright e2e for the landing, GitHub Actions CI. |

**Bottom line:** the foundations (security, data model, API) are strong; remaining work is
product breadth and polish, not rework.

## Next steps (prioritized)

### Now — small polish (deferred P2 from the UI review)
- **Transactions on mobile**: the table scrolls horizontally inside its card. Add a
  condensed / stacked mobile layout so a phone user can scan without side-scrolling.
- **Accessibility sweep**: keyboard-only pass of the primary flows, focus-ring consistency,
  screen-reader labels on icon-only buttons (the `…` row menu, filter icons).

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
- **Rate-limit + observability dashboards**: confirm the cron drain and Sentry monitors in
  prod.

## Known non-issues / decisions on record
- Repo is intentionally **public**; secret hygiene verified (no keys in tree or history,
  `.env.local` + `/screenshots` gitignored).
- Light Counter is the committed identity — do **not** reintroduce dark mode, an indigo/
  violet accent, glows, or a serif headline (those were the rejected "AI slop" tells).
