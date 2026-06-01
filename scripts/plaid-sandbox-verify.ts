import { config } from 'dotenv';

// Load env BEFORE importing any app module. ES `import` statements hoist above
// ordinary top-level code, so app modules that read process.env at import time
// (e.g. db/drizzle.ts reads DATABASE_URL) must be pulled in dynamically, after
// these dotenv calls have run. .env.local wins; .env is a fallback if present.
config({ path: '.env.local' });
config();

import { randomUUID } from 'crypto';

// Plaid Sandbox test institution "First Platypus Bank".
const SANDBOX_INSTITUTION_ID = 'ins_109508';

const args = new Set(process.argv.slice(2));
const KEEP = args.has('--keep');
const FIRE_WEBHOOK = args.has('--fire-webhook');

let failures = 0;
function ok(label: string, detail = '') {
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
}
function fail(label: string, detail = '') {
  failures += 1;
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
}
function step(title: string) {
  console.log(`\n• ${title}`);
}

function preflight() {
  step('Preflight: environment');
  const required = ['PLAID_CLIENT_ID', 'PLAID_SECRET', 'DATABASE_URL', 'PLAID_TOKEN_ENCRYPTION_KEY'];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) fail('required env vars', `missing: ${missing.join(', ')}`);
  else ok('required env vars present');

  const env = (process.env.PLAID_ENV || 'sandbox').trim().toLowerCase();
  if (env !== 'sandbox') fail('PLAID_ENV is sandbox', `refusing to run against PLAID_ENV="${env}"`);
  else ok('PLAID_ENV is sandbox');

  if (failures > 0) {
    console.log('\nPreflight failed. Populate .env.local with sandbox credentials and retry.');
    console.log('See docs/features/plaid-sandbox-verification.md for the full setup.');
    process.exit(1);
  }
}

