import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { accounts } from '@/db/schema';
import {
  bulkIdsSchema,
  createAccountSchema,
  idParamSchema,
  updateAccountSchema,
} from '@/lib/api-schemas';
import {
  AuthEnv,
  getUserId,
  isUniqueViolation,
  jsonError,
  requireAuth,
} from '@/lib/api-helpers';

const app = new Hono<AuthEnv>()
  .get('/', clerkMiddleware(), requireAuth, async (c) => {
    const userId = getUserId(c);

    const data = await db
      .select({ id: accounts.id, name: accounts.name })
      .from(accounts)
      .where(eq(accounts.userId, userId));

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
        .select({ id: accounts.id, name: accounts.name })
        .from(accounts)
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
    '/bulk-delete',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', bulkIdsSchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

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
        .delete(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
        .returning({ id: accounts.id });

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  );

export default app;
