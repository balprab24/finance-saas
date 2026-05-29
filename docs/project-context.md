# Project Context

This document is for future Claude Desktop/Cowork planning sessions. It summarizes current repo facts and invariants; it is not an implementation plan.

## App Purpose

Aurex is a personal-finance SaaS/workspace for tracking accounts, categories, transactions, CSV imports, and dashboard analytics. The product centers on a protected finance dashboard showing remaining balance, income, expenses, cash-flow charts, and category spend.

## Stack and Architecture

- Next.js 15 App Router, React 19, TypeScript, npm.
- Tailwind CSS v4 plus local shadcn-style primitives in `components/ui/`.
- Clerk for auth via `@clerk/nextjs` and `@clerk/hono`.
- Hono API mounted at `app/api/[[...route]]/route.ts` under `/api`.
- Drizzle ORM with PostgreSQL via `postgres` in `db/drizzle.ts`; migrations live in `drizzle/`.
- TanStack Query client hooks call the typed Hono RPC client from `lib/hono.ts`.
- React Hook Form + Zod/drizzle-zod for forms; `@hono/zod-validator` for API validation.
- Recharts for dashboard charts; PapaParse/react-papaparse for browser CSV import.
- Vitest tests cover API routes, schema validation helpers, date parsing/range logic, and demo data.

## Current Routes and Screens

- `/`: public marketing landing page for Aurex with dashboard preview and Clerk-aware CTAs.
- `/sign-in`, `/sign-up`: Clerk auth screens in the Aurex dark card layout.
- `/dashboard`: protected overview with welcome text, account/date filters, onboarding empty state, KPI cards, cash-flow chart variants, and spending pie.
- `/transactions`: protected table with date/category/payee/amount/account columns, add/edit/delete sheets, bulk delete, and CSV import map/review flow.
- `/accounts`: protected account table with add/edit, archive/restore, show-archived toggle, and bulk archive.
- `/categories`: protected category table with add/edit/delete and bulk delete.

Navigation links are `/dashboard`, `/transactions`, `/accounts`, and `/categories`. The route group `app/(dashboard)` is not part of the URL.

## Database Entities and Relationships

- `accounts`: `id`, `plaidId`, `name`, `userId`, `archivedAt`.
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

`plaidId` columns exist on accounts/categories, but no Plaid sync route, dependency, or UI is implemented in this repo.

## Auth and Tenant Isolation

- `middleware.ts` protects every matched path except `/`, `/sign-in(.*)`, and `/sign-up(.*)`.
- Every Hono route uses Clerk middleware plus `requireAuth`; unauthenticated requests return `401`.
- API handlers derive tenant scope from Clerk `auth.userId` and set/read it through `AuthEnv`.
- Reads and writes filter by `userId`; transaction account/category writes verify the target account/category belongs to the same user.
- New transaction writes reject archived accounts.
- Composite database FKs harden transaction relationships so a transaction cannot point across tenant-owned account/category rows.

## Current API Capabilities

- `GET/POST /api/accounts`, `GET/PATCH/DELETE /api/accounts/:id`.
- `POST /api/accounts/:id/archive`, `POST /api/accounts/:id/restore`.
- `POST /api/accounts/bulk-archive`, `POST /api/accounts/bulk-delete`; hard delete only succeeds for accounts with zero transactions.
- `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id`, `POST /api/categories/bulk-delete`.
- `GET/POST /api/transactions`, `GET/PATCH/DELETE /api/transactions/:id`, `POST /api/transactions/bulk-create`, `POST /api/transactions/bulk-delete`.
- `GET /api/summary` with optional `from`, `to`, and `accountId` query params.
- `GET /api/onboarding/status` and `POST /api/onboarding/demo` for empty-workspace demo seeding.

Validation caps: names 120 chars, payees 200 chars, notes 2000 chars, ids 64 chars, bulk ids/inserts max 500, transaction amounts ±1,000,000,000,000 milliunits.

## UX and Design Style

- Dark, operational UI using Aurex CSS tokens: warm-neutral dark backgrounds, subtle borders, indigo primary action, cyan accent, green income, rose expense, amber warning.
- In-app surfaces use compact `aurex-card` panels, sticky top header, responsive desktop/mobile navigation, data tables, modal/sheet forms, skeleton loading states, and Sonner dark toasts.
- Marketing page is more expressive with gradient brand mark, scroll sections, animated/revealed preview cards, and a dashboard visualization.
- Forms and tables favor dense finance workflows: filters, sortable columns, bulk actions, confirmation dialogs, and edit sheets.

## Privacy and Security Constraints

- Do not commit `.env.local` or real credentials. `.env`, `.env.*`, finance import/export files, screenshots, and auth artifacts are gitignored.
- `NEXT_PUBLIC_*` values are browser-visible; keep `CLERK_SECRET_KEY`, `DATABASE_URL`, and other secrets server-only.
- API errors return generic `500` in production; non-production logs `[api error]`.
- CSV imports and local screenshots may contain personal finance data; keep generated artifacts out of git unless they are intentional fixtures.
- Preserve tenant scoping in both API predicates and database relationships.

## Recently Completed Backend Hardening

- Added `transactions.user_id`, tenant indexes, and case-insensitive per-user account/category uniqueness.
- Added account archival (`accounts.archived_at`) and changed account FK behavior from cascade to restrict.
- Added composite `(id, user_id)` uniqueness for accounts/categories and composite transaction FKs for tenant integrity.
- Promoted `transactions.amount` from integer to bigint for large milliunit values.
- Hardened account deletion: archive is the normal user-facing path; hard delete is rejected when transactions exist.
- Hardened transaction writes: account/category ownership is checked, and archived accounts are rejected.
- Added shared API schemas for trimming, length caps, date validation, amount bounds, and bulk request limits.
- Added tests around auth failures, validation, unique conflicts, archive/restore, bulk limits, summary date/expense semantics, onboarding demo seeding, and transaction ownership checks.

## Known Limitations and Open Product Gaps

- No Plaid/bank-sync implementation is present, despite `plaid_id` columns.
- No budget, recurring transaction, rule engine, multi-currency, export, or shared organization/team model exists in current routes/API modules.
- CSV import supports mapping `amount`, `date`, and `payee`; `notes` and category mapping are not implemented in the import UI.
- CSV duplicate detection only flags likely duplicates within the uploaded file; it does not compare against existing database transactions.
- Summary `days` contains active transaction dates from the query; the API does not fill missing dates with zero rows.
- There is no explicit root `/api` health endpoint.

## Rules Future Agents Should Preserve

- Store money as integer milliunits. Do not use floats for persisted or API amounts; negative values are expenses and positive values are income.
- Scope every API query and mutation by Clerk `userId`.
- Do not call the database directly from React UI; route data through Hono handlers and TanStack Query hooks.
- Keep Drizzle schema, migrations, API schemas, client forms, and tests in sync.
- Preserve account archival semantics and transaction history. Do not cascade-delete transactions through account deletion.
- Preserve category deletion as uncategorizing transactions.
- Preserve the composite tenant FK migration behavior. `drizzle/0004_tenant_fk_hardening.sql` is the source of truth for `ON DELETE SET NULL (category_id)`.
- Keep public routes allowlisted narrowly in `middleware.ts`; new dashboard/product routes should remain protected by default.
- Use `readApiError` in mutation hooks so server validation/conflict errors reach users.
- Do not commit secrets, generated screenshots, auth artifacts, or personal finance import/export files.
