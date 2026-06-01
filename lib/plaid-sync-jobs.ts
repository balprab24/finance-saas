import * as Sentry from '@sentry/nextjs';
import { and, asc, eq, lte, or, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { plaidItems, plaidSyncJobs } from '@/db/schema';
import { getPlaidErrorDetails, syncPlaidItemForUser } from '@/lib/plaid-sync';
import { classifyPlaidFailure } from '@/lib/plaid-error-classification';
import {
  reportPlaidSyncJobTerminal,
  reportPlaidSyncWorkerFailure,
} from '@/lib/plaid-sync-observability';

export type PlaidSyncJobReason = 'manual' | 'webhook' | 'reconnect';
export type PlaidSyncJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

type PlaidSyncJob = typeof plaidSyncJobs.$inferSelect;

let workerPromise: Promise<void> | null = null;

function errorSummary(err: unknown) {
  const { errorCode, errorMessage } = getPlaidErrorDetails(err);
  return [errorCode, errorMessage].filter(Boolean).join(': ').slice(0, 500) || 'Sync failed';
}

// A 'running' job older than this is presumed dead (its worker crashed) and is
// reclaimable. Must exceed the worst-case real sync; the per-item advisory lock
// in syncPlaidItem is the backstop against double-processing a merely-slow job.
const STALE_MS = 5 * 60_000;
const DEFAULT_MAX_JOBS = 10;
const BASE_BACKOFF_MS = 30_000; // first retry waits ~30s
const MAX_BACKOFF_MS = 60 * 60_000; // capped at 1h

// Exponential backoff with jitter. `attempts` is the count after the failed run
// (>= 1): attempt 1 -> ~30s, 2 -> ~1m, 3 -> ~2m, 4 -> ~4m, 5 -> ~8m, then capped.
// Exported for unit tests.
export function backoffMs(attempts: number) {
  const exp = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** (attempts - 1));
  const jitter = Math.floor(Math.random() * Math.min(exp, BASE_BACKOFF_MS));
  return Math.min(MAX_BACKOFF_MS, exp + jitter);
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

// Claim the next actionable job using FOR UPDATE SKIP LOCKED so overlapping
// drains (cron ticks and the warm-path worker) each grab a different row instead
// of colliding. A job is actionable when it is queued and due (next_attempt_at
// has passed), or when it is a stale 'running' row left behind by a crashed
// worker. The row lock makes the read-then-claim atomic across workers.
// Exported for the integration test; called only from drainPlaidSyncJobs.
export async function claimNextDueJob() {
  return await db.transaction(async (tx) => {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_MS);

    const [candidate] = await tx
      .select()
      .from(plaidSyncJobs)
      .where(
        or(
          and(eq(plaidSyncJobs.status, 'queued'), lte(plaidSyncJobs.nextAttemptAt, now)),
          and(eq(plaidSyncJobs.status, 'running'), lte(plaidSyncJobs.startedAt, staleBefore)),
        ),
      )
      .orderBy(asc(plaidSyncJobs.nextAttemptAt), asc(plaidSyncJobs.createdAt))
      .limit(1)
      .for('update', { skipLocked: true });

    if (!candidate) return null;

    const [claimed] = await tx
      .update(plaidSyncJobs)
      .set({
        status: 'running',
        attempts: candidate.attempts + 1,
        startedAt: now,
        finishedAt: null,
        updatedAt: now,
      })
      .where(eq(plaidSyncJobs.id, candidate.id))
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

// Exported for unit tests; called only from drainPlaidSyncJobs.
export async function handleJobFailure(job: PlaidSyncJob, err: unknown) {
  const failure = classifyPlaidFailure(err);
  const summary = errorSummary(err);
  const now = new Date();
  const canRetry = failure.class === 'transient' && job.attempts < job.maxAttempts;

  if (canRetry) {
    // Transient with budget remaining: requeue behind a backoff delay. The Item
    // is left untouched (syncPlaidItem only flags genuine item-auth errors), so a
    // passing bank is never told to reconnect over a temporary blip.
    await db
      .update(plaidSyncJobs)
      .set({
        status: 'queued',
        lastError: summary,
        nextAttemptAt: new Date(now.getTime() + backoffMs(job.attempts)),
        startedAt: null,
        finishedAt: null,
        updatedAt: now,
      })
      .where(eq(plaidSyncJobs.id, job.id));
    return;
  }

  // Terminal: a permanent error, or transient retries exhausted. Record the
  // outcome and surface it to observability. The Item's status is owned by
  // syncPlaidItem, so the queue does not write plaid_items here.
  await db
    .update(plaidSyncJobs)
    .set({
      status: 'failed',
      lastError: summary,
      finishedAt: now,
      updatedAt: now,
    })
    .where(eq(plaidSyncJobs.id, job.id));

  reportPlaidSyncJobTerminal({ job, failure, summary });
}

export async function drainPlaidSyncJobs(options: { maxJobs?: number; deadline?: number } = {}) {
  const { maxJobs = DEFAULT_MAX_JOBS, deadline = Infinity } = options;

  return await Sentry.startSpan(
    {
      name: 'plaid sync queue drain',
      op: 'queue.process',
      attributes: {
        'plaid_sync.max_jobs': maxJobs,
        'plaid_sync.has_deadline': Number.isFinite(deadline),
      },
    },
    async (span) => {
      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      // Claim one job at a time (SKIP LOCKED) until the queue is drained, the job
      // budget is spent, or the time budget (used by the cron endpoint) runs out.
      while (processed < maxJobs && Date.now() < deadline) {
        const job = await claimNextDueJob();
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
          succeeded += 1;
        } catch (err) {
          await handleJobFailure(job, err);
          failed += 1;
        }
      }

      span.setAttribute('plaid_sync.processed', processed);
      span.setAttribute('plaid_sync.succeeded', succeeded);
      span.setAttribute('plaid_sync.failed', failed);

      return { processed, succeeded, failed };
    },
  );
}

export function kickPlaidSyncWorker() {
  if (!workerPromise) {
    // Warm path only: a short, best-effort drain so a user who just hit "Sync"
    // doesn't wait for the next cron tick. Vercel Cron is the reliability backbone.
    workerPromise = drainPlaidSyncJobs({ maxJobs: 5, deadline: Date.now() + 8_000 })
      .then(() => undefined)
      .catch((err) => {
        reportPlaidSyncWorkerFailure(err);
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
