import type { PlaidFailureClassification } from '@/lib/plaid-error-classification';

type TerminalJob = {
  id: string;
  itemId: string;
  userId: string;
  attempts: number;
  reason: string;
};

// Single hook fired when a sync job reaches a terminal failed state (a permanent
// error, or transient retries exhausted). Stage 3 wires Sentry in here. Kept
// side-effect-free and non-throwing so it can never disrupt queue draining.
export function reportPlaidSyncJobTerminal(event: {
  job: TerminalJob;
  failure: PlaidFailureClassification;
  summary: string;
}) {
  // Stage 3: report to Sentry (capture the failure, tag itemId/errorCode, and
  // alert on item-error transitions / repeated failures). Intentionally a no-op
  // in production for now beyond structured local logging.
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[plaid sync job failed]', {
      jobId: event.job.id,
      itemId: event.job.itemId,
      attempts: event.job.attempts,
      class: event.failure.class,
      isItemError: event.failure.isItemError,
      errorCode: event.failure.errorCode,
    });
  }
}
