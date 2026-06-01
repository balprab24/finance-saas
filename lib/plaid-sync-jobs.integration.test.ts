import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

// Real-Postgres integration tests for the queue's SQL-level guarantees that a JS
// mock cannot model: FOR UPDATE SKIP LOCKED, stale-running reclaim, next_attempt_at
// due-gating, and the partial unique index. Skipped unless DATABASE_URL is set
// (CI sets it and runs migrations first). Modules are imported dynamically so the
// default `npm test` run — which has no DATABASE_URL — never loads db/drizzle.
const HAS_DB = Boolean(process.env.DATABASE_URL);

type Db = (typeof import('@/db/drizzle'))['db'];
type Schema = typeof import('@/db/schema');
type Jobs = typeof import('@/lib/plaid-sync-jobs');

describe.skipIf(!HAS_DB)('plaid sync queue (integration)', () => {
  const userId = `itest_user_${crypto.randomUUID()}`;
  let db: Db;
  let schema: Schema;
  let jobs: Jobs;

  beforeAll(async () => {
    db = (await import('@/db/drizzle')).db;
    schema = await import('@/db/schema');
    jobs = await import('@/lib/plaid-sync-jobs');
  });

  // Deleting the items cascades to their jobs, so each test starts from a clean
  // slate for this synthetic user (claimNextDueJob is global, so isolation matters).
  afterEach(async () => {
    await db.delete(schema.plaidItems).where(eq(schema.plaidItems.userId, userId));
  });

  afterAll(async () => {
    await db.delete(schema.plaidItems).where(eq(schema.plaidItems.userId, userId));
  });

  async function createItem() {
    const id = crypto.randomUUID();
    await db.insert(schema.plaidItems).values({
      id,
      userId,
      plaidItemId: `plaid_${id}`,
      accessToken: 'enc:test',
      status: 'active',
    });
    return id;
  }

  async function insertJob(
    itemId: string,
    overrides: Partial<typeof schema.plaidSyncJobs.$inferInsert> = {},
  ) {
    const id = crypto.randomUUID();
    await db.insert(schema.plaidSyncJobs).values({
      id,
      userId,
      itemId,
      reason: 'manual',
      status: 'queued',
      updatedAt: new Date(),
      ...overrides,
    });
    return id;
  }

  it('claims a due job exactly once under concurrency (FOR UPDATE SKIP LOCKED)', async () => {
    const itemId = await createItem();
    await insertJob(itemId, { status: 'queued', nextAttemptAt: new Date(Date.now() - 1_000) });

    const [a, b] = await Promise.all([jobs.claimNextDueJob(), jobs.claimNextDueJob()]);
    const claimed = [a, b].filter(Boolean);

    expect(claimed).toHaveLength(1);
    expect(claimed[0]!.status).toBe('running');
    expect(claimed[0]!.attempts).toBe(1);
  });

  it('reclaims a stale running job but leaves a fresh running job alone', async () => {
    const staleItem = await createItem();
    await insertJob(staleItem, {
      status: 'running',
      startedAt: new Date(Date.now() - 6 * 60_000),
      nextAttemptAt: new Date(Date.now() - 6 * 60_000),
    });
    const freshItem = await createItem();
    await insertJob(freshItem, {
      status: 'running',
      startedAt: new Date(Date.now() - 60_000),
      nextAttemptAt: new Date(Date.now() - 60_000),
    });

    const first = await jobs.claimNextDueJob();
    const second = await jobs.claimNextDueJob();

    expect(first?.itemId).toBe(staleItem);
    expect(second).toBeNull(); // the fresh running job is not reclaimable
  });

  it('does not claim a job whose next_attempt_at is in the future', async () => {
    const itemId = await createItem();
    const jobId = await insertJob(itemId, {
      status: 'queued',
      nextAttemptAt: new Date(Date.now() + 10 * 60_000),
    });

    expect(await jobs.claimNextDueJob()).toBeNull();

    await db
      .update(schema.plaidSyncJobs)
      .set({ nextAttemptAt: new Date(Date.now() - 1_000) })
      .where(eq(schema.plaidSyncJobs.id, jobId));

    expect((await jobs.claimNextDueJob())?.id).toBe(jobId);
  });

  it('coalesces a re-enqueue onto an active job (incl. a queued retry) instead of duplicating', async () => {
    const itemId = await createItem();
    await jobs.enqueuePlaidSyncJob({ itemId, userId, reason: 'manual' });

    // Simulate a transient retry: still queued, but parked behind a backoff delay.
    await db
      .update(schema.plaidSyncJobs)
      .set({ nextAttemptAt: new Date(Date.now() + 5 * 60_000) })
      .where(eq(schema.plaidSyncJobs.itemId, itemId));

    // A new webhook enqueue must coalesce onto the existing row (no 23505 from the
    // partial unique index), updating its reason rather than creating a duplicate.
    await jobs.enqueuePlaidSyncJob({ itemId, userId, reason: 'webhook' });

    const rows = await db
      .select()
      .from(schema.plaidSyncJobs)
      .where(eq(schema.plaidSyncJobs.itemId, itemId));

    expect(rows).toHaveLength(1);
    expect(rows[0].reason).toBe('webhook');
  });
});
