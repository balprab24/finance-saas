import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { createHash, timingSafeEqual } from 'crypto';

import { db } from '@/db/drizzle';
import { accounts, plaidItems, plaidSyncJobs } from '@/db/schema';
import { exchangePublicTokenSchema } from '@/lib/api-schemas';
import {
  AuthEnv,
  getUserId,
  isUniqueViolation,
  jsonError,
  requireAuth,
} from '@/lib/api-helpers';
import {
  getPlaidClient,
  getPlaidCountryCodes,
  getPlaidProducts,
  getPlaidWebhookUrl,
} from '@/lib/plaid';
import { encryptSecret, decryptSecret } from '@/lib/server-crypto';
import {
  getPlaidErrorDetails,
  syncPlaidItemForUser,
  upsertPlaidAccountsForItem,
} from '@/lib/plaid-sync';
import {
  enqueuePlaidSyncJob,
  enqueuePlaidSyncJobByPlaidItemId,
  kickPlaidSyncWorker,
} from '@/lib/plaid-sync-jobs';
import { verifyPlaidWebhookToken } from '@/lib/plaid-webhook';

const itemParamSchema = z.object({
  itemId: z.string().trim().min(1).max(64),
});

// Plaid errors that mean the Item is already gone on Plaid's side. On removal we
// treat them as permission to continue local cleanup instead of failing.
const REMOVABLE_PLAID_ERROR_CODES = new Set([
  'ITEM_NOT_FOUND',
  'INVALID_ACCESS_TOKEN',
  'ITEM_NO_LONGER_SUPPORTED',
]);

function plaidFailureMessage(err: unknown, fallback: string) {
  const { errorMessage } = getPlaidErrorDetails(err);
  if (process.env.NODE_ENV !== 'production') return errorMessage || fallback;
  return fallback;
}

