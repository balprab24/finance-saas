import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, desc, eq, gte, inArray, isNull, lt } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { clampRangeSpan, parseRange } from '@/lib/date-range';
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
import { API_RATE_LIMITS, authenticatedRateLimit } from '@/lib/api-rate-limit';

const readLimit = authenticatedRateLimit('transactions:read', API_RATE_LIMITS.read);
const mutationLimit = authenticatedRateLimit('transactions:mutation', API_RATE_LIMITS.mutation);
const bulkLimit = authenticatedRateLimit('transactions:bulk', API_RATE_LIMITS.bulkMutation);

// Response bounds: the list endpoint has no pagination, so an uncapped range would
// let one request pull a full multi-year history into a single JSON body.
const MAX_RANGE_DAYS = 366;
const MAX_LIST_ROWS = 2000;

const app = new Hono<AuthEnv>()
  .get(
    '/',
    clerkMiddleware(),
    requireAuth,
    readLimit,
    zValidator('query', dateRangeQuerySchema),
    async (c) => {
      const userId = getUserId(c);
      const { from, to, accountId, categoryId } = c.req.valid('query');

      const parsed = parseRange(from, to);
      const { start: startDate, endExclusive } = clampRangeSpan(
        parsed.start,
        parsed.endExclusive,
        MAX_RANGE_DAYS,
      );

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
        .innerJoin(
          accounts,
          and(eq(transactions.accountId, accounts.id), eq(accounts.userId, userId)),
        )
        .leftJoin(
          categories,
          and(eq(transactions.categoryId, categories.id), eq(categories.userId, userId)),
        )
        .where(
          and(
            eq(transactions.userId, userId),
            accountId ? eq(transactions.accountId, accountId) : undefined,
            categoryId ? eq(transactions.categoryId, categoryId) : undefined,
            gte(transactions.date, startDate),
            lt(transactions.date, endExclusive),
          ),
        )
        .orderBy(desc(transactions.date))
        .limit(MAX_LIST_ROWS);

      return c.json({ data });
    },
  )
  .get(
    '/:id',
    clerkMiddleware(),
    requireAuth,
    readLimit,
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
    mutationLimit,
    zValidator('json', createTransactionSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId),
            eq(accounts.id, values.accountId),
            isNull(accounts.archivedAt),
          ),
        );
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
    bulkLimit,
    zValidator('json', bulkCreateTransactionsSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      const accountIds = Array.from(new Set(values.map((v) => v.accountId)));
      const owned = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId),
            inArray(accounts.id, accountIds),
            isNull(accounts.archivedAt),
          ),
        );
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
    bulkLimit,
    zValidator('json', bulkIdsSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      // Deleted rows are echoed back (excluding internal Plaid/user columns)
      // so the client can offer an undo that re-creates them via bulk-create.
      const data = await db
        .delete(transactions)
        .where(and(eq(transactions.userId, userId), inArray(transactions.id, values.ids)))
        .returning({
          id: transactions.id,
          amount: transactions.amount,
          payee: transactions.payee,
          notes: transactions.notes,
          date: transactions.date,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
        });

      return c.json({ data });
    },
  )
  .patch(
    '/:id',
    clerkMiddleware(),
    requireAuth,
    mutationLimit,
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
        .where(
          and(
            eq(accounts.userId, userId),
            eq(accounts.id, values.accountId),
            isNull(accounts.archivedAt),
          ),
        );
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
    mutationLimit,
    zValidator('param', idParamSchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');

      // The deleted row is echoed back (excluding internal Plaid/user columns)
      // so the client can offer an undo that re-creates it via bulk-create.
      const [data] = await db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning({
          id: transactions.id,
          amount: transactions.amount,
          payee: transactions.payee,
          notes: transactions.notes,
          date: transactions.date,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
        });

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  );

export default app;
