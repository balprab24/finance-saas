import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  insertedValues: unknown[];
  insertShouldThrow: Error | null;
  updatedReturning: unknown[];
  deletedReturning: unknown[];
} = {
  auth: { userId: 'user_alice' },
  insertedValues: [],
  insertShouldThrow: null,
  updatedReturning: [{ id: 'cat_1', name: 'X', userId: 'user_alice' }],
  deletedReturning: [{ id: 'cat_1' }],
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const m of ['from', 'where']) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (resolve) =>
    resolve([]);

  const insertChain = {
    values: (rows: unknown) => {
      state.insertedValues.push(rows);
      return {
        returning: () => {
          if (state.insertShouldThrow) throw state.insertShouldThrow;
          return Promise.resolve([rows]);
        },
      };
    },
  };

  const db = {
    select: () => selectChain,
    insert: () => insertChain,
    update: () => ({
      set: () => ({ where: () => ({ returning: () => Promise.resolve(state.updatedReturning) }) }),
    }),
    delete: () => ({
      where: () => ({ returning: () => Promise.resolve(state.deletedReturning) }),
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
    read: { limit: 1, windowMs: 1000 },
    mutation: { limit: 1, windowMs: 1000 },
    bulkMutation: { limit: 1, windowMs: 1000 },
  },
  authenticatedRateLimit: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

async function request(path: string, init?: RequestInit) {
  const { default: app } = await import('./categories');
  const res = await app.fetch(new Request(`http://localhost${path}`, init));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.insertedValues = [];
  state.insertShouldThrow = null;
  state.updatedReturning = [{ id: 'cat_1', name: 'X', userId: 'user_alice' }];
  state.deletedReturning = [{ id: 'cat_1' }];
});

afterEach(() => {
  vi.resetModules();
});

describe('categories route — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    state.auth = null;
    const { status, body } = await request('/');
    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('trims category names server-side', async () => {
    const { status } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   Dining   ' }),
    });

    expect(status).toBe(200);
    expect(state.insertedValues.at(0)).toMatchObject({
      name: 'Dining',
      userId: 'user_alice',
    });
  });

  it('rejects whitespace-only names with 400', async () => {
    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    });

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('surfaces case-insensitive collisions as the same 409', async () => {
    state.insertShouldThrow = Object.assign(new Error('duplicate'), { code: '23505' });

    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'groceries' }),
    });

    expect(status).toBe(409);
    expect(body.error).toBe('A category with that name already exists');
  });
});

// The userId-scoped where clause means another tenant's id behaves exactly like
// a missing row: the contract is 404, never data or a 500.
describe('cross-tenant :id access returns 404', () => {
  it('GET /:id for a category the caller does not own', async () => {
    const { status, body } = await request('/cat_owned_by_bob');
    expect(status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('PATCH /:id for a category the caller does not own', async () => {
    state.updatedReturning = []; // scoped update matches no row
    const { status, body } = await request('/cat_owned_by_bob', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Hijacked' }),
    });
    expect(status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('DELETE /:id for a category the caller does not own', async () => {
    state.deletedReturning = []; // scoped delete matches no row
    const { status, body } = await request('/cat_owned_by_bob', { method: 'DELETE' });
    expect(status).toBe(404);
    expect(body.error).toBe('Not found');
  });
});
