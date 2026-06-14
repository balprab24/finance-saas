import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  const passthrough = ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy'];
  for (const m of passthrough) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (resolve) =>
    resolve(state.selectResults.shift() ?? []);

  const db = { select: () => selectChain };
  return { db };
});

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

async function requestSummary(query = '') {
  const { default: app } = await import('./summary');
  const url = `http://localhost/${query ? `?${query}` : ''}`;
  const res = await app.fetch(new Request(url));
  return {
    status: res.status,
    body: (await res.json()) as { data?: Record<string, number>; error?: string },
  };
}

function pushPeriods(current: { income: number; expensesSigned: number; remaining: number }, last: { income: number; expensesSigned: number; remaining: number }) {
  state.selectResults.push([current]);
  state.selectResults.push([last]);
  // category aggregate query
  state.selectResults.push([]);
  // active days query
  state.selectResults.push([]);
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.selectResults = [];
});

afterEach(() => {
  vi.resetModules();
});

describe('GET /summary expense semantics', () => {
  it('returns expensesAmount as an absolute (positive) value', async () => {
    pushPeriods(
      { income: 100_000, expensesSigned: -50_000, remaining: 50_000 },
      { income: 80_000, expensesSigned: -25_000, remaining: 55_000 },
    );

    const { status, body } = await requestSummary();
    expect(status).toBe(200);
    expect(body.data!.expensesAmount).toBe(50_000);
  });

  it('reports a positive expensesChange when spending grows', async () => {
    pushPeriods(
      { income: 100_000, expensesSigned: -50_000, remaining: 50_000 },
      { income: 80_000, expensesSigned: -25_000, remaining: 55_000 },
    );

    const { body } = await requestSummary();
    // |-50000| vs |-25000| → +100%
    expect(body.data!.expensesChange).toBe(100);
  });

  it('reports a negative expensesChange when spending falls', async () => {
    pushPeriods(
      { income: 80_000, expensesSigned: -10_000, remaining: 70_000 },
      { income: 80_000, expensesSigned: -20_000, remaining: 60_000 },
    );

    const { body } = await requestSummary();
    // |-10000| vs |-20000| → -50%
    expect(body.data!.expensesChange).toBe(-50);
  });

  it('returns zero values without crashing when no transactions exist', async () => {
    pushPeriods(
      { income: 0, expensesSigned: 0, remaining: 0 },
      { income: 0, expensesSigned: 0, remaining: 0 },
    );

    const { status, body } = await requestSummary();
    expect(status).toBe(200);
    expect(body.data!.expensesAmount).toBe(0);
    expect(body.data!.expensesChange).toBe(0);
    expect(body.data!.incomeChange).toBe(0);
  });
});

describe('GET /summary input handling', () => {
  it('rejects from > to', async () => {
    const { status } = await requestSummary('from=2026-05-01&to=2026-04-01');
    expect(status).toBe(400);
  });

  it('rejects malformed date strings', async () => {
    const { status } = await requestSummary('from=2026%2F04%2F01');
    expect(status).toBe(400);
  });

  it('requires authentication', async () => {
    state.auth = null;
    const { status, body } = await requestSummary();
    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });
});
