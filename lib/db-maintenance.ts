import { lt } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { plaidWebhookEvents, rateLimits } from '@/db/schema';

// Rate-limit rows are dead once their window's resetAt passes; a one-day buffer
// keeps recent rows inspectable while debugging.
export const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;

// Webhook events exist only for replay dedup. Verification tokens expire after
// 5 minutes, so a 30-day horizon is already far beyond any replayable window.
export const WEBHOOK_EVENT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// Both tables otherwise grow without bound: one rate_limits row per distinct
// key (users × buckets + per-IP webhook keys) and one webhook event per unique
// body, forever. Runs from the cron drain; both deletes hit existing indexes.
export async function pruneOperationalTables(
  opts: { now?: Date } = {},
): Promise<{ rateLimitsDeleted: number; webhookEventsDeleted: number }> {
  const now = opts.now ?? new Date();

  const rateLimitCutoff = new Date(now.getTime() - RATE_LIMIT_RETENTION_MS);
  const webhookCutoff = new Date(now.getTime() - WEBHOOK_EVENT_RETENTION_MS);

  const deletedRateLimits = await db
    .delete(rateLimits)
    .where(lt(rateLimits.resetAt, rateLimitCutoff))
    .returning({ key: rateLimits.key });

  const deletedWebhookEvents = await db
    .delete(plaidWebhookEvents)
    .where(lt(plaidWebhookEvents.receivedAt, webhookCutoff))
    .returning({ sha: plaidWebhookEvents.requestBodySha256 });

  return {
    rateLimitsDeleted: deletedRateLimits.length,
    webhookEventsDeleted: deletedWebhookEvents.length,
  };
}
