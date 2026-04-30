import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { parseRange } from '@/lib/date-range';
import {
  accounts,
  categories,
  insertTransactionSchema,
  transactions,
} from '@/db/schema';

const app = new Hono()
  .get(
    '/',
    clerkMiddleware(),
    zValidator(
      'query',
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
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
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, auth.userId),
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
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
      const { id } = c.req.valid('param');
      if (!id) return c.json({ error: 'Missing id' }, 400);

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
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId)));

      if (!data) return c.json({ error: 'Not found' }, 404);
      return c.json({ data });
    },
  )
  .post(
    '/',
    clerkMiddleware(),
    zValidator('json', insertTransactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
      const values = c.req.valid('json');

      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, values.accountId)));
      if (!account) return c.json({ error: 'Invalid account' }, 400);

      if (values.categoryId) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(
            and(eq(categories.userId, auth.userId), eq(categories.id, values.categoryId)),
          );
        if (!category) return c.json({ error: 'Invalid category' }, 400);
      }

      const [data] = await db
        .insert(transactions)
        .values({ id: crypto.randomUUID(), ...values })
        .returning();

      return c.json({ data });
    },
  )
  .post(
    '/bulk-create',
    clerkMiddleware(),
    zValidator('json', z.array(insertTransactionSchema.omit({ id: true }))),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
      const values = c.req.valid('json');

      if (values.length === 0) return c.json({ data: [] });

      const accountIds = Array.from(new Set(values.map((v) => v.accountId)));
      const owned = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, auth.userId), inArray(accounts.id, accountIds)));
      if (owned.length !== accountIds.length) {
        return c.json({ error: 'Invalid account in batch' }, 400);
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
          .where(
            and(eq(categories.userId, auth.userId), inArray(categories.id, categoryIds)),
          );
        if (ownedCategories.length !== categoryIds.length) {
          return c.json({ error: 'Invalid category in batch' }, 400);
        }
      }

      const data = await db
        .insert(transactions)
        .values(values.map((v) => ({ id: crypto.randomUUID(), ...v })))
        .returning();

      return c.json({ data });
    },
  )
  .post(
    '/bulk-delete',
    clerkMiddleware(),
    zValidator('json', z.object({ ids: z.array(z.string()) })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
      const values = c.req.valid('json');

      const transactionsToDelete = db.$with('transactions_to_delete').as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(
              inArray(transactions.id, values.ids),
              eq(accounts.userId, auth.userId),
            ),
          ),
      );

      const data = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(inArray(transactions.id, sql`(select id from ${transactionsToDelete})`))
        .returning({ id: transactions.id });

      return c.json({ data });
    },
  )
  .patch(
    '/:id',
    clerkMiddleware(),
    zValidator('param', z.object({ id: z.string().optional() })),
    zValidator('json', insertTransactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
      const { id } = c.req.valid('param');
      const values = c.req.valid('json');
      if (!id) return c.json({ error: 'Missing id' }, 400);

      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, values.accountId)));
      if (!account) return c.json({ error: 'Invalid account' }, 400);

      if (values.categoryId) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(
            and(eq(categories.userId, auth.userId), eq(categories.id, values.categoryId)),
          );
        if (!category) return c.json({ error: 'Invalid category' }, 400);
      }

      const transactionsToUpdate = db.$with('transactions_to_update').as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId))),
      );

      const [data] = await db
        .with(transactionsToUpdate)
        .update(transactions)
        .set(values)
        .where(inArray(transactions.id, sql`(select id from ${transactionsToUpdate})`))
        .returning();

      if (!data) return c.json({ error: 'Not found' }, 404);
      return c.json({ data });
    },
  )
  .delete(
    '/:id',
    clerkMiddleware(),
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
      const { id } = c.req.valid('param');
      if (!id) return c.json({ error: 'Missing id' }, 400);

      const transactionsToDelete = db.$with('transactions_to_delete').as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId))),
      );

      const [data] = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(inArray(transactions.id, sql`(select id from ${transactionsToDelete})`))
        .returning({ id: transactions.id });

      if (!data) return c.json({ error: 'Not found' }, 404);
      return c.json({ data });
    },
  );

export default app;