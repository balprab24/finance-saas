import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, desc, eq, gte, lt, sql, sum } from 'drizzle-orm';
import { differenceInDays, subDays } from 'date-fns';

import { db } from '@/db/drizzle';
import { categories, transactions } from '@/db/schema';
import { parseRange } from '@/lib/date-range';
import { dateRangeQuerySchema } from '@/lib/api-schemas';
import {
  AuthEnv,
  getUserId,
  requireAuth,
} from '@/lib/api-helpers';

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

const app = new Hono<AuthEnv>().get(
  '/',
  clerkMiddleware(),
  requireAuth,
  zValidator('query', dateRangeQuerySchema),
  async (c) => {
    const userId = getUserId(c);
    const { from, to, accountId } = c.req.valid('query');

    const { start: startDate, endExclusive } = parseRange(from, to);

    const periodLength = differenceInDays(endExclusive, startDate);
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEndExclusive = subDays(endExclusive, periodLength);

    async function fetchFinancialData(uid: string, sd: Date, edExclusive: Date) {
      return await db
        .select({
          income: sql<number>`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
          // Sum of negative amounts (still a negative number) used internally.
          expensesSigned: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
          remaining: sum(transactions.amount).mapWith(Number),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, uid),
            accountId ? eq(transactions.accountId, accountId) : undefined,
            gte(transactions.date, sd),
            lt(transactions.date, edExclusive),
          ),
        );
    }

    const [currentPeriod] = await fetchFinancialData(userId, startDate, endExclusive);
    const [lastPeriod] = await fetchFinancialData(userId, lastPeriodStart, lastPeriodEndExclusive);

    const incomeAmount = currentPeriod.income ?? 0;
    const lastIncome = lastPeriod.income ?? 0;

    const expensesAmount = Math.abs(currentPeriod.expensesSigned ?? 0);
    const lastExpenses = Math.abs(lastPeriod.expensesSigned ?? 0);

    const remainingAmount = currentPeriod.remaining ?? 0;
    const lastRemaining = lastPeriod.remaining ?? 0;

    const incomeChange = percentageChange(incomeAmount, lastIncome);
    const expensesChange = percentageChange(expensesAmount, lastExpenses);
    const remainingChange = percentageChange(remainingAmount, lastRemaining);

    const category = await db
      .select({
        categoryId: categories.id,
        name: categories.name,
        value: sql<number>`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(
        categories,
        and(eq(transactions.categoryId, categories.id), eq(categories.userId, userId)),
      )
      .where(
        and(
          eq(transactions.userId, userId),
          accountId ? eq(transactions.accountId, accountId) : undefined,
          lt(transactions.amount, 0),
          gte(transactions.date, startDate),
          lt(transactions.date, endExclusive),
        ),
      )
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

    const topCategories = category.slice(0, 3);
    const otherCategories = category.slice(3);
    const otherSum = otherCategories.reduce((acc, c) => acc + c.value, 0);
    const finalCategories: Array<{ categoryId: string | null; name: string; value: number }> = [
      ...topCategories,
    ];
    if (otherCategories.length > 0) {
      finalCategories.push({ categoryId: null, name: 'Other', value: otherSum });
    }

    const activeDays = await db
      .select({
        date: transactions.date,
        income: sql<number>`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
        expenses: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          accountId ? eq(transactions.accountId, accountId) : undefined,
          gte(transactions.date, startDate),
          lt(transactions.date, endExclusive),
        ),
      )
      .groupBy(transactions.date)
      .orderBy(transactions.date);

    const days = activeDays.map((d) => ({
      date: d.date,
      income: d.income ?? 0,
      expenses: d.expenses ?? 0,
    }));

    return c.json({
      data: {
        remainingAmount,
        remainingChange,
        incomeAmount,
        incomeChange,
        expensesAmount,
        expensesChange,
        categories: finalCategories,
        days,
      },
    });
  },
);

export default app;
