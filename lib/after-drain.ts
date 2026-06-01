import { after } from 'next/server';

import { kickPlaidSyncWorker } from '@/lib/plaid-sync-jobs';

// Best-effort warm-path drain so a user who just triggered a sync (or an incoming
// webhook) doesn't wait for the next cron tick. `after()` runs the work once the
// response has flushed, within the same Vercel function invocation — unlike a bare
// `void promise`, which races function freeze/termination on serverless.
//
// `after()` throws when called outside a Next.js request scope (unit tests,
// scripts). That's fine: the scheduled cron drain is the reliability backbone, so
// we swallow the error and let cron pick the work up.
export function scheduleWarmDrain() {
  try {
    after(() => kickPlaidSyncWorker());
  } catch {
    // Not in a request scope — the cron drain will handle it.
  }
}
