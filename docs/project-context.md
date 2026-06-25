# Project Context

This document is for future Claude Desktop/Cowork planning sessions. It summarizes current repo facts and invariants; it is not an implementation plan.

## App Purpose

Aurex is a personal-finance SaaS/workspace for tracking accounts, categories, transactions, CSV imports, optional bank linking via Plaid, per-category budgets, and spending insights. The product centers on a protected finance dashboard showing the net cash position, income, expenses, cash-flow, and a category ledger.

## Stack and Architecture

- Next.js 15 App Router, React 19, TypeScript, npm.
- Tailwind CSS v4 plus local shadcn-style primitives in `components/ui/`.
- Clerk for auth via `@clerk/nextjs` and `@clerk/hono`.
- Hono API mounted at `app/api/[[...route]]/route.ts` under `/api`.
- Drizzle ORM with PostgreSQL via `postgres` in `db/drizzle.ts`; migrations live in `drizzle/`.
- TanStack Query client hooks call the typed Hono RPC client from `lib/hono.ts`.
- React Hook Form + Zod/drizzle-zod for forms; `@hono/zod-validator` for API validation.
- Recharts for dashboard charts; PapaParse/react-papaparse for browser CSV import.
- Plaid (`plaid` SDK) for optional bank linking; access tokens encrypted at rest (AES-256-GCM, rotatable keyring) via `lib/server-crypto.ts`. Background sync drains through a Vercel cron endpoint; Sentry wraps cron/job observability.
- Vitest tests cover API routes, schema/validation helpers, date parsing/range logic, demo data, Plaid sync/normalize/webhook, rate limiting, and observability. Playwright covers the public landing.

## Current Routes and Screens

- `/`: public marketing landing — a single reconciled May 2026 statement artifact, CSV column-mapping workflow, scroll-spy nav, and Clerk-aware CTAs.
- `/privacy`, `/terms`, `/support`: public legal/support pages (plain-language).
- `/sign-in`, `/sign-up`: Clerk auth screens in the light Aurex layout.
- `/dashboard`: protected overview — the statement sheet (net = in − out, cash-flow chart, category ledger), account/date filters, and an onboarding empty state with demo seeding.
- `/transactions`: protected table with date/category/payee/amount/account columns, add/edit/delete sheets, bulk delete, and CSV import map/review flow.
- `/accounts`: protected account table with add/edit, archive/restore, show-archived toggle, and bulk archive.
- `/banks`: protected Plaid connections — link a bank, per-item status/sync state, last sync, and remove. Loading, retryable error, and empty states.
- `/categories`: protected category table with add/edit/delete and bulk delete.
- `/budgets`: protected per-category monthly budgets with a Budgeted − Spent = Remaining reconciliation strip and per-row progress.
- `/insights`: protected recurring subscriptions, unusual spending, and category movers.

Desktop navigation links (in order) are Overview (`/dashboard`), Transactions, Accounts, Banks, Categories, Budgets, and Insights. The active route is ink with a full-width ink underline (`aria-current="page"`); ≤1024px collapses to a left sheet with an ink dot. The route group `app/(dashboard)` is not part of the URL.

## Database Entities and Relationships

- `accounts`: `id`, `plaidId`, `plaidItemId`, `name`, `userId`, `archivedAt`.
  - One account has many transactions.
  - Names are unique per user case-insensitively via `(user_id, lower(name))`.
  - `(id, user_id)` is unique for composite tenant FKs.
- `categories`: `id`, `plaidId`, `name`, `userId`.
  - One category has many transactions.
  - Names are unique per user case-insensitively via `(user_id, lower(name))`.
  - `(id, user_id)` is unique for composite tenant FKs.
- `transactions`: `id`, `amount`, `payee`, `notes`, `date`, `userId`, `accountId`, `categoryId`.
  - `amount` is a bigint exposed as JS `number`, stored in integer milliunits.
  - `accountId` is required; `categoryId` is nullable.
  - Account FK is composite `(account_id, user_id) -> accounts(id, user_id)` with `ON DELETE RESTRICT`.
  - Category FK is composite `(category_id, user_id) -> categories(id, user_id)` with `ON DELETE SET NULL (category_id)`.
  - Deleting a category preserves transactions as uncategorized; account hard deletes are blocked when transactions exist.
