import { afterEach, describe, expect, it, vi } from 'vitest';

// Capture plaid_sync_jobs writes without a real database.
const state: { updates: { values: Record<string, unknown> }[] } = { updates: [] };

vi.mock('@/db/drizzle', () => ({
  db: {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        state.updates.push({ values });
        return { where: () => Promise.resolve([]) };
      },
    }),
  },
}));

vi.mock('@/lib/server-crypto', () => ({
  encryptSecret: (value: string) => value,
  decryptSecret: (value: string) => value,
}));

const reportTerminal = vi.fn();
vi.mock('@/lib/plaid-sync-observability', () => ({
  reportPlaidSyncJobTerminal: (event: unknown) => reportTerminal(event),
}));

import { backoffMs, handleJobFailure } from '@/lib/plaid-sync-jobs';

type JobRow = Parameters<typeof handleJobFailure>[0];

function job(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: 'job_1',
    userId: 'user_alice',
    itemId: 'item_1',
    reason: 'manual',
    status: 'running',
    attempts: 1,
    maxAttempts: 5,
    nextAttemptAt: new Date('2026-01-01'),
    lastError: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    startedAt: new Date('2026-01-01'),
    finishedAt: null,
    ...overrides,
  } as JobRow;
}

const transientErr = {
  response: { status: 503, data: { error_code: 'INTERNAL_SERVER_ERROR', error_message: 'down' } },
};
const permanentErr = {
  response: { status: 400, data: { error_code: 'ITEM_LOGIN_REQUIRED', error_message: 'relogin' } },
};

afterEach(() => {
  state.updates = [];
  vi.clearAllMocks();
});

describe('backoffMs', () => {
  it('grows exponentially within bounds and caps at 1h', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0); // no jitter
    expect(backoffMs(1)).toBe(30_000);
    expect(backoffMs(2)).toBe(60_000);
    expect(backoffMs(3)).toBe(120_000);
    expect(backoffMs(20)).toBe(60 * 60_000); // capped
    random.mockRestore();
  });

  it('adds bounded jitter (never below base, never beyond base*2)', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const value = backoffMs(1);
    expect(value).toBeGreaterThanOrEqual(30_000);
    expect(value).toBeLessThanOrEqual(60_000);
    random.mockRestore();
  });
});

describe('handleJobFailure', () => {
  it('requeues a transient failure behind a backoff delay and stays non-terminal', async () => {
    const before = Date.now();
    await handleJobFailure(job({ attempts: 1, maxAttempts: 5 }), transientErr);

    expect(state.updates).toHaveLength(1);
    const update = state.updates[0].values;
    expect(update.status).toBe('queued');
    expect(update.startedAt).toBeNull();
    expect(update.nextAttemptAt).toBeInstanceOf(Date);
    expect((update.nextAttemptAt as Date).getTime()).toBeGreaterThan(before);
    expect(reportTerminal).not.toHaveBeenCalled();
  });

  it('fails a transient job once attempts are exhausted, leaving the item alone', async () => {
    await handleJobFailure(job({ attempts: 5, maxAttempts: 5 }), transientErr);

    // Only the job row is touched — no plaid_items write (item stays active).
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0].values.status).toBe('failed');
    expect(reportTerminal).toHaveBeenCalledTimes(1);
  });

  it('fails a permanent failure immediately and reports it as an item error', async () => {
    await handleJobFailure(job({ attempts: 1, maxAttempts: 5 }), permanentErr);

    expect(state.updates).toHaveLength(1);
    expect(state.updates[0].values.status).toBe('failed');
    expect(reportTerminal).toHaveBeenCalledTimes(1);
    expect(reportTerminal.mock.calls[0][0].failure).toMatchObject({
      class: 'permanent',
      isItemError: true,
      errorCode: 'ITEM_LOGIN_REQUIRED',
    });
  });
});
