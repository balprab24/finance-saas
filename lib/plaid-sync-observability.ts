import * as Sentry from '@sentry/nextjs';

import type { PlaidFailureClassification } from '@/lib/plaid-error-classification';

type TerminalJob = {
  id: string;
  itemId: string;
  userId: string;
  attempts: number;
  reason: string;
};

type CronCheckInId = ReturnType<typeof Sentry.captureCheckIn>;

const DEFAULT_CRON_MONITOR_SLUG = 'plaid-sync-cron';
const DEFAULT_CRON_MONITOR_SCHEDULE = '*/5 * * * *';

function safelyCapture(callback: () => void) {
  try {
    callback();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sentry capture failed]', err);
    }
  }
}

function cronMonitorSlug() {
  return process.env.SENTRY_PLAID_SYNC_MONITOR_SLUG || DEFAULT_CRON_MONITOR_SLUG;
}

function cronMonitorConfig() {
  return {
    schedule: {
      type: 'crontab' as const,
      value: process.env.SENTRY_PLAID_SYNC_MONITOR_SCHEDULE || DEFAULT_CRON_MONITOR_SCHEDULE,
    },
    checkinMargin: 5,
    maxRuntime: 1,
    failureIssueThreshold: 1,
    recoveryThreshold: 1,
  };
}

// Single hook fired when a sync job reaches a terminal failed state (a permanent
// error, or transient retries exhausted). Kept side-effect-free and non-throwing
// so observability can never disrupt queue draining.
export function reportPlaidSyncJobTerminal(event: {
  job: TerminalJob;
  failure: PlaidFailureClassification;
  summary: string;
}) {
  safelyCapture(() => {
    Sentry.withScope((scope) => {
      scope.setLevel(event.failure.isItemError ? 'error' : 'warning');
      scope.setTag('area', 'plaid_sync');
      scope.setTag('plaid_sync.event', 'job_terminal_failure');
      scope.setTag('plaid_sync.failure_class', event.failure.class);
      scope.setTag('plaid_sync.is_item_error', String(event.failure.isItemError));
      scope.setTag('plaid_sync.item_id', event.job.itemId);
      if (event.failure.errorCode) {
        scope.setTag('plaid.error_code', event.failure.errorCode);
      }
      scope.setContext('plaid_sync_job', {
        jobId: event.job.id,
        itemId: event.job.itemId,
        reason: event.job.reason,
        attempts: event.job.attempts,
        summary: event.summary,
        failureClass: event.failure.class,
        isItemError: event.failure.isItemError,
        errorCode: event.failure.errorCode ?? null,
      });
      scope.setFingerprint([
        'plaid-sync-job-terminal',
        event.failure.errorCode ?? event.failure.class,
      ]);
      Sentry.captureMessage('Plaid sync job reached terminal failed state');
    });
  });

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

export function startPlaidSyncCronCheckIn() {
  try {
    return Sentry.captureCheckIn(
      {
        monitorSlug: cronMonitorSlug(),
        status: 'in_progress',
      },
      cronMonitorConfig(),
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sentry cron check-in failed]', err);
    }
    return undefined;
  }
}

export function finishPlaidSyncCronCheckIn({
  checkInId,
  status,
}: {
  checkInId?: CronCheckInId;
  status: 'ok' | 'error';
}) {
  safelyCapture(() => {
    Sentry.captureCheckIn(
      {
        checkInId,
        monitorSlug: cronMonitorSlug(),
        status,
      },
      cronMonitorConfig(),
    );
  });
}

export function reportPlaidSyncCronDrainFailure(err: unknown) {
  safelyCapture(() => {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTag('area', 'plaid_sync');
      scope.setTag('plaid_sync.event', 'cron_drain_failure');
      scope.setTag('cron.monitor_slug', cronMonitorSlug());
      scope.setContext('plaid_sync_cron', {
        endpoint: '/api/cron/plaid-sync',
        monitorSlug: cronMonitorSlug(),
      });
      Sentry.captureException(err);
    });
  });
}

export function reportPlaidSyncWorkerFailure(err: unknown) {
  safelyCapture(() => {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTag('area', 'plaid_sync');
      scope.setTag('plaid_sync.event', 'warm_worker_failure');
      Sentry.captureException(err);
    });
  });
}
