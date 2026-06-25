import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { subMonths } from 'date-fns';

import { db } from '@/db/drizzle';
import { categories, recurringIgnores, transactions } from '@/db/schema';
import { parseMonth } from '@/lib/date-range';
import { detectRecurring, type RecurringInput } from '@/lib/recurring';
import { flagUnusual } from '@/lib/insights';
import { budgetMonthQuerySchema, ignoreRecurringSchema } from '@/lib/api-schemas';
import { AuthEnv, getUserId, requireAuth } from '@/lib/api-helpers';
import { API_RATE_LIMITS, authenticatedRateLimit } from '@/lib/api-rate-limit';

// lower(coalesce(merchant_name, payee)) — must match lib/recurring.recurringMerchantKey.
const merchantKeyExpr = sql<string>`lower(coalesce(${transactions.merchantName}, ${transactions.payee}))`;
const displayNameExpr = sql<string>`coalesce(${transactions.merchantName}, ${transactions.payee})`;

const RECURRING_WINDOW_MONTHS = 6;
const TRAILING_MONTHS = 3;

const reportLimit = authenticatedRateLimit('insights:report', API_RATE_LIMITS.report);
const mutationLimit = authenticatedRateLimit('insights:mutation', API_RATE_LIMITS.mutation);

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

const app = new Hono<AuthEnv>()
  .get('/recurring', clerkMiddleware(), requireAuth, reportLimit, async (c) => {
    const userId = getUserId(c);
    const now = new Date();
    const windowStart = subMonths(now, RECURRING_WINDOW_MONTHS);

    const rows = await db
      .select({
        merchantKey: merchantKeyExpr,
        displayName: displayNameExpr,
        date: transactions.date,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.pending, false),
          lt(transactions.amount, 0),
          gte(transactions.date, windowStart),
        ),
      );

    const ignored = await db
      .select({ merchantKey: recurringIgnores.merchantKey })
      .from(recurringIgnores)
      .where(eq(recurringIgnores.userId, userId));
    const ignoredSet = new Set(ignored.map((r) => r.merchantKey));

    const detected = detectRecurring(rows as RecurringInput[], { now }).filter(
      (r) => !ignoredSet.has(r.merchantKey),
    );

    const monthlyTotal = detected.reduce((acc, r) => acc + r.monthlyEquivalent, 0);

    return c.json({ data: { recurring: detected, monthlyTotal } });
  })
  .get(
    '/trends',
    clerkMiddleware(),
    requireAuth,
    reportLimit,
    zValidator('query', budgetMonthQuerySchema),
    async (c) => {
      const userId = getUserId(c);
      const { month } = c.req.valid('query');
      const { start, endExclusive } = parseMonth(month);
      const prevStart = subMonths(start, 1);
      // Interpolate ISO strings, not Date objects: a bare Date inside a raw sql``
      // template is passed straight to the driver, which cannot bind it. The
      // drizzle comparison operators below serialize Dates the same way.
      const startIso = start.toISOString();

      const rows = await db
        .select({
          categoryId: categories.id,
          name: categories.name,
          current: sql<number>`SUM(CASE WHEN ${transactions.date} >= ${startIso} THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
          previous: sql<number>`SUM(CASE WHEN ${transactions.date} < ${startIso} THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
        })
        .from(transactions)
        .innerJoin(
          categories,
          and(eq(transactions.categoryId, categories.id), eq(categories.userId, userId)),
        )
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.pending, false),
            lt(transactions.amount, 0),
            gte(transactions.date, prevStart),
            lt(transactions.date, endExclusive),
          ),
        )
        .groupBy(categories.id, categories.name);

      const trends = rows
        .map((r) => ({
          categoryId: r.categoryId,
          name: r.name,
          current: r.current ?? 0,
          previous: r.previous ?? 0,
          change: (r.current ?? 0) - (r.previous ?? 0),
          percentChange: percentChange(r.current ?? 0, r.previous ?? 0),
        }))
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

      return c.json({ data: { trends } });
    },
  )
  .get(
    '/unusual',
    clerkMiddleware(),
    requireAuth,
    reportLimit,
    zValidator('query', budgetMonthQuerySchema),
    async (c) => {
      const userId = getUserId(c);
      const { month } = c.req.valid('query');
      const { start, endExclusive } = parseMonth(month);
      const trailingStart = subMonths(start, TRAILING_MONTHS);
      // ISO strings, not Date objects — see the note in the /trends handler.
      const startIso = start.toISOString();
      const endIso = endExclusive.toISOString();
      const trailingIso = trailingStart.toISOString();

      const rows = await db
        .select({
          categoryId: categories.id,
          name: categories.name,
          current: sql<number>`SUM(CASE WHEN ${transactions.date} >= ${startIso} AND ${transactions.date} < ${endIso} THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
          trailingSum: sql<number>`SUM(CASE WHEN ${transactions.date} >= ${trailingIso} AND ${transactions.date} < ${startIso} THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
        })
        .from(transactions)
        .innerJoin(
          categories,
          and(eq(transactions.categoryId, categories.id), eq(categories.userId, userId)),
        )
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.pending, false),
            lt(transactions.amount, 0),
            gte(transactions.date, trailingStart),
            lt(transactions.date, endExclusive),
          ),
        )
        .groupBy(categories.id, categories.name);

      const unusual = rows
        .map((r) => {
          const current = r.current ?? 0;
          const trailingAvg = (r.trailingSum ?? 0) / TRAILING_MONTHS;
          const verdict = flagUnusual(current, trailingAvg);
          return {
            categoryId: r.categoryId,
            name: r.name,
            current,
            trailingAvg: Math.round(trailingAvg),
            multiple: verdict.multiple,
            isNew: verdict.isNew,
            flagged: verdict.flagged,
          };
        })
        .filter((r) => r.flagged)
        .sort((a, b) => b.current - a.current)
        .map((r) => ({
          categoryId: r.categoryId,
          name: r.name,
          current: r.current,
          trailingAvg: r.trailingAvg,
          multiple: r.multiple,
          isNew: r.isNew,
        }));

      return c.json({ data: { unusual } });
    },
  )
  .post(
    '/recurring/ignore',
    clerkMiddleware(),
    requireAuth,
    mutationLimit,
    zValidator('json', ignoreRecurringSchema),
    async (c) => {
      const userId = getUserId(c);
      const { merchantKey } = c.req.valid('json');

      await db
        .insert(recurringIgnores)
        .values({ id: crypto.randomUUID(), userId, merchantKey })
        .onConflictDoNothing({ target: [recurringIgnores.userId, recurringIgnores.merchantKey] });

      return c.json({ data: { merchantKey } });
    },
  )
  .delete(
    '/recurring/ignore',
    clerkMiddleware(),
    requireAuth,
    mutationLimit,
    zValidator('json', ignoreRecurringSchema),
    async (c) => {
      const userId = getUserId(c);
      const { merchantKey } = c.req.valid('json');

      await db
        .delete(recurringIgnores)
        .where(
          and(eq(recurringIgnores.userId, userId), eq(recurringIgnores.merchantKey, merchantKey)),
        );

      return c.json({ data: { merchantKey } });
    },
  );

export default app;
