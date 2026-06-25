import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const blockedResult = {
  allowed: false,
  limit: 1,
  remaining: 0,
  resetAt: new Date('2026-01-01T00:01:00Z'),
  retryAfterSeconds: 42,
};

const state: {
  auth: { userId: string } | null;
  rateLimitCalls: Array<{ key: string }>;
  selectCalls: number;
  insertCalls: number;
} = {
  auth: { userId: 'user_alice' },
  rateLimitCalls: [],
  selectCalls: 0,
  insertCalls: 0,
};

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (values: { key: string }) => {
    state.rateLimitCalls.push(values);
    return Promise.resolve(blockedResult);
  },
  clientIpFromHeaders: () => '203.0.113.10',
}));

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const method of ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy']) {
    selectChain[method] = () => selectChain;
  }
  (selectChain as { then: (resolve: (value: unknown[]) => void) => void }).then = (
    resolve,
  ) => resolve([]);

  const writeChain = {
    values: () => ({
      returning: () => Promise.resolve([]),
      onConflictDoUpdate: () => ({ returning: () => Promise.resolve([]) }),
    }),
  };

  return {
    db: {
      select: () => {
        state.selectCalls += 1;
        return selectChain;
      },
      insert: () => {
        state.insertCalls += 1;
        return writeChain;
      },
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    },
  };
});

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.rateLimitCalls = [];
  state.selectCalls = 0;
  state.insertCalls = 0;
});

afterEach(() => {
  vi.resetModules();
});

describe('authenticated API rate limits', () => {
  it('blocks a CRUD mutation before account writes run', async () => {
    const { default: app } = await import('./accounts');
    const response = await app.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Checking' }),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('42');
    expect(await response.json()).toEqual({ error: 'Too many requests' });
    expect(state.rateLimitCalls.at(0)?.key).toBe('api:accounts:mutation:user:user_alice');
    expect(state.insertCalls).toBe(0);
  });

  it('blocks bulk transaction imports before ownership checks or inserts run', async () => {
    const { default: app } = await import('./transactions');
    const response = await app.fetch(
      new Request('http://localhost/bulk-create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([
          {
            amount: -1299,
            payee: 'Coffee',
            notes: null,
            date: '2026-06-01T12:00:00.000Z',
            accountId: 'acct_1',
            categoryId: null,
          },
        ]),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('x-ratelimit-limit')).toBe('1');
    expect(state.rateLimitCalls.at(0)?.key).toBe('api:transactions:bulk:user:user_alice');
    expect(state.selectCalls).toBe(0);
    expect(state.insertCalls).toBe(0);
  });

  it('blocks report queries before summary aggregation runs', async () => {
    const { default: app } = await import('./summary');
    const response = await app.fetch(new Request('http://localhost/'));

    expect(response.status).toBe(429);
    expect(response.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(state.rateLimitCalls.at(0)?.key).toBe('api:summary:report:user:user_alice');
    expect(state.selectCalls).toBe(0);
  });
});
