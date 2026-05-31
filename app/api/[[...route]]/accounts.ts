import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { accounts, plaidItems, transactions } from '@/db/schema';
import {
  bulkIdsSchema,
  createAccountSchema,
  idParamSchema,
  updateAccountSchema,
} from '@/lib/api-schemas';
import {
  AuthEnv,
  getUserId,
  isForeignKeyViolation,
  isUniqueViolation,
  jsonError,
  requireAuth,
} from '@/lib/api-helpers';

async function getAccountTransactionCount(userId: string, accountId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)));

  return result?.count ?? 0;
}

const app = new Hono<AuthEnv>()
  .get('/', clerkMiddleware(), requireAuth, async (c) => {
    const userId = getUserId(c);
    const includeArchived = c.req.query('includeArchived') === 'true';

    const data = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        archivedAt: accounts.archivedAt,
        plaidId: accounts.plaidId,
        plaidItemId: accounts.plaidItemId,
        institutionName: plaidItems.institutionName,
        plaidStatus: plaidItems.status,
        plaidErrorCode: plaidItems.errorCode,
        plaidErrorMessage: plaidItems.errorMessage,
        lastSyncedAt: plaidItems.lastSyncedAt,
      })
      .from(accounts)
      .leftJoin(
        plaidItems,
        and(eq(accounts.plaidItemId, plaidItems.id), eq(plaidItems.userId, userId)),
      )
      .where(
        includeArchived
          ? eq(accounts.userId, userId)
          : and(eq(accounts.userId, userId), isNull(accounts.archivedAt)),
      );

    return c.json({ data });
  })
  .get(
    '/:id',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', idParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');

      const [data] = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          archivedAt: accounts.archivedAt,
          plaidId: accounts.plaidId,
          plaidItemId: accounts.plaidItemId,
          institutionName: plaidItems.institutionName,
          plaidStatus: plaidItems.status,
          plaidErrorCode: plaidItems.errorCode,
          plaidErrorMessage: plaidItems.errorMessage,
          lastSyncedAt: plaidItems.lastSyncedAt,
        })
        .from(accounts)
        .leftJoin(
          plaidItems,
          and(eq(accounts.plaidItemId, plaidItems.id), eq(plaidItems.userId, userId)),
        )
        .where(and(eq(accounts.userId, userId), eq(accounts.id, id)));

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  )
  .post(
    '/',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', createAccountSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      try {
        const [data] = await db
          .insert(accounts)
          .values({ id: crypto.randomUUID(), userId, ...values })
          .returning();

        return c.json({ data });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return jsonError(c, 409, 'An account with that name already exists');
        }
        throw err;
      }
    },
  )
  .post(
    '/bulk-archive',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', bulkIdsSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      const data = await db
        .update(accounts)
        .set({ archivedAt: new Date() })
        .where(and(eq(accounts.userId, userId), inArray(accounts.id, values.ids)))
        .returning({ id: accounts.id, archivedAt: accounts.archivedAt });

      return c.json({ data });
    },
  )
  .post(
    '/bulk-delete',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', bulkIdsSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), inArray(transactions.accountId, values.ids)));

      if (count > 0) {
        return jsonError(
          c,
          409,
          'Archive accounts with transactions instead of deleting them',
        );
      }

      const data = await db
        .delete(accounts)
        .where(and(eq(accounts.userId, userId), inArray(accounts.id, values.ids)))
        .returning({ id: accounts.id });

      return c.json({ data });
    },
  )
  .patch(
    '/:id',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', idParamSchema),
    zValidator('json', updateAccountSchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');
      const values = c.req.valid('json');

      try {
        const [data] = await db
          .update(accounts)
          .set(values)
          .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
          .returning();

        if (!data) return jsonError(c, 404, 'Not found');
        return c.json({ data });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return jsonError(c, 409, 'An account with that name already exists');
        }
        throw err;
      }
    },
  )
  .post(
    '/:id/archive',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', idParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');

      const [data] = await db
        .update(accounts)
        .set({ archivedAt: new Date() })
        .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
        .returning({ id: accounts.id, archivedAt: accounts.archivedAt });

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  )
  .post(
    '/:id/restore',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', idParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');

      const [data] = await db
        .update(accounts)
        .set({ archivedAt: null })
        .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
        .returning({ id: accounts.id, archivedAt: accounts.archivedAt });

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  )
  .delete(
    '/:id',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', idParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');

      const transactionCount = await getAccountTransactionCount(userId, id);
      if (transactionCount > 0) {
        return jsonError(c, 409, 'Archive accounts with transactions instead of deleting them');
      }

      try {
        const [data] = await db
          .delete(accounts)
          .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
          .returning({ id: accounts.id });

        if (!data) return jsonError(c, 404, 'Not found');
        return c.json({ data });
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          return jsonError(c, 409, 'Archive accounts with transactions instead of deleting them');
        }
        throw err;
      }
    },
  );

export default app;