function verifyWebhookBodyHash(rawBody: string, expectedHash: unknown) {
  if (
    typeof expectedHash !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(expectedHash)
  ) {
    return false;
  }

  const actualHash = createHash('sha256').update(rawBody, 'utf8').digest('hex');
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(actualHash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function markWebhookItemError(itemId: string, error: unknown) {
  const plaidError = error && typeof error === 'object' ? error : undefined;
  const errorCode =
    plaidError && 'error_code' in plaidError
      ? String((plaidError as { error_code?: unknown }).error_code || '')
      : null;
  const errorMessage =
    plaidError && 'error_message' in plaidError
      ? String((plaidError as { error_message?: unknown }).error_message || '')
      : 'Plaid webhook reported an item error';

  await db
    .update(plaidItems)
    .set({
      status: 'error',
      errorCode,
      errorMessage: errorMessage.slice(0, 500),
      lastWebhookAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(plaidItems.plaidItemId, itemId));
}

const app = new Hono<AuthEnv>()
  .post('/link-token', clerkMiddleware(), requireAuth, async (c) => {
    const userId = getUserId(c);

    try {
      const response = await getPlaidClient().linkTokenCreate({
        client_name: 'Aurex',
        language: 'en',
        country_codes: getPlaidCountryCodes(),
        products: getPlaidProducts(),
        user: { client_user_id: userId },
        webhook: getPlaidWebhookUrl(),
        transactions: { days_requested: 730 },
      });

      return c.json({ data: { linkToken: response.data.link_token } });
    } catch (err) {
      return jsonError(c, 502, plaidFailureMessage(err, 'Unable to start bank connection'));
    }
  })
  .post(
    '/exchange-public-token',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', exchangePublicTokenSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');
      const plaidClient = getPlaidClient();
      const institution = values.metadata?.institution;

      // Step 1 — exchange the public token. Nothing local exists yet, so a
      // failure here cannot orphan anything.
      let accessToken: string;
      let plaidItemId: string;
      try {
        const exchange = await plaidClient.itemPublicTokenExchange({
          public_token: values.publicToken,
        });
        accessToken = exchange.data.access_token;
        plaidItemId = exchange.data.item_id;
      } catch (err) {
        return jsonError(c, 502, plaidFailureMessage(err, 'Unable to connect this bank'));
      }

      // Step 2 — persist the Item and its accounts atomically. If this fails
      // after the exchange the Plaid Item would be orphaned, so revoke it at
      // Plaid (unless it is simply already linked, where revoking would break the
      // existing connection) and let the transaction roll back the local rows.
      const itemId = crypto.randomUUID();
      let accountsCreated = 0;
      try {
        const linkedAccounts = await plaidClient.accountsGet({ access_token: accessToken });
        accountsCreated = await db.transaction(async (tx) => {
          await tx.insert(plaidItems).values({
            id: itemId,
            userId,
            plaidItemId,
            accessToken: encryptSecret(accessToken),
            institutionId: institution?.institution_id || null,
            institutionName: institution?.name || null,
          });
          const result = await upsertPlaidAccountsForItem({
            database: tx,
            userId,
            itemId,
            institutionName: institution?.name || null,
            plaidAccounts: linkedAccounts.data.accounts,
          });
          return result.created;
        });
      } catch (err) {
        const alreadyLinked = isUniqueViolation(err);
        if (!alreadyLinked) {
          try {
            await plaidClient.itemRemove({ access_token: accessToken });
          } catch {
            // best-effort: the Item may already be gone or Plaid is unreachable
          }
        }
        if (alreadyLinked) {
          return jsonError(c, 409, 'This bank connection is already linked');
        }
        return jsonError(c, 502, plaidFailureMessage(err, 'Unable to connect this bank'));
      }

      // Step 3 — initial sync. The Item and accounts are already saved, so a sync
      // failure should not 502. Report the connection as needing attention; the
      // sync has already marked the Item status = 'error', and the UI surfaces it.
      try {
        const syncResult = await syncPlaidItemForUser(itemId, userId);
        return c.json({
          data: {
            itemId,
            status: 'active' as const,
            accountsCreated: accountsCreated + syncResult.accountsCreated,
            transactionsCreated: syncResult.added,
            transactionsModified: syncResult.modified,
            transactionsRemoved: syncResult.removed,
            errorCode: null as string | null,
          },
        });
      } catch (err) {
        const { errorCode } = getPlaidErrorDetails(err);
        return c.json({
          data: {
            itemId,
            status: 'error' as const,
            accountsCreated,
            transactionsCreated: 0,
            transactionsModified: 0,
            transactionsRemoved: 0,
            errorCode: errorCode ?? null,
          },
        });
      }
    },
  )
  .get('/items', clerkMiddleware(), requireAuth, async (c) => {
    const userId = getUserId(c);

    const items = await db
      .select({
        id: plaidItems.id,
        institutionName: plaidItems.institutionName,
        status: plaidItems.status,
        errorCode: plaidItems.errorCode,
        errorMessage: plaidItems.errorMessage,
        lastSyncedAt: plaidItems.lastSyncedAt,
        lastWebhookAt: plaidItems.lastWebhookAt,
        createdAt: plaidItems.createdAt,
        accountCount: sql<number>`count(${accounts.id})`.mapWith(Number),
        archivedAccountCount:
          sql<number>`count(${accounts.id}) filter (where ${accounts.archivedAt} is not null)`.mapWith(
            Number,
          ),
      })
      .from(plaidItems)
      .leftJoin(
        accounts,
        and(eq(accounts.plaidItemId, plaidItems.id), eq(accounts.userId, userId)),
      )
      .where(and(eq(plaidItems.userId, userId), ne(plaidItems.status, 'removed')))
      .groupBy(
        plaidItems.id,
        plaidItems.institutionName,
        plaidItems.status,
        plaidItems.errorCode,
        plaidItems.errorMessage,
        plaidItems.lastSyncedAt,
        plaidItems.lastWebhookAt,
        plaidItems.createdAt,
      )
      .orderBy(desc(plaidItems.createdAt));

    const itemIds = items.map((item) => item.id);
    const jobs =
      itemIds.length > 0
        ? await db
            .select({
              id: plaidSyncJobs.id,
              itemId: plaidSyncJobs.itemId,
              status: plaidSyncJobs.status,
              reason: plaidSyncJobs.reason,
              lastError: plaidSyncJobs.lastError,
              updatedAt: plaidSyncJobs.updatedAt,
              finishedAt: plaidSyncJobs.finishedAt,
            })
            .from(plaidSyncJobs)
            .where(and(eq(plaidSyncJobs.userId, userId), inArray(plaidSyncJobs.itemId, itemIds)))
            .orderBy(desc(plaidSyncJobs.updatedAt))
        : [];

    const latestJobByItemId = new Map<string, (typeof jobs)[number]>();
    for (const job of jobs) {
      if (!latestJobByItemId.has(job.itemId)) latestJobByItemId.set(job.itemId, job);
    }

    return c.json({
      data: items.map((item) => ({
        ...item,
        latestSyncJob: latestJobByItemId.get(item.id) ?? null,
      })),
    });
  })
  .post(
    '/items/:itemId/sync',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', itemParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { itemId } = c.req.valid('param');

      try {
        const [item] = await db
          .select({ id: plaidItems.id, status: plaidItems.status })
          .from(plaidItems)
          .where(and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId)));
        if (!item || item.status === 'removed') return jsonError(c, 404, 'Not found');

        const job = await enqueuePlaidSyncJob({ itemId, userId, reason: 'manual' });
        void kickPlaidSyncWorker();
        return c.json({ data: job });
      } catch (err) {
        return jsonError(c, 502, plaidFailureMessage(err, 'Unable to queue bank sync'));
      }
    },
  )
  .post(
    '/items/:itemId/update-link-token',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', itemParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { itemId } = c.req.valid('param');

      const [item] = await db
        .select()
        .from(plaidItems)
        .where(and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId)));
      if (!item || item.status === 'removed') return jsonError(c, 404, 'Not found');

      try {
        const response = await getPlaidClient().linkTokenCreate({
          client_name: 'Aurex',
          language: 'en',
          country_codes: getPlaidCountryCodes(),
          user: { client_user_id: userId },
          webhook: getPlaidWebhookUrl(),
          access_token: decryptSecret(item.accessToken),
        });

        return c.json({ data: { linkToken: response.data.link_token } });
      } catch (err) {
        return jsonError(c, 502, plaidFailureMessage(err, 'Unable to start bank reconnection'));
      }
    },
  )
  .delete(
    '/items/:itemId',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', itemParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { itemId } = c.req.valid('param');

      const [item] = await db
        .select()
        .from(plaidItems)
        .where(and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId)));
      if (!item || item.status === 'removed') return jsonError(c, 404, 'Not found');

      // "Already gone" errors are expected on a retry (a prior attempt may have
      // revoked but failed local cleanup). Unknown/transient Plaid errors must not
      // mark the Item removed locally because Plaid may still have an active Item.
      try {
        await getPlaidClient().itemRemove({ access_token: decryptSecret(item.accessToken) });
      } catch (err) {
        const { errorCode } = getPlaidErrorDetails(err);
        if (!errorCode || !REMOVABLE_PLAID_ERROR_CODES.has(errorCode)) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[plaid item remove]', errorCode || err);
          }
          return jsonError(c, 502, plaidFailureMessage(err, 'Unable to remove bank connection'));
        }
      }

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(plaidItems)
          .set({ status: 'removed', errorCode: null, errorMessage: null, updatedAt: now })
          .where(and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId)));
        await tx
          .update(accounts)
          .set({ archivedAt: now })
          .where(and(eq(accounts.userId, userId), eq(accounts.plaidItemId, itemId)));
      });

      return c.json({ data: { itemId } });
    },
  )
  .post('/webhook', async (c) => {
    const token = c.req.header('plaid-verification');
    if (!token) return jsonError(c, 401, 'Missing Plaid verification token');

    const rawBody = await c.req.text();
    let claims: Awaited<ReturnType<typeof verifyPlaidWebhookToken>>;
    try {
      claims = await verifyPlaidWebhookToken(token);
    } catch {
      return jsonError(c, 401, 'Invalid Plaid verification token');
    }

    if (!verifyWebhookBodyHash(rawBody, claims.request_body_sha256)) {
      return jsonError(c, 401, 'Invalid Plaid verification token');
    }

    const payload = (() => {
      try {
        return JSON.parse(rawBody) as unknown;
      } catch {
        return null;
      }
    })();
    if (!payload || typeof payload !== 'object') {
      return jsonError(c, 400, 'Invalid Plaid webhook payload');
    }

    const webhookType = 'webhook_type' in payload ? payload.webhook_type : undefined;
    const webhookCode = 'webhook_code' in payload ? payload.webhook_code : undefined;
    const plaidItemId = 'item_id' in payload ? payload.item_id : undefined;

    if (typeof plaidItemId !== 'string') return c.json({ ok: true });

    if ('error' in payload && payload.error) {
      await markWebhookItemError(plaidItemId, payload.error);
      return c.json({ ok: true });
    }

    if (webhookType === 'TRANSACTIONS' && webhookCode === 'SYNC_UPDATES_AVAILABLE') {
      await enqueuePlaidSyncJobByPlaidItemId({ plaidItemId, reason: 'webhook' }).catch((err) => {
        if (process.env.NODE_ENV !== 'production') console.error('[plaid webhook sync]', err);
      });
      void kickPlaidSyncWorker();
    }

    return c.json({ ok: true });
  });

export default app;
