import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { accounts, categories, transactions } from '@/db/schema';
import { buildDemoWorkspace } from '@/lib/demo-data';
import {
  AuthEnv,
  getUserId,
  isUniqueViolation,
  jsonError,
  requireAuth,
} from '@/lib/api-helpers';
import { API_RATE_LIMITS, authenticatedRateLimit } from '@/lib/api-rate-limit';

type Counter = typeof accounts | typeof categories;

const readLimit = authenticatedRateLimit('onboarding:read', API_RATE_LIMITS.read);
const demoSeedLimit = authenticatedRateLimit('onboarding:demo-seed', API_RATE_LIMITS.demoSeed);

async function countRows(table: Counter, userId: string) {
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
    .where(eq(transactions.userId, userId));
  const transactionCount = transactionResult?.count ?? 0;

  return {
    accountCount,
    categoryCount,
    transactionCount,
    isEmpty: accountCount === 0 && categoryCount === 0 && transactionCount === 0,
  };
}

const app = new Hono<AuthEnv>()
  .get('/status', requireAuth, readLimit, async (c) => {
    const userId = getUserId(c);
    const status = await getWorkspaceStatus(userId);
    return c.json(status);
  })
  .post('/demo', requireAuth, demoSeedLimit, async (c) => {
    const userId = getUserId(c);

    const status = await getWorkspaceStatus(userId);
    if (!status.isEmpty) {
      return jsonError(
        c,
        409,
        'Demo data can only be loaded into an empty workspace',
      );
    }

    const demo = buildDemoWorkspace(userId);

    try {
      await db.transaction(async (tx) => {
        await tx.insert(accounts).values(demo.accounts);
        await tx.insert(categories).values(demo.categories);
        await tx.insert(transactions).values(demo.transactions);
      });
    } catch (err) {
      // Two concurrent /demo requests can both pass the isEmpty check above.
      // The deterministic demo ids and the new (user_id, name) uniqueness
      // backstop a unique-violation if a race happens. Return 409 so the
      // client can retry without seeing a 500.
      if (isUniqueViolation(err)) {
        return jsonError(
          c,
          409,
          'Demo data is already being loaded for this workspace',
        );
      }
      throw err;
    }

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
