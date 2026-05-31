# Plaid Integration

Status: **implemented, locally validated, pending live-sandbox verification.**

Aurex links real bank accounts through Plaid and imports their transactions via
the `/transactions/sync` cursor model. This document describes what is built, how
to configure and run it locally, the invariants it guarantees, and the remaining
work before it is production-ready.

What has been validated in this repo:

- `npm test` — Plaid route tests cover link/exchange/remove/webhook/update-mode,
  queued syncs, orphan recovery, and idempotent removal; normalization, crypto
  rotation, and the `lib/plaid-sync.ts` integration tests (mocked paginated
  `/transactions/sync`, on-conflict dedupe, advisory-lock before Plaid fetch,
  relink, tenant-scoped delete).
- `npm run build` — compiles, type-checks, and lints clean.
- `npm run db:migrate` — applied against the local Postgres; the `plaid_items`
  and `plaid_sync_jobs` tables, the `accounts`/`transactions` Plaid columns, the
  composite tenant FKs, and all three partial unique indexes were verified present.

What has **not** yet been verified (needs Plaid Sandbox credentials, see
[Next engineering tasks](#next-engineering-tasks)):

- A live Link → exchange → sync round trip from `/accounts`.
- Live `SYNC_UPDATES_AVAILABLE` webhooks over a public HTTPS tunnel.

---

## Architecture at a glance

```text
Browser (/accounts)                       Hono API (/api/plaid/*)              Plaid
───────────────────                       ──────────────────────              ─────
Connect bank ── POST /link-token ───────▶ linkTokenCreate ──────────────────▶ link token
PlaidLink(token) ── user authenticates ─────────────────────────────────────▶ public_token
onSuccess ── POST /exchange-public-token ▶ itemPublicTokenExchange ──────────▶ access_token + item_id
                                          encrypt(access_token) → plaid_items
                                          accountsGet → upsert accounts
                                          transactionsSync(cursor) → upsert txns
Sync linked ── POST /items/:id/sync ─────▶ enqueue plaid_sync_jobs ────────▶ worker syncs cursor
Reconnect ── POST /items/:id/update-link-token ─▶ linkTokenCreate(update mode) ─▶ queued sync
                                          (webhook) POST /webhook ◀── SYNC_UPDATES_AVAILABLE
                                                     │
                                                     └── verify + enqueue, return quickly
Remove ── DELETE /items/:id ─────────────▶ itemRemove; archive linked accounts
```

Access tokens never reach the browser. They are encrypted at rest with
AES-256-GCM and only decrypted server-side to call Plaid.

---

## Data model

Migrations `drizzle/0005_known_penance.sql` and
`drizzle/0006_clever_synch.sql`. Defined in `db/schema.ts`.

### `plaid_items` (one row per linked institution login = one Plaid Item)

| column             | notes                                                        |
| ------------------ | ------------------------------------------------------------ |
| `id`               | app-generated UUID (primary key)                             |
| `user_id`          | Clerk user id — tenant scope on every query                  |
| `plaid_item_id`    | Plaid's `item_id`; **globally unique** (`plaid_items_plaid_item_id_uq`) |
| `access_token`     | AES-256-GCM ciphertext (never plaintext)                     |
| `institution_id`   | Plaid institution id (nullable)                              |
| `institution_name` | display name (nullable)                                      |
| `cursor`           | `/transactions/sync` cursor; advanced after each successful sync |
| `status`           | `active` \| `error` \| `removed`                             |
| `last_synced_at`   | last successful sync                                         |
| `last_webhook_at`  | last received webhook                                        |
| `error_code` / `error_message` | last Plaid error (for repair UI)                |
| `created_at` / `updated_at` | timestamps                                         |

Constraints: `plaid_items_user_id_idx`, `plaid_items_plaid_item_id_uq`,
`plaid_items_id_user_id_key` (composite key that backs the accounts tenant FK).

### `accounts` additions

- `plaid_id` — Plaid `account_id` (null for manual accounts).
- `plaid_item_id` — owning Plaid Item (null for manual accounts).
- Partial unique index `accounts_user_plaid_id_uq` on `(user_id, plaid_id)` where
  `plaid_id is not null` — a Plaid account maps to exactly one local account per user.
- Composite tenant FK `accounts_plaid_item_user_fk`
  `(plaid_item_id, user_id) → plaid_items(id, user_id)` with
  **`ON DELETE SET NULL (plaid_item_id)`** (Postgres 15+). drizzle-kit cannot model
  the column-list form, so the SQL migration is the source of truth (see the comment
  in `db/schema.ts`).

### `transactions` additions

- `plaid_id` — Plaid `transaction_id` (null for manual/CSV rows).
- `pending_plaid_id` — Plaid `pending_transaction_id` (links a posted row to the
  pending row it replaces).
- `plaid_account_id` — Plaid `account_id` the txn belongs to.
- `merchant_name`, `payment_channel` — Plaid enrichment.
- `pending` — boolean, defaults `false`.
- Partial unique index `transactions_user_plaid_id_uq` on `(user_id, plaid_id)`
  where `plaid_id is not null` — the dedupe guarantee.
- Supporting indexes `transactions_user_plaid_id_idx`,
  `transactions_user_plaid_account_id_idx`.

Manual rows keep `plaid_id = null`, which is what isolates them from Plaid-origin
deletes and the unique index.

### `plaid_sync_jobs`

DB-backed queue for Plaid sync work.

| column             | notes                                                        |
| ------------------ | ------------------------------------------------------------ |
| `id`               | app-generated UUID (primary key)                             |
| `user_id` / `item_id` | tenant-scoped FK to `plaid_items(id, user_id)` with cascade delete |
| `reason`           | `manual` \| `webhook` \| `reconnect`                         |
| `status`           | `queued` \| `running` \| `succeeded` \| `failed`             |
| `attempts`         | incremented when a worker claims the job                     |
| `last_error`       | short failure summary for management UI                      |
| timestamps         | created/updated/started/finished                             |

Partial unique index `plaid_sync_jobs_active_item_uq` on `(user_id, item_id)`
where `status in ('queued', 'running')` coalesces duplicate sync requests per
Item. If a duplicate request arrives while a job is already running, the worker
requeues that same job after the current run finishes.

---

## Server modules

| file                    | responsibility                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| `lib/plaid.ts`          | Lazy `PlaidApi` singleton; parses `PLAID_PRODUCTS`/`PLAID_COUNTRY_CODES`; builds the webhook URL from `NEXT_PUBLIC_APP_URL`. |
| `lib/server-crypto.ts`  | `encryptSecret`/`decryptSecret` (AES-256-GCM). Payload format `version:iv:tag:ciphertext` (base64url). Supports legacy `PLAID_TOKEN_ENCRYPTION_KEY` and optional versioned keyrings for rotation. |
| `lib/plaid-normalize.ts`| Amount sign + milliunits, calendar-date normalization (noon UTC, no day shift), payee/account-name selection and truncation. |
| `lib/plaid-sync.ts`     | Paginated `/transactions/sync`, account + transaction upserts, removed-row deletion, cursor/status/error bookkeeping, item removal helpers. |
| `lib/plaid-sync-jobs.ts`| DB-backed queue, active-job coalescing, in-process drain trigger for manual/webhook syncs. |
| `lib/plaid-webhook.ts`  | Verifies the `Plaid-Verification` JWT (ES256) via `webhookVerificationKeyGet`, with a `kid` cache and a 5-minute max token age; the route also compares `request_body_sha256` to the raw body hash. |

### Money & date normalization (critical)

Plaid reports `amount` as **positive when money leaves the account** (an outflow).
Aurex stores **expenses as negative** integer milliunits. So:

```ts
plaidAmountToMilliunits(amount) = Math.round(-amount * 1000)
```

- Plaid `12.34` (a $12.34 purchase) → `-12340` (expense).
- Plaid `-100` (a $100 refund/credit) → `100000` (income).

Dates arrive as `YYYY-MM-DD` and are pinned to **12:00 UTC** so they never shift a
day across timezones. Both rules are covered by `lib/plaid-normalize.test.ts`.

---

## API endpoints (`app/api/[[...route]]/plaid.ts`)

All except the webhook run Clerk middleware + `requireAuth` and are tenant-scoped.

| method & path                        | body / params                  | returns                                                                                   |
| ------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `POST /api/plaid/link-token`         | —                              | `{ data: { linkToken } }`. Requests `transactions`, `days_requested: 730`, embeds webhook. |
| `POST /api/plaid/exchange-public-token` | `{ publicToken, metadata? }` (`exchangePublicTokenSchema`) | `{ data: { itemId, status, accountsCreated, transactionsCreated, transactionsModified, transactionsRemoved, errorCode } }`. Encrypts + stores the access token, upserts accounts, runs the first sync. On persistence failure it revokes the Plaid Item (no orphan); if only the first sync fails it returns `status: "error"`. |
| `GET /api/plaid/items`               | —                              | `{ data: PlaidItem[] }` for non-removed linked banks, including account counts and latest sync job status/error. |
| `POST /api/plaid/items/:itemId/sync` | `itemId` param                 | `{ data: { jobId, itemId, status, reason } }`. Tenant-checks the Item, coalesces duplicate active jobs, and kicks the in-process worker. |
| `POST /api/plaid/items/:itemId/update-link-token` | `itemId` param | `{ data: { linkToken } }`. Creates a Link token in update mode using the existing encrypted access token; omits `products`/`transactions`. |
| `DELETE /api/plaid/items/:itemId`    | `itemId` param                 | `{ data: { itemId } }`. Calls `itemRemove`; known already-gone errors are benign and continue local cleanup, but unknown/transient Plaid errors return `502` without local removal. Cleanup sets `status='removed'` and archives linked accounts. |
| `POST /api/plaid/webhook`            | Raw Plaid webhook body + `Plaid-Verification` header | `{ ok: true }`. JWT-verified and raw-body SHA-256 matched against `request_body_sha256`; on `TRANSACTIONS / SYNC_UPDATES_AVAILABLE` queues a sync; on error payloads records `error_code`/`error_message`. |

Errors are normalized through `getPlaidErrorDetails`; in non-production the real
Plaid message is surfaced, in production a generic message is returned. A duplicate
Item link returns `409`.

The webhook is the only public Plaid route. It is allowlisted in `middleware.ts`
(`/api/plaid/webhook`) — do not move dashboard/API routes into the allowlist.

---

## Client / UI

- `features/plaid/api/` — React Query hooks: `use-create-link-token`,
  `use-exchange-public-token`, `use-sync-plaid-item`, `use-remove-plaid-item`,
  `use-update-link-token`, `use-get-plaid-items`.
  All use `readApiError` so server errors surface in toasts, and invalidate
  `['accounts']`, `['plaid-items']`, `['transactions']`, `['summary']`,
  `['onboarding-status']` where relevant.
- `features/plaid/components/plaid-link-button.tsx` — **Connect bank**; opens Plaid
  Link with a freshly minted link token, then exchanges the public token.
- `app/(dashboard)/accounts/page.tsx` — **Sync linked** button iterates the distinct
  `plaidItemId`s on screen and queues sync work for each.
- `app/(dashboard)/accounts/columns.tsx` — `Linked`, `Attention`, and `Archived`
  badges; when a connection is in `error` state it shows the Plaid
  `error_message` (or a generic repair hint) under the account name.
- `app/(dashboard)/accounts/actions.tsx` — per-row menu includes **Reconnect bank**
  for errored linked accounts and **Remove bank connection** (confirm dialog) for
  linked, non-removed accounts.
- `app/(dashboard)/banks/page.tsx` — dedicated linked-banks management surface:
  Item-level status, account counts, last sync, latest queue job, sync/reconnect/remove.

---

## Behavioral invariants (and how they hold)

These are asserted by `lib/plaid-sync.test.ts` / `plaid.test.ts` and/or enforced structurally:

1. **No duplicate transactions across repeated syncs.** `upsertSyncedTransaction`
   does a single atomic `INSERT … ON CONFLICT (user_id, plaid_id) DO UPDATE`
   against the partial unique index `transactions_user_plaid_id_uq`. A re-sent
   `added` row updates in place (counted as `modified`), never a second insert —
   with no select-then-insert window.
2. **User edits survive Plaid updates.** The conflict `set` list writes only
   Plaid-owned fields; it never touches `notes` or `category_id`, so manual
   categorization and notes are preserved when Plaid modifies a transaction.
3. **Removed rows delete only Plaid-origin transactions.** Deletion filters
   `userId AND plaid_id IN (removed ids)`. Manual rows have `plaid_id = null` and
   can never match — proven in the test by rendering the actual delete predicate.
4. **Concurrent syncs can't false-error or regress the cursor.** Each sync takes a
   transaction-scoped `pg_advisory_xact_lock(item)` before re-reading the Item row
   and before calling Plaid. That keeps cursor reads/writes serialized, so a slower
   older sync cannot overwrite a newer cursor. Combined with the on-conflict upsert,
   a race no longer raises a unique violation that would wrongly mark the Item
   `error`. An interrupted sync re-requests from the last stored cursor, and
   `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION` triggers one full retry.
5. **Relinking restores accounts.** When `upsertPlaidAccountsForItem` matches an
   existing account by `plaid_id` whose `plaid_item_id` differs (a reconnect), it
   re-points the account to the new Item and clears `archived_at`. A routine
   same-Item sync leaves `archived_at` untouched, so manual archives stick.
6. **Linking never orphans an Item.** `exchange-public-token` persists the Item +
   accounts in one transaction; if that fails after the Plaid exchange it calls
   `itemRemove` and rolls back (skipping `itemRemove` only on an already-linked
   conflict). If just the *initial sync* fails, the Item stays linked and the
   response reports `status: "error"` so the UI can surface a repair path.
7. **Removal is idempotent without hiding Plaid revoke failures.**
   `DELETE /items/:itemId` proceeds to local cleanup after successful `itemRemove`
   or known already-gone Plaid errors, which lets a retry finish after a partial
   revoke. Unknown/transient Plaid removal failures return `502` and leave local
   rows unchanged so the user can retry. Cleanup marks the Item `removed` and
   archives linked accounts; transactions keep their `account_id` and stay queryable.
8. **Webhook payloads are bound to the signed body.** The route reads the raw body,
   verifies the Plaid JWT, and compares the JWT `request_body_sha256` claim to the
   SHA-256 of those exact body bytes before parsing JSON.
9. **Duplicate sync requests coalesce per Item.** Manual syncs and transaction
   webhooks insert into `plaid_sync_jobs`; the partial unique active-job index
   allows only one `queued`/`running` job per `(user_id, item_id)`. A duplicate
   request that arrives during a running sync updates the job timestamp, which the
   worker treats as a rerun request.

---

## Required environment variables

Add these to `.env.local` (gitignored). Names are also in `.env.example`.

| variable                     | required | default       | notes                                                                 |
| ---------------------------- | -------- | ------------- | --------------------------------------------------------------------- |
| `PLAID_CLIENT_ID`            | yes      | —             | From the Plaid Dashboard.                                             |
| `PLAID_SECRET`               | yes      | —             | Use the **Sandbox** secret locally.                                   |
| `PLAID_ENV`                  | no       | `sandbox`     | `sandbox` or `production` (must be a valid `PlaidEnvironments` key).   |
| `PLAID_PRODUCTS`             | no       | `transactions`| Only `transactions` is supported by the parser today.                 |
| `PLAID_COUNTRY_CODES`        | no       | `US`          | Only `US` is supported by the parser today.                           |
| `PLAID_TOKEN_ENCRYPTION_KEY` | yes\*    | —             | **base64-encoded 32 bytes.** Legacy/default `v1` key; required unless `PLAID_TOKEN_ENCRYPTION_KEYS` supplies the active key. |
| `PLAID_TOKEN_ENCRYPTION_KEYS` | no      | —             | Optional rotation keyring, e.g. `v1=<old>,v2=<new>`.                  |
| `PLAID_TOKEN_ENCRYPTION_KEY_VERSION` | no | `v1`        | Active encryption version for newly written Plaid token payloads.     |
| `NEXT_PUBLIC_APP_URL`        | yes\*    | —             | Origin used to build the webhook URL. Must be a **public HTTPS** origin for webhooks to arrive; `http://localhost:3000` disables them (manual Sync still works). |
| `DATABASE_URL`              | yes      | —             | Existing Postgres connection string.                                  |

Generate the encryption key:

```bash
openssl rand -base64 32
```

> Do not commit `.env.local`. Plaid client credentials and at least one configured
> token-encryption key must exist locally before any live Link/sync call will work.

---

## Migration instructions

```bash
npm run db:migrate     # applies through 0006_clever_synch
```

Requirements / notes:

- **Postgres 15+** is required: `accounts_plaid_item_user_fk` uses
  `ON DELETE SET NULL (plaid_item_id)`, a column-list referential action added in PG 15.
- `db:generate` may try to emit a diff for the composite Plaid FK because
  drizzle-kit can't model the column list — **discard that diff**; the SQL migration
  is authoritative (same pattern as the `0004` tenant FKs).
- Verified locally: table, columns, FK, and partial unique indexes all present
  after migrate.

## Key rotation

Existing single-key installs keep working with `PLAID_TOKEN_ENCRYPTION_KEY` and
`v1:` payloads. To rotate:

1. Set `PLAID_TOKEN_ENCRYPTION_KEYS=v1=<old-base64>,v2=<new-base64>`.
2. Set `PLAID_TOKEN_ENCRYPTION_KEY_VERSION=v2`.
3. Dry-run: `npm run plaid:rotate-key -- --dry-run`.
4. Rotate: `npm run plaid:rotate-key`.

The script rewrites encrypted `plaid_items.access_token` payloads to the active
version and never prints decrypted tokens.

---

## Local Plaid Sandbox setup

1. Create a Plaid account and open the [Dashboard](https://dashboard.plaid.com/).
2. Copy **Client ID** and the **Sandbox secret** (Team Settings → Keys).
3. Put them in `.env.local` along with a generated `PLAID_TOKEN_ENCRYPTION_KEY`
   (keep `PLAID_ENV=sandbox`).
4. `npm run db:migrate` (if not already done), then `npm run dev`.
5. Go to `/accounts` → **Connect bank** → pick any sandbox institution and use the
   sandbox credentials **`user_good` / `pass_good`** (MFA: `1234` if prompted).
6. After Link closes, the first sync runs automatically; linked accounts and
   imported transactions should appear. Use **Sync linked** to queue another pull.

For Recharts-heavy QA, prefer `npm run build && npm run start` over `next dev`
(see CLAUDE.md).

---

## Webhooks & local tunnel setup

Plaid pushes `TRANSACTIONS / SYNC_UPDATES_AVAILABLE` to the webhook embedded in the
link token. Plaid's servers cannot reach `localhost`, so for local webhook testing:

1. Start a public HTTPS tunnel to port 3000, e.g.:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   # or: ngrok http 3000
   ```
2. Set `NEXT_PUBLIC_APP_URL` to the tunnel origin (e.g.
   `https://something.trycloudflare.com`) and restart the dev server so new link
   tokens embed `…/api/plaid/webhook` at that origin.
3. Re-link an Item (existing Items keep their original webhook). Trigger sandbox
   transactions and confirm a `POST /api/plaid/webhook` arrives and a sync job
   queues/runs. In Sandbox you can also fire a webhook via Plaid's
   `/sandbox/item/fire_webhook` endpoint.

The handler verifies the `Plaid-Verification` JWT before doing any work, so a
missing/invalid token returns `401`. Without a tunnel, the **Sync linked** button
is the way to queue updates manually.

---

## Security notes

- Access tokens are AES-256-GCM encrypted (`lib/server-crypto.ts`) and only
  decrypted server-side. They are never returned to the client.
- Every Plaid query is scoped by Clerk `userId`; the composite tenant FK keeps a
  Plaid Item and its accounts in the same tenant.
- The webhook authenticates via Plaid's signed JWT and verifies
  `request_body_sha256` against the raw request body before JSON parsing.
- Do not log decrypted tokens or full keys. Plaid encryption keys live only in
  `.env.local`.

---

## Testing

- `lib/plaid-normalize.test.ts` — amount sign/milliunits and date normalization.
- `lib/server-crypto.test.ts` — encrypt/decrypt round trip, random IV, versioned
  keyring decrypt + re-encrypt.
- `app/api/[[...route]]/plaid.test.ts` — auth, link-token and update-token shapes,
  exchange storing an encrypted token, queued manual/webhook syncs, webhook JWT +
  raw-body hash verification, orphan recovery on persistence failure (revoke),
  already-linked (no revoke), sync-failure `error` status, and removal semantics
  (already-gone Plaid error cleans up; unknown Plaid error does not).
- `lib/plaid-sync.test.ts` — mocked paginated `/transactions/sync`: page
  aggregation + cursor persistence, on-conflict dedupe (re-sent row updates, never
  duplicates), notes/category preservation on modify, tenant- and plaid-id-scoped
  delete (predicate rendered and asserted), advisory-lock acquisition before Plaid
  fetch, relink unarchive, and error marking.

```bash
npm test
```

---

## Known limitations

- **Local credentials not yet configured** (`PLAID_CLIENT_ID`, `PLAID_SECRET`,
  `PLAID_TOKEN_ENCRYPTION_KEY`) — live flow unverified.
- **Parser scope.** `PLAID_PRODUCTS` and `PLAID_COUNTRY_CODES` only accept
  `transactions` and `US`; other values throw by design until explicitly supported.
- **Sync queue is repo-native/in-process.** Jobs are durable in Postgres and
  duplicate active jobs coalesce, but the current worker drain is kicked by app
  requests in-process. For high volume or serverless production, wire the same
  `plaid_sync_jobs` table to a dedicated worker/cron.
- **Webhook coverage.** Only `TRANSACTIONS / SYNC_UPDATES_AVAILABLE` and generic
  `error` payloads are acted on; other webhook types are acknowledged and ignored
  (correct for the `/transactions/sync` model, which does not use the legacy
  `INITIAL_UPDATE`/`HISTORICAL_UPDATE` webhooks).
- **Queue retry policy is minimal.** Failed jobs are recorded for visibility but
  are not automatically retried on a backoff schedule yet.

---

## Next engineering tasks

Prioritized:

1. **Configure Sandbox credentials** and run the live Link → exchange → sync flow
   from `/accounts`; confirm accounts + transactions import and that repeated
   **Sync linked** does not duplicate rows.
2. **Verify webhooks end to end** over an HTTPS tunnel: `NEXT_PUBLIC_APP_URL` set to
   the tunnel, re-link, confirm `SYNC_UPDATES_AVAILABLE` reaches `/api/plaid/webhook`
   and queues/runs a sync.
3. **Sandbox reconnect QA.** With Plaid Sandbox credentials and a webhook tunnel,
   force `ITEM_LOGIN_REQUIRED` via Plaid's `/sandbox/item/reset_login`, confirm the
   Attention state, complete **Reconnect bank**, and confirm the Item returns to
   active after sync.
4. **Dedicated worker/cron** for `plaid_sync_jobs` if deployed to an environment
   where in-process background work is not reliable.
5. **Automatic queue retries** with bounded attempts and backoff for failed sync jobs.
6. **Optional hardening:** rate-limit/replay-guard the webhook beyond JWT max-age;
   alerting on `plaid_items.status='error'` or repeated sync job failures.

---

## Reference: is `/user/create` required?

**No — not for this integration.** The standard Transactions flow is
`/link/token/create` → `/item/public_token/exchange` → `/transactions/sync`, which
is exactly what Aurex implements. `/user/create` (and the `user_token` / `user_id`)
is only needed for Multi-Item Link, Consumer Report (CRA), Income Verification, and
Layer.

Note Plaid's December 10, 2025 change: integrations that *adopt* `/user/create`
after that date identify users by a `usr_`-prefixed `user_id` instead of a
`user_token`. This does not affect a Transactions-only integration that never calls
`/user/create`. Revisit only if Aurex adds one of the products above.

Sources:
- [Transactions — Add Transactions to your app](https://plaid.com/docs/transactions/add-to-app/)
- [New User API overview](https://plaid.com/docs/api/users/user-apis/)
- [Transactions webhooks](https://plaid.com/docs/transactions/webhooks/)
