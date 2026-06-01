import { sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { rateLimits } from '@/db/schema';

type RateLimitDatabase = Pick<typeof db, 'insert'>;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

export async function checkRateLimit({
  key,
  limit,
  windowMs,
  now = new Date(),
  database = db,
}: {
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
  database?: RateLimitDatabase;
}): Promise<RateLimitResult> {
  if (limit < 1) throw new Error('Rate limit must be at least 1');
  if (windowMs < 1000) throw new Error('Rate limit window must be at least 1 second');

  const resetAt = new Date(now.getTime() + windowMs);
  const nowSql = now.toISOString();
  const resetAtSql = resetAt.toISOString();
  const [row] = await database
    .insert(rateLimits)
    .values({
      key,
      count: 1,
      resetAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql<number>`case when ${rateLimits.resetAt} <= ${nowSql}::timestamp then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql<Date>`case when ${rateLimits.resetAt} <= ${nowSql}::timestamp then ${resetAtSql}::timestamp else ${rateLimits.resetAt} end`,
        updatedAt: now,
      },
    })
    .returning({
      count: rateLimits.count,
      resetAt: rateLimits.resetAt,
    });

  if (!row) throw new Error('Rate limit check did not return a row');

  return {
    allowed: row.count <= limit,
    limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

export function clientIpFromHeaders(headers: Headers) {
  return (
    headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}