- `budgets`: `id`, `userId`, `categoryId`, `month` (YYYY-MM), `amount` (integer milliunits). Unique per `(userId, categoryId, month)`.
- `recurringIgnores`: `id`, `userId`, `merchantKey` — per-user dismissed recurring merchants for the insights view.
- `plaidItems`: an encrypted Plaid `accessToken`, institution metadata, status, error code/message, and last-sync state. Scoped by `userId`.
- `plaidSyncJobs`: queued/running/succeeded/failed background sync jobs with attempts and last error. Scoped by `userId`.
- `plaidWebhookEvents`: `requestBodySha256` (unique) + webhook type/code, used for replay/dedup.
- `rateLimits`: `key`, `count`, `resetAt` — token-bucket rows for per-user/per-IP throttling.

## Auth and Tenant Isolation

- `middleware.ts` protects every matched path except the narrow public allowlist: `/`, `/privacy`, `/terms`, `/support`, `/api/plaid/webhook` (Plaid-signature-verified), `/api/cron/(.*)` (own `CRON_SECRET` bearer), and `/sign-in(.*)` / `/sign-up(.*)`.
- Every protected Hono route uses Clerk middleware plus `requireAuth`; unauthenticated requests return `401`.
- API handlers derive tenant scope from Clerk `auth.userId`. Reads and writes filter by `userId`; single-resource and bulk mutations use composite `(id, userId)` predicates; transaction/budget writes verify the target account/category belongs to the same user.
- New transaction writes reject archived accounts.
- Composite database FKs harden transaction relationships so a transaction cannot point across tenant-owned account/category rows.

## Current API Capabilities

- `GET/POST /api/accounts`, `GET/PATCH/DELETE /api/accounts/:id`, `POST /api/accounts/:id/archive`, `POST /api/accounts/:id/restore`, `POST /api/accounts/bulk-archive`, `POST /api/accounts/bulk-delete` (hard delete only for zero-transaction accounts).
- `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id`, `POST /api/categories/bulk-delete`.
- `GET/POST /api/transactions`, `GET/PATCH/DELETE /api/transactions/:id`, `POST /api/transactions/bulk-create`, `POST /api/transactions/bulk-delete`.
- `GET /api/summary` with optional `from`, `to`, and `accountId`.
- `GET/POST /api/budgets`, `DELETE /api/budgets/:id`.
- `GET /api/insights/recurring`, `GET /api/insights/trends`, `GET /api/insights/unusual`, `POST/DELETE /api/insights/recurring/ignore`.
- `POST /api/plaid/link-token`, `POST /api/plaid/exchange-public-token`, `GET /api/plaid/items`, `POST /api/plaid/items/:itemId/sync`, `POST /api/plaid/items/:itemId/update-link-token`, `DELETE /api/plaid/items/:itemId`, `POST /api/plaid/webhook` (public, signature-verified).
- `GET /api/onboarding/status`, `POST /api/onboarding/demo`.
- `GET /api/cron/plaid-sync` (cron-only, `CRON_SECRET` bearer) drains the sync queue.

Validation caps: names 120 chars, payees 200 chars, notes 2000 chars, ids 64 chars, bulk ids/inserts max 500, transaction amounts ±1,000,000,000,000 milliunits.

## UX and Design Style — "Light Counter"

- Light, document-grade UI: near-white paper canvas, graphite ink, white panels separated by dark hairlines. **No brand hue** — ink is the only action/active color; green income / red expense / amber warning are the only chroma and carry financial meaning only. Flat surfaces, no glow/blur/gradient, no serif. See `DESIGN.md` and `PRODUCT.md`.
- Authenticated routes share statement primitives: `StatementSheet` (one ruled sheet), `PageMasthead`, `StatementSection`, `LedgerAmount` (Geist Mono tabular figures, sign + U+2212), plus `DataError` and `EmptyState`. The dashboard is one sheet divided by rules, not a stack of boxes.
- Typography is one grotesque (Schibsted Grotesk) through weight contrast, with Geist Mono for tabular figures.
- Forms and tables favor dense finance workflows: filters, sortable columns, bulk actions, confirmation dialogs, edit sheets, skeleton loading, retryable errors, and honest empty states. Sonner toasts surface server errors via `readApiError`.
- Marketing page shows the real product (an exact statement + CSV mapping) and speaks plainly; credibility is the conversion lever.

