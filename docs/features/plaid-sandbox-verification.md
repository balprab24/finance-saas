# Plaid Sandbox verification (Stage 5)

End-to-end verification that the Plaid integration works against the live Plaid
**Sandbox** environment: linking, token exchange, account import, transaction sync,
duplicate-safety, the webhook replay guard, the per-caller rate limiter, and the
reconnect (`ITEM_LOGIN_REQUIRED`) path.

Most of the flow is exercised by an automated script
(`scripts/plaid-sandbox-verify.ts`, run via `npm run plaid:verify`) that mints a
sandbox token directly through the Plaid API, so it does **not** require clicking
through the Plaid Link UI. Only the live signed-webhook delivery needs a public
HTTPS tunnel.

## 1. Prerequisites

Populate `.env.local` (gitignored — never commit it):

| Variable | How to get it |
| --- | --- |
| `PLAID_CLIENT_ID` | dashboard.plaid.com → Developers → Keys |
| `PLAID_SECRET` | the **Sandbox** secret from the same page |
| `PLAID_ENV` | `sandbox` (the verifier refuses to run with anything else) |
| `PLAID_TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` (32 bytes, base64) |
| `CRON_SECRET` | `openssl rand -hex 32` (needed for the cron drain, not the verifier) |
| `DATABASE_URL` | already set for local Postgres |

Apply migrations so the tables the integration depends on exist (notably
`plaid_webhook_events` and `rate_limits` from `0008`, and the sync-job columns from
`0007`):

```bash
npm run db:migrate
```

## 2. Automated verification

```bash
npm run plaid:verify
```

The script uses a throwaway synthetic user id (`sandbox-verify-<uuid>`) and reuses
the app's own library functions, so it covers the real production code paths. It
asserts, in order:

1. **Preflight** — required env vars present and `PLAID_ENV === sandbox`.
2. **Mint sandbox token** — `sandboxPublicTokenCreate` for `ins_109508` (First Platypus Bank).
3. **Exchange + persist** — `itemPublicTokenExchange`, then the same transactional
   insert (`plaidItems` + `upsertPlaidAccountsForItem`) the exchange route runs;
   asserts ≥1 account imported.
4. **Initial sync** — `syncPlaidItemForUser` adds transactions (polls a few times,
   since Sandbox transactions can lag Item creation).
5. **Dedup re-sync** — a second sync adds/modifies nothing and leaves the DB row
   count unchanged (the persisted cursor prevents duplicates).
6. **Replay guard** — the same `request_body_sha256` records once, then reports a replay.
7. **Rate limiter** — a throwaway key with a small limit flips to blocked past the cap.
8. **Reconnect** — `sandboxItemResetLogin` forces `ITEM_LOGIN_REQUIRED`; the next sync
   surfaces it and `classifyPlaidFailure` flags it as an item error, then an
   update-mode link token is issued (the reconnect path).
9. **Cleanup** — `itemRemove` at Plaid and deletes the synthetic user's rows.

Exit code is `0` only if every check passed. Flags:

- `--keep` — skip cleanup so you can inspect the imported data in the UI (see below).
- `--fire-webhook` — additionally dispatch a real `SYNC_UPDATES_AVAILABLE` webhook
  (only meaningful with the public tunnel from step 4).

## 3. Manual UI smoke test

```bash
npm run dev
```

Sign in, go to **/accounts**, click **Link a bank**, choose *First Platypus Bank*,
and use the Sandbox credentials `user_good` / `pass_good`. Confirm:

- The institution and its accounts appear.
- Transactions appear on **/transactions**.
- The item's **Sync** action enqueues a job and updates "last synced".

Tip: run `npm run plaid:verify -- --keep` first to pre-seed a linked item, then
inspect it in the running app.

## 4. Live signed-webhook test (cloudflared)

The `/api/plaid/webhook` handler verifies a real Plaid-signed JWT, so testing it
requires Plaid to deliver to a public HTTPS URL. Use a quick cloudflared tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

1. Set `NEXT_PUBLIC_APP_URL` in `.env.local` to the printed `https://…trycloudflare.com` URL.
   (`getPlaidWebhookUrl()` derives the webhook URL from this, so it must be public.)
2. Restart `npm run dev` so the new env is picked up.
3. **Re-link** the bank (or run `npm run plaid:verify -- --keep`) so the Item
   registers with the public webhook URL.
4. Fire the webhook: `npm run plaid:verify -- --keep --fire-webhook`, or use the
   Plaid dashboard's "fire webhook" tool.

Confirm:

- `POST /api/plaid/webhook` returns `{ ok: true }` (check dev server logs).
- A `plaid_sync_jobs` row is enqueued with `reason = 'webhook'` and the warm drain
  syncs it.
- A duplicate delivery of the same body is acknowledged but **not** reprocessed
  (the replay guard rows live in `plaid_webhook_events`).

When done, unset/restore `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` and run
`npm run plaid:verify` once more (without `--keep`) to clean up.

## 5. Deploy-readiness checklist

Before/after deploying to Vercel:

- **Migrations** — `0007_silly_fixer.sql` and `0008_misty_energizer.sql` are applied
  to the production database.
- **Vercel env vars** are set:
  - Clerk production keys + URLs (`NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`)
  - `DATABASE_URL`
  - `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, `PLAID_PRODUCTS`, `PLAID_COUNTRY_CODES`
  - `PLAID_TOKEN_ENCRYPTION_KEY` (and the keyring vars if rotating)
  - `NEXT_PUBLIC_APP_URL` = the production origin (drives the Plaid webhook URL)
  - `CRON_SECRET` (Vercel injects it as the cron `Authorization: Bearer` header)
  - Optional Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`,
    `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
- **Cron cadence** — `vercel.json` uses `*/5 * * * *`, which requires **Vercel Pro**.
  On Hobby the cron only runs **daily**; set `SENTRY_PLAID_SYNC_MONITOR_SCHEDULE` to
  the actual cadence so the Sentry Cron monitor doesn't raise false missed-check-in
  alerts.
- **Sentry source maps** — builds warn without `SENTRY_AUTH_TOKEN`; that's expected
  unless source-map upload is configured. Never expose `SENTRY_AUTH_TOKEN` to the browser.
