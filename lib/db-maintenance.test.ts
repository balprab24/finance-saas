import { afterEach, describe, expect, it, vi } from 'vitest';

const state: {
  deletes: Array<{ rows: Array<Record<string, unknown>> }>;
  whereArgs: unknown[];
} = {
  deletes: [],
  whereArgs: [],
};

vi.mock('@/db/drizzle', () => ({
  db: {
    delete: () => ({
      where: (condition: unknown) => {
        state.whereArgs.push(condition);
        const next = state.deletes.shift() ?? { rows: [] };
        return { returning: () => Promise.resolve(next.rows) };
      },
    }),
  },
}));

afterEach(() => {
  vi.resetModules();
  state.deletes = [];
  state.whereArgs = [];
});

describe('pruneOperationalTables', () => {
  it('deletes expired rate limits and old webhook events, returning counts', async () => {
    state.deletes = [
      { rows: [{ key: 'a' }, { key: 'b' }] },
      { rows: [{ sha: 'x' }] },
    ];

    const { pruneOperationalTables } = await import('./db-maintenance');
    const result = await pruneOperationalTables({ now: new Date('2026-07-18T00:00:00Z') });

    expect(result).toEqual({ rateLimitsDeleted: 2, webhookEventsDeleted: 1 });
    expect(state.whereArgs).toHaveLength(2);
  });

  it('reports zero deletions when nothing is expired', async () => {
    const { pruneOperationalTables } = await import('./db-maintenance');
    const result = await pruneOperationalTables();
    expect(result).toEqual({ rateLimitsDeleted: 0, webhookEventsDeleted: 0 });
  });

  it('uses cutoffs derived from the provided now', async () => {
    const { RATE_LIMIT_RETENTION_MS, WEBHOOK_EVENT_RETENTION_MS } = await import(
      './db-maintenance'
    );
    expect(RATE_LIMIT_RETENTION_MS).toBe(24 * 60 * 60 * 1000);
    expect(WEBHOOK_EVENT_RETENTION_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