async function main() {
  preflight();

  // Dynamic imports: these resolve only after dotenv has populated process.env.
  const { eq, sql } = await import('drizzle-orm');
  const { Products, SandboxItemFireWebhookRequestWebhookCodeEnum } = await import('plaid');
  const { db } = await import('@/db/drizzle');
  const { accounts, plaidItems, plaidSyncJobs, plaidWebhookEvents, transactions } = await import(
    '@/db/schema'
  );
  const { getPlaidClient, getPlaidCountryCodes, getPlaidProducts, getPlaidWebhookUrl } =
    await import('@/lib/plaid');
  const { encryptSecret } = await import('@/lib/server-crypto');
  const { getPlaidErrorDetails, syncPlaidItemForUser, upsertPlaidAccountsForItem } = await import(
    '@/lib/plaid-sync'
  );
  const { classifyPlaidFailure } = await import('@/lib/plaid-error-classification');
  const { recordPlaidWebhookEvent } = await import('@/lib/plaid-webhook-replay');
  const { checkRateLimit } = await import('@/lib/rate-limit');

  async function countUserTransactions(userId: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(transactions)
      .where(eq(transactions.userId, userId));
    return row?.count ?? 0;
  }

  async function cleanup(userId: string, plaidItemId: string | null, accessToken: string | null) {
    if (accessToken) {
      try {
        await getPlaidClient().itemRemove({ access_token: accessToken });
      } catch {
        // best-effort: the Item may already be gone or Plaid is unreachable
      }
    }
    await db.transaction(async (tx) => {
      await tx.delete(transactions).where(eq(transactions.userId, userId));
      await tx.delete(plaidSyncJobs).where(eq(plaidSyncJobs.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      await tx.delete(plaidItems).where(eq(plaidItems.userId, userId));
      if (plaidItemId) {
        await tx.delete(plaidWebhookEvents).where(eq(plaidWebhookEvents.plaidItemId, plaidItemId));
      }
    });
  }

  const userId = `sandbox-verify-${randomUUID()}`;
  const plaid = getPlaidClient();
  let plaidItemId: string | null = null;
  let accessToken: string | null = null;
  const localItemId = randomUUID();

  console.log(`\nSynthetic user: ${userId}`);

  try {
    // 1 — Mint a sandbox public token (bypasses the Link UI).
    step('Mint sandbox public token');
    const products = getPlaidProducts();
    const publicTokenRes = await plaid.sandboxPublicTokenCreate({
      institution_id: SANDBOX_INSTITUTION_ID,
      initial_products: products.length ? products : [Products.Transactions],
    });
    const publicToken = publicTokenRes.data.public_token;
    ok('sandboxPublicTokenCreate', SANDBOX_INSTITUTION_ID);

    // 2 — Exchange + persist (mirrors app/api/[[...route]]/plaid.ts exchange handler).
    step('Exchange public token and persist Item + accounts');
    const exchange = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    accessToken = exchange.data.access_token;
    plaidItemId = exchange.data.item_id;
    ok('itemPublicTokenExchange', `item_id=${plaidItemId}`);

    const linkedAccounts = await plaid.accountsGet({ access_token: accessToken });
    const accountsCreated = await db.transaction(async (tx) => {
      await tx.insert(plaidItems).values({
        id: localItemId,
        userId,
        plaidItemId: plaidItemId as string,
        accessToken: encryptSecret(accessToken as string),
        institutionId: SANDBOX_INSTITUTION_ID,
        institutionName: 'First Platypus Bank',
      });
      const result = await upsertPlaidAccountsForItem({
        database: tx,
        userId,
        itemId: localItemId,
        institutionName: 'First Platypus Bank',
        plaidAccounts: linkedAccounts.data.accounts,
      });
      return result.created;
    });
    if (accountsCreated > 0) ok('accounts imported', `created=${accountsCreated}`);
    else fail('accounts imported', 'expected at least one account');

    // 3 — Initial sync. Sandbox transactions can lag a beat after Item creation, so poll.
    step('Initial transaction sync');
    let initial = await syncPlaidItemForUser(localItemId, userId);
    for (let attempt = 0; attempt < 5 && initial.added === 0; attempt += 1) {
      await new Promise((r) => setTimeout(r, 2000));
      initial = await syncPlaidItemForUser(localItemId, userId);
    }
    const afterInitialCount = await countUserTransactions(userId);
    if (initial.added > 0) {
      ok('transactions synced', `added=${initial.added}, db rows=${afterInitialCount}`);
    } else {
      fail('transactions synced', 'no transactions added after retries');
    }

    // 4 — Dedup: a second sync must add nothing and must not change the row count.
    step('Dedup re-sync (no duplicate rows)');
    const second = await syncPlaidItemForUser(localItemId, userId);
    const afterSecondCount = await countUserTransactions(userId);
    if (second.added === 0 && second.modified === 0 && afterSecondCount === afterInitialCount) {
      ok('re-sync is a no-op', `added=0, db rows unchanged=${afterSecondCount}`);
    } else {
      fail(
        're-sync is a no-op',
        `added=${second.added}, modified=${second.modified}, rows ${afterInitialCount}->${afterSecondCount}`,
      );
    }

    // 5 — Replay guard: the same request_body_sha256 must record once, replay second.
    step('Webhook replay guard');
    const sha = randomUUID().replace(/-/g, '').padEnd(64, '0').slice(0, 64);
    const firstEvent = await recordPlaidWebhookEvent({
      requestBodySha256: sha,
      plaidItemId,
      webhookType: 'TRANSACTIONS',
      webhookCode: 'SYNC_UPDATES_AVAILABLE',
    });
    const replayEvent = await recordPlaidWebhookEvent({
      requestBodySha256: sha,
      plaidItemId,
      webhookType: 'TRANSACTIONS',
      webhookCode: 'SYNC_UPDATES_AVAILABLE',
    });
    if (!firstEvent.isReplay && replayEvent.isReplay) {
      ok('duplicate delivery deduped', 'first=new, second=replay');
    } else {
      fail(
        'duplicate delivery deduped',
        `first.isReplay=${firstEvent.isReplay}, second.isReplay=${replayEvent.isReplay}`,
      );
    }

    // 6 — Rate limit: a throwaway key with a small limit must flip to blocked past the cap.
    step('Rate limiter');
    const rlKey = `plaid-verify:rate:${randomUUID()}`;
    const limit = 3;
    const results = [];
    for (let i = 0; i < limit + 1; i += 1) {
      results.push(await checkRateLimit({ key: rlKey, limit, windowMs: 60_000 }));
    }
    const blocked = results[results.length - 1];
    const allowedCount = results.filter((r) => r.allowed).length;
    if (allowedCount === limit && !blocked.allowed && blocked.retryAfterSeconds >= 1) {
      ok(
        'limiter blocks past cap',
        `allowed=${allowedCount}/${limit}, retryAfter=${blocked.retryAfterSeconds}s`,
      );
    } else {
      fail(
        'limiter blocks past cap',
        `allowed=${allowedCount}, lastAllowed=${blocked.allowed}, retryAfter=${blocked.retryAfterSeconds}`,
      );
    }
    await db.execute(sql`delete from rate_limits where key = ${rlKey}`);

    // 7 — Reconnect path: force ITEM_LOGIN_REQUIRED, confirm a sync surfaces it and that
    // classifyPlaidFailure flags it as an item error, then confirm an update-mode link token issues.
    step('Reconnect / ITEM_LOGIN_REQUIRED');
    await plaid.sandboxItemResetLogin({ access_token: accessToken });
    let loginRequiredSeen = false;
    try {
      await syncPlaidItemForUser(localItemId, userId);
      fail('sync surfaces ITEM_LOGIN_REQUIRED', 'sync unexpectedly succeeded after resetLogin');
    } catch (err) {
      const { errorCode } = getPlaidErrorDetails(err);
      const classification = classifyPlaidFailure(err);
      loginRequiredSeen = errorCode === 'ITEM_LOGIN_REQUIRED' && classification.isItemError;
      if (loginRequiredSeen) {
        ok(
          'sync surfaces ITEM_LOGIN_REQUIRED',
          `classified isItemError=${classification.isItemError}`,
        );
      } else {
        fail(
          'sync surfaces ITEM_LOGIN_REQUIRED',
          `errorCode=${errorCode}, isItemError=${classification.isItemError}`,
        );
      }
    }

    try {
      const updateToken = await plaid.linkTokenCreate({
        client_name: 'Aurex',
        language: 'en',
        country_codes: getPlaidCountryCodes(),
        user: { client_user_id: userId },
        webhook: getPlaidWebhookUrl(),
        access_token: accessToken,
      });
      if (updateToken.data.link_token) ok('update-mode link token issued (reconnect path)');
      else fail('update-mode link token issued', 'no link_token returned');
    } catch (err) {
      const { errorMessage } = getPlaidErrorDetails(err);
      fail('update-mode link token issued', errorMessage);
    }

    // 8 — Optional: fire a real SYNC_UPDATES_AVAILABLE webhook (only useful with a public tunnel).
    if (FIRE_WEBHOOK) {
      step('Fire sandbox SYNC_UPDATES_AVAILABLE webhook');
      const webhookUrl = getPlaidWebhookUrl();
      if (!webhookUrl || webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
        fail(
          'webhook delivery target is public',
          `NEXT_PUBLIC_APP_URL must be a public HTTPS tunnel; got ${webhookUrl ?? 'unset'}`,
        );
      } else {
        try {
          await plaid.sandboxItemFireWebhook({
            access_token: accessToken,
            webhook_code: SandboxItemFireWebhookRequestWebhookCodeEnum.SyncUpdatesAvailable,
          });
          ok('sandboxItemFireWebhook dispatched', `delivering to ${webhookUrl}`);
          console.log('    Now check the dev server logs / plaid_sync_jobs for an enqueued webhook job.');
        } catch (err) {
          const { errorMessage } = getPlaidErrorDetails(err);
          fail('sandboxItemFireWebhook dispatched', errorMessage);
        }
      }
    }
  } finally {
    if (KEEP) {
      console.log(
        `\nLeaving sandbox data in place (--keep). User id: ${userId}. Run again without --keep to clean up.`,
      );
    } else {
      step('Cleanup');
      await cleanup(userId, plaidItemId, accessToken);
      ok('removed Item at Plaid and deleted synthetic rows');
    }
  }

  console.log(
    failures === 0
      ? '\nPASS — Plaid Sandbox verification succeeded.'
      : `\nFAIL — ${failures} check(s) failed.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\nUnexpected error during verification:', err);
  process.exit(1);
});
