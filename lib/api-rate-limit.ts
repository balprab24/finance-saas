import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { AuthEnv } from '@/lib/api-helpers';
import { jsonError } from '@/lib/api-helpers';
import { checkRateLimit, type RateLimitResult } from '@/lib/rate-limit';

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export const API_RATE_LIMITS = {
  read: { limit: 180, windowMs: 60_000 },
  report: { limit: 60, windowMs: 60_000 },
  mutation: { limit: 60, windowMs: 60_000 },
  bulkMutation: { limit: 12, windowMs: 60_000 },
  demoSeed: { limit: 3, windowMs: 5 * 60_000 },
} satisfies Record<string, RateLimitConfig>;

function safeBucket(bucket: string) {
  return bucket.replace(/[^a-zA-Z0-9:._-]/g, '_');
}

export function rateLimitedResponse(c: Context, result: RateLimitResult) {
  c.header('Retry-After', String(result.retryAfterSeconds));
  c.header('X-RateLimit-Limit', String(result.limit));
  c.header('X-RateLimit-Remaining', String(result.remaining));
  c.header('X-RateLimit-Reset', result.resetAt.toISOString());
  return jsonError(c, 429, 'Too many requests');
}

export async function enforceRateLimit(
  c: Context,
  key: string,
  config: RateLimitConfig,
) {
  const result = await checkRateLimit({ key, ...config });
  if (!result.allowed) return rateLimitedResponse(c, result);

  c.header('X-RateLimit-Limit', String(result.limit));
  c.header('X-RateLimit-Remaining', String(result.remaining));
  c.header('X-RateLimit-Reset', result.resetAt.toISOString());
  return null;
}

export async function enforceAuthenticatedRateLimit(
  c: Context<AuthEnv>,
  bucket: string,
  config: RateLimitConfig,
) {
  return await enforceRateLimit(
    c,
    `api:${safeBucket(bucket)}:user:${c.get('userId')}`,
    config,
  );
}

export function authenticatedRateLimit(bucket: string, config: RateLimitConfig) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const response = await enforceAuthenticatedRateLimit(c, bucket, config);
    if (response) return response;
    await next();
  });
}
