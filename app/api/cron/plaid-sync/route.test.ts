import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const drain = vi.fn();
vi.mock('@/lib/plaid-sync-jobs', () => ({
  drainPlaidSyncJobs: (options: unknown) => drain(options),
}));

const prune = vi.fn();
vi.mock('@/lib/db-maintenance', () => ({
  pruneOperationalTables: () => prune(),
}));

import { GET } from './route';

const ORIGINAL_SECRET = process.env.CRON_SECRET;

function callCron(headers?: Record<string, string>) {
  return GET(new Request('https://aurex.test/api/cron/plaid-sync', { headers }));
}

beforeEach(() => {
  process.env.CRON_SECRET = 'cron-secret-test';
  drain.mockReset();
  drain.mockResolvedValue({ processed: 2, succeeded: 2, failed: 0 });
  prune.mockReset();
  prune.mockResolvedValue({ rateLimitsDeleted: 3, webhookEventsDeleted: 1 });
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe('GET /api/cron/plaid-sync', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await callCron();
    expect(res.status).toBe(401);
    expect(drain).not.toHaveBeenCalled();
  });

  it('rejects a wrong bearer token', async () => {
    const res = await callCron({ authorization: 'Bearer nope' });
    expect(res.status).toBe(401);
    expect(drain).not.toHaveBeenCalled();
  });

  it('fails closed when CRON_SECRET is unset, even with a bearer header', async () => {
    delete process.env.CRON_SECRET;
    const res = await callCron({ authorization: 'Bearer cron-secret-test' });
    expect(res.status).toBe(401);
    expect(drain).not.toHaveBeenCalled();
  });

  it('drains within a budget and returns a summary for a valid token', async () => {
    const res = await callCron({ authorization: 'Bearer cron-secret-test' });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      processed: 2,
      succeeded: 2,
      failed: 0,
    });
    expect(drain).toHaveBeenCalledTimes(1);
    const options = drain.mock.calls[0][0];
    expect(options.maxJobs).toBeGreaterThan(0);
    expect(options.deadline).toBeGreaterThan(Date.now());
  });

  it('returns 500 without leaking details when the drain throws', async () => {
    drain.mockRejectedValue(new Error('boom'));
    const res = await callCron({ authorization: 'Bearer cron-secret-test' });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
    expect(prune).not.toHaveBeenCalled();
  });

  it('prunes operational tables on a successful drain and reports counts', async () => {
    const res = await callCron({ authorization: 'Bearer cron-secret-test' });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      pruned: { rateLimitsDeleted: 3, webhookEventsDeleted: 1 },
    });
    expect(prune).toHaveBeenCalledTimes(1);
  });

  it('keeps the drain response ok when pruning fails', async () => {
    prune.mockRejectedValue(new Error('prune failed'));
    const res = await callCron({ authorization: 'Bearer cron-secret-test' });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, pruned: null });
  });

  it('does not prune on an unauthorized request', async () => {
    const res = await callCron({ authorization: 'Bearer nope' });
    expect(res.status).toBe(401);
    expect(prune).not.toHaveBeenCalled();
  });
});
