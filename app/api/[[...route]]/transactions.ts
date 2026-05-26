import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { parseRange } from '@/lib/date-range';
import { accounts, categories, transactions } from '@/db/schema';
import {
  bulkCreateTransactionsSchema,
  bulkIdsSchema,
  createTransactionSchema,
  dateRangeQuerySchema,
  idParamSchema,
  updateTransactionSchema,
} from '@/lib/api-schemas';
import {
  AuthEnv,
  getUserId,
  jsonError,
  requireAuth,
} from '@/lib/api-helpers';

const app = new Hono<AuthEnv>()
  .get(
    '/',
    clerkMiddleware(),
    requireAuth,
    zValidator('query', dateRangeQuerySchema),
    async (c) => {
      const userId = getUserId(c);
      const { from, to, accountId } = c.req.valid('query');

      const { start: startDate, endExclusive } = parseRange(from, to);

      const data = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          category: categories.name,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.userId, userId),
            accountId ? eq(transactions.accountId, accountId) : undefined,
            gte(transactions.date, startDate),
            lt(transactions.date, endExclusive),
          ),
        )
        .orderBy(desc(transactions.date));

      return c.json({ data });
    },
  )
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
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  )
  .post(
    '/',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', createTransactionSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.id, values.accountId)));
      if (!account) return jsonError(c, 400, 'Invalid account');

      if (values.categoryId) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.userId, userId), eq(categories.id, values.categoryId)));
        if (!category) return jsonError(c, 400, 'Invalid category');
      }

      const [data] = await db
        .insert(transactions)
        .values({ id: crypto.randomUUID(), userId, ...values })
        .returning();

      return c.json({ data });
    },
  )
  .post(
    '/bulk-create',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', bulkCreateTransactionsSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      const accountIds = Array.from(new Set(values.map((v) => v.accountId)));
      const owned = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), inArray(accounts.id, accountIds)));
      if (owned.length !== accountIds.length) {
        return jsonError(c, 400, 'Invalid account in batch');
      }

      const categoryIds = Array.from(
        new Set(
          values
            .map((v) => v.categoryId)
            .filter((cid): cid is string => typeof cid === 'string' && cid.length > 0),
        ),
      );
      if (categoryIds.length > 0) {
        const ownedCategories = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.userId, userId), inArray(categories.id, categoryIds)));
        if (ownedCategories.length !== categoryIds.length) {
          return jsonError(c, 400, 'Invalid category in batch');
        }
      }

      const data = await db
        .insert(transactions)
        .values(values.map((v) => ({ id: crypto.randomUUID(), userId, ...v })))
        .returning();

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

      const data = await db
        .delete(transactions)
        .where(and(eq(transactions.userId, userId), inArray(transactions.id, values.ids)))
        .returning({ id: transactions.id });

      return c.json({ data });
    },
  )
  .patch(
    '/:id',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', idParamSchema),
    zValidator('json', updateTransactionSchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');
      const values = c.req.valid('json');

      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.id, values.accountId)));
      if (!account) return jsonError(c, 400, 'Invalid account');

      if (values.categoryId) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.userId, userId), eq(categories.id, values.categoryId)));
        if (!category) return jsonError(c, 400, 'Invalid category');
      }

      const [data] = await db
        .update(transactions)
        .set(values)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning();

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

      const [data] = await db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning({ id: transactions.id });

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  );

export default app;
