import { NextResponse } from 'next/server';

import { drainPlaidSyncJobs } from '@/lib/plaid-sync-jobs';

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

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  // Fail closed: an unset secret must never expose an open drain endpoint. Vercel
  // automatically sends `Authorization: Bearer ${CRON_SECRET}` on cron invocations
  // when CRON_SECRET is configured.
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await drainPlaidSyncJobs({
      maxJobs: CRON_MAX_JOBS,
      deadline: Date.now() + CRON_BUDGET_MS,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[cron plaid-sync]', err);
    }
    return NextResponse.json({ ok: false, error: 'drain_failed' }, { status: 500 });
  }
}
