import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { plaidItems, plaidSyncJobs } from '@/db/schema';
import { getPlaidErrorDetails, syncPlaidItemForUser } from '@/lib/plaid-sync';

export type PlaidSyncJobReason = 'manual' | 'webhook' | 'reconnect';
export type PlaidSyncJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

type PlaidSyncJob = typeof plaidSyncJobs.$inferSelect;

let workerPromise: Promise<void> | null = null;

function errorSummary(err: unknown) {
  const { errorCode, errorMessage } = getPlaidErrorDetails(err);
  return [errorCode, errorMessage].filter(Boolean).join(': ').slice(0, 500) || 'Sync failed';
}

function serializeJob(job: Pick<PlaidSyncJob, 'id' | 'itemId' | 'status' | 'reason'>) {
  return {
    jobId: job.id,
    itemId: job.itemId,
    status: job.status as PlaidSyncJobStatus,
    reason: job.reason as PlaidSyncJobReason,
  };
}

export async function enqueuePlaidSyncJob({
  itemId,
  userId,
  reason,
}: {
  itemId: string;
  userId: string;
  reason: PlaidSyncJobReason;
}) {
  const now = new Date();
  const [job] = await db
    .insert(plaidSyncJobs)
    .values({
      id: crypto.randomUUID(),
      itemId,
      userId,
      reason,
      status: 'queued',
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [plaidSyncJobs.userId, plaidSyncJobs.itemId],
      targetWhere: sql`${plaidSyncJobs.status} in ('queued', 'running')`,
      set: {
        reason,
        updatedAt: now,
        lastError: null,
      },
    })
    .returning({
      id: plaidSyncJobs.id,
      itemId: plaidSyncJobs.itemId,
      status: plaidSyncJobs.status,
      reason: plaidSyncJobs.reason,
    });

  return serializeJob(job);
}

export async function enqueuePlaidSyncJobByPlaidItemId({
  plaidItemId,
  reason,
}: {
  plaidItemId: string;
  reason: PlaidSyncJobReason;
}) {
  const [item] = await db
    .select({
      id: plaidItems.id,
      userId: plaidItems.userId,
      status: plaidItems.status,
    })
    .from(plaidItems)
    .where(eq(plaidItems.plaidItemId, plaidItemId));

  if (!item || item.status === 'removed') return null;

  const now = new Date();
  await db
    .update(plaidItems)
    .set({ lastWebhookAt: now, updatedAt: now })
    .where(eq(plaidItems.id, item.id));

  return await enqueuePlaidSyncJob({ itemId: item.id, userId: item.userId, reason });
}

async function claimNextQueuedJob() {
  return await db.transaction(async (tx) => {
    const [candidate] = await tx
      .select()
      .from(plaidSyncJobs)
      .where(eq(plaidSyncJobs.status, 'queued'))
      .orderBy(asc(plaidSyncJobs.createdAt))
      .limit(1);

    if (!candidate) return null;

    const now = new Date();
    const [claimed] = await tx
      .update(plaidSyncJobs)
      .set({
        status: 'running',
        attempts: candidate.attempts + 1,
        startedAt: now,
        finishedAt: null,
        updatedAt: now,
      })
      .where(and(eq(plaidSyncJobs.id, candidate.id), eq(plaidSyncJobs.status, 'queued')))
      .returning();

    return claimed ?? null;
  });
}

async function requeueIfRequestedDuringRun(job: PlaidSyncJob) {
  if (!job.startedAt) return false;

  const [current] = await db
    .select({ updatedAt: plaidSyncJobs.updatedAt })
    .from(plaidSyncJobs)
    .where(eq(plaidSyncJobs.id, job.id));

  if (!current || current.updatedAt <= job.startedAt) return false;

  await db
    .update(plaidSyncJobs)
    .set({
      status: 'queued',
      startedAt: null,
      finishedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(plaidSyncJobs.id, job.id));

  return true;
}

export async function drainPlaidSyncJobs(limit = 10) {
  let processed = 0;

  while (processed < limit) {
    const job = await claimNextQueuedJob();
    if (!job) break;
    processed += 1;

    try {
      await syncPlaidItemForUser(job.itemId, job.userId);
      if (await requeueIfRequestedDuringRun(job)) continue;

      await db
        .update(plaidSyncJobs)
        .set({
          status: 'succeeded',
          lastError: null,
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(plaidSyncJobs.id, job.id));
    } catch (err) {
      await db
        .update(plaidSyncJobs)
        .set({
          status: 'failed',
          lastError: errorSummary(err),
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(plaidSyncJobs.id, job.id));
    }
  }

  return { processed };
}

export function kickPlaidSyncWorker() {
  if (!workerPromise) {
    workerPromise = drainPlaidSyncJobs()
      .then(() => undefined)
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[plaid sync worker]', err);
        }
      })
      .finally(() => {
        workerPromise = null;
      });
  }

  return workerPromise;
}
