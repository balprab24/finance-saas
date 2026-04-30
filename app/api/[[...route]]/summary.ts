import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { and, desc, eq, gte, lt, sql, sum } from 'drizzle-orm';
import { differenceInDays, subDays } from 'date-fns';

import { db } from '@/db/drizzle';
import { accounts, categories, transactions } from '@/db/schema';
import { parseRange } from '@/lib/date-range';

const app = new Hono().get(
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

    const periodLength = differenceInDays(endExclusive, startDate);
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEndExclusive = subDays(endExclusive, periodLength);

    async function fetchFinancialData(userId: string, sd: Date, edExclusive: Date) {
      return await db
        .select({
          income: sql<number>`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
          expenses: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
          remaining: sum(transactions.amount).mapWith(Number),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, userId),
            gte(transactions.date, sd),
            lt(transactions.date, edExclusive),
          ),
        );
    }

    const [currentPeriod] = await fetchFinancialData(auth.userId, startDate, endExclusive);
    const [lastPeriod] = await fetchFinancialData(auth.userId, lastPeriodStart, lastPeriodEndExclusive);

    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return previous === current ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };

    const incomeChange = calculatePercentageChange(currentPeriod.income ?? 0, lastPeriod.income ?? 0);
    const expensesChange = calculatePercentageChange(currentPeriod.expenses ?? 0, lastPeriod.expenses ?? 0);
    const remainingChange = calculatePercentageChange(currentPeriod.remaining ?? 0, lastPeriod.remaining ?? 0);

    const category = await db
      .select({
        name: categories.name,
        value: sql<number>`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, auth.userId),
          lt(transactions.amount, 0),
          gte(transactions.date, startDate),
          lt(transactions.date, endExclusive),
        ),
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

    const topCategories = category.slice(0, 3);
    const otherCategories = category.slice(3);
    const otherSum = otherCategories.reduce((sum, c) => sum + c.value, 0);
    const finalCategories = [...topCategories];
    if (otherCategories.length > 0) finalCategories.push({ name: 'Other', value: otherSum });

    const activeDays = await db
      .select({
        date: transactions.date,
        income: sql<number>`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
        expenses: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, auth.userId),
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
        remainingAmount: currentPeriod.remaining ?? 0,
        remainingChange,
        incomeAmount: currentPeriod.income ?? 0,
        incomeChange,
        expensesAmount: currentPeriod.expenses ?? 0,
        expensesChange,
        categories: finalCategories,
        days,
      },
    });
  },
);

export default app;