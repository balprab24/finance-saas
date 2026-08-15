import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
  insertedValues: unknown[];
  insertCalls: number;
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
  insertedValues: [],
  insertCalls: 0,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  const passthrough = ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy'];
  for (const m of passthrough) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (resolve) =>
    resolve(state.selectResults.shift() ?? []);

  const insertChain = {
    values: (rows: unknown) => {
      state.insertCalls += 1;
      state.insertedValues.push(rows);
      return {
        onConflictDoUpdate: () => ({
          returning: () => Promise.resolve([rows]),
        }),
      };
    },
  };

  const db = {
    select: () => selectChain,
    insert: () => insertChain,
    delete: () => ({
      where: () => ({ returning: () => Promise.resolve(state.selectResults.shift() ?? []) }),
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
  const { default: app } = await import('./budgets');
  const res = await app.fetch(new Request(`http://localhost${path}`, init));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.selectResults = [];
  state.insertedValues = [];
  state.insertCalls = 0;
});

afterEach(() => {
  vi.resetModules();
});

describe('budgets route — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    state.auth = null;
    const { status, body } = await request('/?month=2026-06');
    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('rejects a malformed month query with 400', async () => {
    const { status, body } = await request('/?month=2026-6');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('rejects a non-positive budget amount with 400', async () => {
    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ categoryId: 'cat_1', month: '2026-06', amount: 0 }),
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(state.insertCalls).toBe(0);
  });
});

describe('budgets route — GET merges spend into rows', () => {
  it('computes remaining and over/under status per category', async () => {
    // 1) categories, 2) month budgets, 3) spend grouped by category
    state.selectResults = [
      [
        { id: 'cat_food', name: 'Food' },
        { id: 'cat_rent', name: 'Rent' },
        { id: 'cat_fun', name: 'Fun' },
      ],
      [
        { categoryId: 'cat_food', amount: 50000, id: 'b_food' },
        { categoryId: 'cat_rent', amount: 100000, id: 'b_rent' },
      ],
      [
        { categoryId: 'cat_food', spent: 65000 },
        { categoryId: 'cat_rent', spent: 90000 },
        { categoryId: 'cat_fun', spent: 12000 },
      ],
    ];

    const { status, body } = await request('/?month=2026-06');
    expect(status).toBe(200);

    const data = body.data as {
      month: string;
      totalBudgeted: number;
      totalSpent: number;
      totalRemaining: number;
      categories: Array<{
        categoryId: string;
        budgeted: number | null;
        spent: number;
        remaining: number | null;
        status: string;
      }>;
    };

    expect(data.month).toBe('2026-06-01');

    const food = data.categories.find((r) => r.categoryId === 'cat_food')!;
    expect(food.budgeted).toBe(50000);
    expect(food.spent).toBe(65000);
    expect(food.remaining).toBe(-15000);
    expect(food.status).toBe('over');

    const rent = data.categories.find((r) => r.categoryId === 'cat_rent')!;
    expect(rent.remaining).toBe(10000);
    expect(rent.status).toBe('under');

    // Category with no budget set: spend tracked but status 'none', excluded from totals.
    const fun = data.categories.find((r) => r.categoryId === 'cat_fun')!;
    expect(fun.budgeted).toBeNull();
    expect(fun.remaining).toBeNull();
    expect(fun.status).toBe('none');

    expect(data.totalBudgeted).toBe(150000);
    expect(data.totalSpent).toBe(155000); // 65000 + 90000 (fun excluded)
    expect(data.totalRemaining).toBe(-5000);
  });
});

describe('budgets route — POST upsert', () => {
  it('rejects a category the user does not own without writing', async () => {
    state.selectResults = [[]]; // ownership lookup returns no row
    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ categoryId: 'cat_bob', month: '2026-06', amount: 50000 }),
    });
    expect(status).toBe(400);
    expect(body.error).toBe('Invalid category');
    expect(state.insertCalls).toBe(0);
  });

  it('upserts a normalized month key for an owned category', async () => {
    state.selectResults = [[{ id: 'cat_food' }]]; // ownership lookup succeeds
    const { status } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ categoryId: 'cat_food', month: '2026-06', amount: 50000 }),
    });
    expect(status).toBe(200);
    expect(state.insertedValues.at(0)).toMatchObject({
      categoryId: 'cat_food',
      userId: 'user_alice',
      month: '2026-06-01',
      amount: 50000,
    });
  });
});

describe('budgets route — DELETE', () => {
  it('returns 404 when clearing a non-existent budget', async () => {
    state.selectResults = [[]]; // delete returning nothing
    const { status, body } = await request('/b_missing', { method: 'DELETE' });
    expect(status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('cannot clear another tenant budget (scoped delete matches nothing → 404)', async () => {
    // The DELETE is scoped by userId, so a budget id owned by another user never
    // matches for this caller — it 404s instead of deleting a foreign row.
    state.selectResults = [[]];
    const { status, body } = await request('/b_owned_by_bob', { method: 'DELETE' });
    expect(status).toBe(404);
    expect(body.error).toBe('Not found');
  });
});
