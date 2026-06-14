import { describe, expect, it, vi } from 'vitest';

vi.mock('@/db/drizzle', () => ({
  db: {},
}));

import { checkRateLimit, clientIpFromHeaders } from '@/lib/rate-limit';

function databaseReturning(row: { count: number; resetAt: Date }) {
  const returning = vi.fn().mockResolvedValue([row]);
  const onConflictDoUpdate = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));

  return {
    database: { insert },
    returning,
    onConflictDoUpdate,
    values,
    insert,
  };
}

describe('checkRateLimit', () => {
  it('allows requests while the counter is within the window limit', async () => {
    const resetAt = new Date('2026-01-01T00:01:00Z');
    const fake = databaseReturning({ count: 3, resetAt });

    const result = await checkRateLimit({
      key: 'plaid:link:user_1',
      limit: 5,
      windowMs: 60_000,
      now: new Date('2026-01-01T00:00:30Z'),
      database: fake.database as unknown as Parameters<typeof checkRateLimit>[0]['database'],
    });

    expect(result).toMatchObject({
      allowed: true,
      limit: 5,
      remaining: 2,
      retryAfterSeconds: 30,
      resetAt,
    });
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it('blocks requests over the limit and reports retry timing', async () => {
    const result = await checkRateLimit({
      key: 'plaid:webhook:ip:203.0.113.10',
      limit: 2,
      windowMs: 60_000,
      now: new Date('2026-01-01T00:00:50Z'),
      database: databaseReturning({
        count: 3,
        resetAt: new Date('2026-01-01T00:01:00Z'),
      }).database as unknown as Parameters<typeof checkRateLimit>[0]['database'],
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBe(10);
  });
});

describe('clientIpFromHeaders', () => {
  it('uses the first forwarded IP and falls back to unknown', () => {
    expect(clientIpFromHeaders(new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' }))).toBe(
      '203.0.113.1',
    );
    expect(clientIpFromHeaders(new Headers())).toBe('unknown');
  });
});
