import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, eq, gte, lt, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { budgets, categories, transactions } from '@/db/schema';
import { parseMonth } from '@/lib/date-range';
import {
  budgetMonthQuerySchema,
  idParamSchema,
  upsertBudgetSchema,
} from '@/lib/api-schemas';
import {
  AuthEnv,
  getUserId,
  jsonError,
  requireAuth,
} from '@/lib/api-helpers';
import { API_RATE_LIMITS, authenticatedRateLimit } from '@/lib/api-rate-limit';

type BudgetStatus = 'none' | 'under' | 'over';

const reportLimit = authenticatedRateLimit('budgets:report', API_RATE_LIMITS.report);
const mutationLimit = authenticatedRateLimit('budgets:mutation', API_RATE_LIMITS.mutation);

const app = new Hono<AuthEnv>()
  .get(
    '/',
    clerkMiddleware(),
    requireAuth,
    reportLimit,
    zValidator('query', budgetMonthQuerySchema),
    async (c) => {
      const userId = getUserId(c);
      const { month } = c.req.valid('query');
      const { start, endExclusive, monthKey } = parseMonth(month);

      // All categories for the user (a budget can exist for any of them).
      const userCategories = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.userId, userId));

      // Budgets set for this month, keyed by category.
      const monthBudgets = await db
        .select({ categoryId: budgets.categoryId, amount: budgets.amount, id: budgets.id })
        .from(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.month, monthKey)));

      // Actual spend (expenses only) for the month, grouped by category.
      const spendRows = await db
        .select({
          categoryId: transactions.categoryId,
          spent: sql<number>`SUM(ABS(${transactions.amount}))`.mapWith(Number),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            lt(transactions.amount, 0),
            gte(transactions.date, start),
            lt(transactions.date, endExclusive),
          ),
        )
        .groupBy(transactions.categoryId);

      const budgetByCategory = new Map(monthBudgets.map((b) => [b.categoryId, b]));
      const spentByCategory = new Map(
        spendRows
          .filter((r) => r.categoryId !== null)
          .map((r) => [r.categoryId as string, r.spent ?? 0]),
      );

      const rows = userCategories.map((cat) => {
        const budget = budgetByCategory.get(cat.id);
        const budgeted = budget?.amount ?? null;
        const spent = spentByCategory.get(cat.id) ?? 0;
        const remaining = budgeted === null ? null : budgeted - spent;
        const percentUsed = budgeted && budgeted > 0 ? (spent / budgeted) * 100 : null;
        const status: BudgetStatus =
          budgeted === null ? 'none' : spent > budgeted ? 'over' : 'under';
        return {
          budgetId: budget?.id ?? null,
          categoryId: cat.id,
          name: cat.name,
          budgeted,
          spent,
          remaining,
          percentUsed,
          status,
        };
      });

      const totalBudgeted = rows.reduce((acc, r) => acc + (r.budgeted ?? 0), 0);
      // Only count spend against categories that actually have a budget set.
      const totalSpent = rows.reduce(
        (acc, r) => acc + (r.budgeted === null ? 0 : r.spent),
        0,
      );
      const totalRemaining = totalBudgeted - totalSpent;

      return c.json({
        data: {
          month: monthKey,
          totalBudgeted,
          totalSpent,
          totalRemaining,
          categories: rows,
        },
      });
    },
  )
  .post(
    '/',
    clerkMiddleware(),
    requireAuth,
    mutationLimit,
    zValidator('json', upsertBudgetSchema),
    async (c) => {
      const userId = getUserId(c);
      const { categoryId, month, amount } = c.req.valid('json');

      // Ownership check: the category must belong to the caller.
      const [owned] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)));

      if (!owned) return jsonError(c, 400, 'Invalid category');

      const { monthKey } = parseMonth(month);

      const [data] = await db
        .insert(budgets)
        .values({ id: crypto.randomUUID(), userId, categoryId, month: monthKey, amount })
        .onConflictDoUpdate({
          target: [budgets.userId, budgets.categoryId, budgets.month],
          set: { amount },
        })
        .returning();

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

      const [data] = await db
        .delete(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.id, id)))
        .returning({ id: budgets.id });

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  );

export default app;
