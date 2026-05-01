import { Hono } from 'hono';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { accounts, categories, transactions } from '@/db/schema';
import { buildDemoWorkspace } from '@/lib/demo-data';

async function countRows(table: typeof accounts | typeof categories, userId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(table)
    .where(eq(table.userId, userId));

  return result?.count ?? 0;
}

async function getWorkspaceStatus(userId: string) {
  const accountCount = await countRows(accounts, userId);
  const categoryCount = await countRows(categories, userId);
  const [transactionResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(accounts.userId, userId));
  const transactionCount = transactionResult?.count ?? 0;

  return {
    accountCount,
    categoryCount,
    transactionCount,
    isEmpty: accountCount === 0 && categoryCount === 0 && transactionCount === 0,
  };
}

const app = new Hono()
  .get('/status', clerkMiddleware(), async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

    const status = await getWorkspaceStatus(auth.userId);
    return c.json(status);
  })
  .post('/demo', clerkMiddleware(), async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

    const status = await getWorkspaceStatus(auth.userId);
    if (!status.isEmpty) {
      return c.json({ error: 'Demo data can only be loaded into an empty workspace' }, 409);
    }

    const demo = buildDemoWorkspace(auth.userId);

    await db.transaction(async (tx) => {
      await tx.insert(accounts).values(demo.accounts);
      await tx.insert(categories).values(demo.categories);
      await tx.insert(transactions).values(demo.transactions);
    });

    return c.json(
      {
        accountCount: demo.accounts.length,
        categoryCount: demo.categories.length,
        transactionCount: demo.transactions.length,
        isEmpty: false,
      },
      201,
    );
  });

export default app;
