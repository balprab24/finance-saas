import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { getAuth } from '@clerk/hono';

export type AuthEnv = { Variables: { userId: string } };

// createMiddleware preserves the response type so route-level
// InferResponseType<..., 200> still works on every endpoint.
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', auth.userId);
  await next();
});

export function getUserId(c: Context<AuthEnv>): string {
  return c.get('userId');
}

// Generic over the status code so Hono's typed RPC keeps the literal status
// (callers do `jsonError(c, 404, ...)` and the response type narrows to 404).
export function jsonError<S extends ContentfulStatusCode>(
  c: Context,
  status: S,
  message: string,
  details?: unknown,
) {
  return c.json(
    details === undefined ? { error: message } : { error: message, details },
    status,
  );
}

export function isUniqueViolation(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === '23505',
  );
}