## Privacy and Security Constraints

- Do not commit `.env.local` or real credentials. `.env`, `.env.*`, finance import/export files, screenshots, and auth artifacts are gitignored.
- `NEXT_PUBLIC_*` values are browser-visible; keep `CLERK_SECRET_KEY`, `DATABASE_URL`, Plaid secrets, `PLAID_TOKEN_ENCRYPTION_KEY(S)`, and `CRON_SECRET` server-only. Never log or return Plaid access tokens.
- Authenticated non-Plaid API routes are rate-limited per Clerk user via `lib/api-rate-limit.ts`; preserve those middleware calls when adding new routes.
- Browser security headers are set in `next.config.ts`; CSP changes must be tested with Clerk, Plaid Link, and Sentry in the target deployment.
- API errors return generic `500` in production; non-production logs `[api error]`.
- CSV imports and local screenshots may contain personal finance data; keep generated artifacts out of git unless they are intentional fixtures.
- Preserve tenant scoping in both API predicates and database relationships.

## Recently Completed Work

- Multi-tenant hardening: `transactions.user_id`, tenant indexes, case-insensitive per-user account/category uniqueness, composite `(id, user_id)` uniqueness, and composite transaction FKs.
- Account archival (`accounts.archived_at`); account FK changed from cascade to restrict; hard delete rejected when transactions exist.
- `transactions.amount` promoted to bigint; shared API schemas for trimming, length caps, date validation, amount bounds, and bulk limits.
- Plaid integration: encrypted + rotatable access tokens, link/exchange/sync/remove endpoints, signed + replay-protected webhook, background sync queue drained by a Vercel cron, and Sentry observability. Rate limiting (`rateLimits` table) on Plaid endpoints, the webhook, and the broader authenticated API surface.
- Budgets (per-category monthly) and Insights (recurring/unusual/trends) features end to end.
- "Light Counter" UI: statement-style dashboard and authenticated surfaces unified on shared statement primitives (PR #14), underline desktop nav, public legal pages.
- Tests around auth/validation/unique conflicts, archive/restore, bulk limits, summary semantics, onboarding demo, transaction ownership, Plaid sync/normalize/webhook, rate limiting, and observability.

## Known Limitations and Open Product Gaps

- Transactions on phones use a purpose-built stacked card (`DataTable` `renderMobileRow`); the banks table still scrolls horizontally rather than using a condensed/stacked layout.
- CSV import maps `amount`, `date`, and `payee`; `notes` and category mapping are not implemented, and duplicate detection only flags duplicates within the uploaded file (not against existing DB rows).
- Summary `days` contains active transaction dates only; the API does not fill missing dates with zero rows.
- No multi-currency, export, rule engine, or shared organization/team model.
- Plaid runs against sandbox until production approval; there is no explicit root `/api` health endpoint.

## Rules Future Agents Should Preserve

- Store money as integer milliunits. Do not use floats for persisted or API amounts; negative values are expenses and positive values are income.
- Scope every API query and mutation by Clerk `userId`.
- Do not call the database directly from React UI; route data through Hono handlers and TanStack Query hooks.
- Keep Drizzle schema, migrations, API schemas, client forms, and tests in sync.
- Preserve account archival semantics and transaction history. Do not cascade-delete transactions through account deletion.
- Preserve category deletion as uncategorizing transactions.
- Preserve the composite tenant FK migration behavior. `drizzle/0004_tenant_fk_hardening.sql` is the source of truth for `ON DELETE SET NULL (category_id)`.
- Keep public routes allowlisted narrowly in `middleware.ts`; new dashboard/product routes should remain protected by default.
- Encrypt Plaid access tokens at rest; verify the webhook signature and dedup replays before processing; keep secrets server-only and out of logs/responses.
- Use `readApiError` in mutation hooks so server validation/conflict errors reach users.
- Do not commit secrets, generated screenshots, auth artifacts, or personal finance import/export files.
- Never represent an unknown/loading/failed financial figure as a real `$0.00`; show `—`, a skeleton, or a retryable error instead.
</content>
</invoke>
