import { timingSafeEqual } from 'crypto';

import { NextResponse } from 'next/server';

import { pruneOperationalTables } from '@/lib/db-maintenance';
import { drainPlaidSyncJobs } from '@/lib/plaid-sync-jobs';
import {
  finishPlaidSyncCronCheckIn,
  reportPlaidSyncCronDrainFailure,
  startPlaidSyncCronCheckIn,
} from '@/lib/plaid-sync-observability';

// Dedicated, secret-protected drain endpoint hit by Vercel Cron. A concrete route
// segment takes precedence over the [[...route]] Hono catch-all, so this bypasses
// the Hono app and Clerk entirely and enforces its own bearer check.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Self-imposed budget so the function returns cleanly before Vercel kills it
// mid-write. Claiming one job at a time with SKIP LOCKED makes overlapping ticks
// safe, so a long-running tick simply yields remaining work to the next one.
const CRON_BUDGET_MS = 50_000;
const CRON_MAX_JOBS = 25;

// Constant-time equality so the bearer check cannot be probed byte-by-byte via a
// timing side-channel. Differing lengths short-circuit (length is not sensitive).
function timingSafeStringEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  // Fail closed: an unset secret must never expose an open drain endpoint. Vercel
  // automatically sends `Authorization: Bearer ${CRON_SECRET}` on cron invocations
  // when CRON_SECRET is configured.
  if (!secret || !authorization || !timingSafeStringEqual(authorization, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checkInId = startPlaidSyncCronCheckIn();

  try {
    const result = await drainPlaidSyncJobs({
      maxJobs: CRON_MAX_JOBS,
      deadline: Date.now() + CRON_BUDGET_MS,
    });
    // Housekeeping piggybacks on the drain tick; a prune failure must never
    // fail the drain, so it degrades to null in the response.
    const pruned = await pruneOperationalTables().catch(() => null);
    finishPlaidSyncCronCheckIn({ checkInId, status: 'ok' });
    return NextResponse.json({ ok: true, ...result, pruned });
  } catch (err) {
    reportPlaidSyncCronDrainFailure(err);
    finishPlaidSyncCronCheckIn({ checkInId, status: 'error' });
    if (process.env.NODE_ENV !== 'production') {
      console.error('[cron plaid-sync]', err);
    }
    return NextResponse.json({ ok: false, error: 'drain_failed' }, { status: 500 });
  }
}
