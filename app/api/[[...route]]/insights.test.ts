import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
  insertedValues: unknown[];
  insertCalls: number;
  deleteCalls: number;
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
  insertedValues: [],
  insertCalls: 0,
  deleteCalls: 0,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  const passthrough = ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy', 'limit'];
  for (const m of passthrough) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (resolve) =>
    resolve(state.selectResults.shift() ?? []);

  const insertChain = {
    values: (rows: unknown) => {
      state.insertCalls += 1;
      state.insertedValues.push(rows);
      return { onConflictDoNothing: () => Promise.resolve([]) };
    },
  };

  const db = {
    select: () => selectChain,
    insert: () => insertChain,
    delete: () => ({
      where: () => {
        state.deleteCalls += 1;
        return Promise.resolve([]);
      },
    }),
  };

  return { db };
});

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

vi.mock('@/lib/api-rate-limit', () => ({
  API_RATE_LIMITS: {
    report: { limit: 1, windowMs: 1000 },
    mutation: { limit: 1, windowMs: 1000 },
  },
  authenticatedRateLimit: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

async function request(path: string, init?: RequestInit) {
  const { default: app } = await import('./insights');
  const res = await app.fetch(new Request(`http://localhost${path}`, init));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  // The /recurring fixtures use fixed dates while the route feeds real `new Date()`
  // into detectRecurring's overdue cutoff, so the clock must be pinned or the suite
  // rots as wall time advances. toFake: ['Date'] leaves timers real so app.fetch
  // cannot hang on faked microtasks.
  vi.useFakeTimers({ now: new Date('2026-06-15T12:00:00Z'), toFake: ['Date'] });
  state.auth = { userId: 'user_alice' };
  state.selectResults = [];
  state.insertedValues = [];
  state.insertCalls = 0;
  state.deleteCalls = 0;
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});

describe('insights route — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    state.auth = null;
    const { status } = await request('/recurring');
    expect(status).toBe(401);
  });
});

describe('insights route — recurring', () => {
  it('detects a monthly subscription and excludes ignored merchants', async () => {
    // 1) transaction rows, 2) ignore list
    state.selectResults = [
      [
        { merchantKey: 'netflix', displayName: 'Netflix', date: new Date('2026-03-14'), amount: -15990 },
        { merchantKey: 'netflix', displayName: 'Netflix', date: new Date('2026-04-14'), amount: -15990 },
        { merchantKey: 'netflix', displayName: 'Netflix', date: new Date('2026-05-14'), amount: -15990 },
        { merchantKey: 'gym', displayName: 'Gym', date: new Date('2026-03-01'), amount: -30000 },
        { merchantKey: 'gym', displayName: 'Gym', date: new Date('2026-04-01'), amount: -30000 },
        { merchantKey: 'gym', displayName: 'Gym', date: new Date('2026-05-01'), amount: -30000 },
      ],
      [{ merchantKey: 'gym' }], // gym is ignored
    ];

    const { status, body } = await request('/recurring');
    expect(status).toBe(200);
    const data = body.data as { recurring: Array<{ merchantKey: string }>; monthlyTotal: number };
    const keys = data.recurring.map((r) => r.merchantKey);
    expect(keys).toContain('netflix');
    expect(keys).not.toContain('gym');
    expect(data.monthlyTotal).toBe(15990);
  });
});

describe('insights route — trends', () => {
  it('returns category movers sorted by absolute change', async () => {
    state.selectResults = [
      [
        { categoryId: 'c1', name: 'Dining', current: 80000, previous: 50000 },
        { categoryId: 'c2', name: 'Travel', current: 0, previous: 100000 },
        { categoryId: 'c3', name: 'Misc', current: 12000, previous: 10000 },
      ],
    ];

    const { status, body } = await request('/trends?month=2026-06');
    expect(status).toBe(200);
    const trends = (body.data as { trends: Array<{ name: string; change: number }> }).trends;
    // Travel (-100000) is the biggest absolute mover, then Dining (+30000)
    expect(trends[0].name).toBe('Travel');
    expect(trends[0].change).toBe(-100000);
    expect(trends[1].name).toBe('Dining');
  });
});

describe('insights route — unusual', () => {
  it('flags only categories that spike past the trailing average', async () => {
    state.selectResults = [
      [
        // current 120000 vs trailing avg 30000 (90000/3) → spike
        { categoryId: 'c1', name: 'Shopping', current: 120000, trailingSum: 90000 },
        // current 51000 vs avg 50000 → normal
        { categoryId: 'c2', name: 'Groceries', current: 51000, trailingSum: 150000 },
        // brand new
        { categoryId: 'c3', name: 'Pets', current: 60000, trailingSum: 0 },
      ],
    ];

    const { status, body } = await request('/unusual?month=2026-06');
    expect(status).toBe(200);
    const unusual = (body.data as {
      unusual: Array<{ name: string; isNew: boolean }>;
    }).unusual;
    const names = unusual.map((u) => u.name);
    expect(names).toContain('Shopping');
    expect(names).toContain('Pets');
    expect(names).not.toContain('Groceries');
    expect(unusual.find((u) => u.name === 'Pets')!.isNew).toBe(true);
  });
});

describe('insights route — ignore', () => {
  it('validates the merchant key and upserts with onConflictDoNothing', async () => {
    const { status } = await request('/recurring/ignore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ merchantKey: 'netflix' }),
    });
    expect(status).toBe(200);
    expect(state.insertCalls).toBe(1);
    expect(state.insertedValues.at(0)).toMatchObject({ merchantKey: 'netflix', userId: 'user_alice' });
  });

  it('rejects an empty merchant key with 400', async () => {
    const { status, body } = await request('/recurring/ignore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ merchantKey: '   ' }),
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(state.insertCalls).toBe(0);
  });

  it('stamps the calling user on an ignore (per-tenant scoping)', async () => {
    state.auth = { userId: 'user_bob' };
    const { status } = await request('/recurring/ignore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ merchantKey: 'netflix' }),
    });
    expect(status).toBe(200);
    // The ignore is written under the caller's id, so one user's ignore list can
    // never mask another user's recurring detection.
    expect(state.insertedValues.at(0)).toMatchObject({ merchantKey: 'netflix', userId: 'user_bob' });
  });

  it('deletes an ignore on DELETE', async () => {
    const { status } = await request('/recurring/ignore', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ merchantKey: 'netflix' }),
    });
    expect(status).toBe(200);
    expect(state.deleteCalls).toBe(1);
  });
});
