import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clerkMiddleware } from '@clerk/hono';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { categories } from '@/db/schema';
import {
  bulkIdsSchema,
  createCategorySchema,
  idParamSchema,
  updateCategorySchema,
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
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.userId, userId));

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
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.id, id)));

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  )
  .post(
    '/',
    clerkMiddleware(),
    requireAuth,
    zValidator('json', createCategorySchema),
    async (c) => {
      const userId = getUserId(c);
      const values = c.req.valid('json');

      try {
        const [data] = await db
          .insert(categories)
          .values({ id: crypto.randomUUID(), userId, ...values })
          .returning();

        return c.json({ data });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return jsonError(c, 409, 'A category with that name already exists');
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
        .delete(categories)
        .where(and(eq(categories.userId, userId), inArray(categories.id, values.ids)))
        .returning({ id: categories.id });

      return c.json({ data });
    },
  )
  .patch(
    '/:id',
    clerkMiddleware(),
    requireAuth,
    zValidator('param', idParamSchema),
    zValidator('json', updateCategorySchema),
    async (c) => {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      if (!id) return jsonError(c, 400, 'Missing id');
      const values = c.req.valid('json');

      try {
        const [data] = await db
          .update(categories)
          .set(values)
          .where(and(eq(categories.userId, userId), eq(categories.id, id)))
          .returning();

        if (!data) return jsonError(c, 404, 'Not found');
        return c.json({ data });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return jsonError(c, 409, 'A category with that name already exists');
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
        .delete(categories)
        .where(and(eq(categories.userId, userId), eq(categories.id, id)))
        .returning({ id: categories.id });

      if (!data) return jsonError(c, 404, 'Not found');
      return c.json({ data });
    },
  );

export default app;
