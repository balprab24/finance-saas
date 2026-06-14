import { afterEach, describe, expect, it, vi } from 'vitest';

const scope = {
  setContext: vi.fn(),
  setFingerprint: vi.fn(),
  setLevel: vi.fn(),
  setTag: vi.fn(),
};
const captureCheckIn = vi.fn<(...args: unknown[]) => string>(() => 'check_in_1');
const captureException = vi.fn();
const captureMessage = vi.fn();
const withScope = vi.fn((callback: (value: typeof scope) => void) => callback(scope));

vi.mock('@sentry/nextjs', () => ({
  captureCheckIn: (...args: unknown[]) => captureCheckIn(...args),
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  withScope: (...args: unknown[]) => withScope(...(args as [(value: typeof scope) => void])),
}));

import {
  finishPlaidSyncCronCheckIn,
  reportPlaidSyncCronDrainFailure,
  reportPlaidSyncJobTerminal,
  startPlaidSyncCronCheckIn,
} from '@/lib/plaid-sync-observability';

const originalMonitorSlug = process.env.SENTRY_PLAID_SYNC_MONITOR_SLUG;
const originalMonitorSchedule = process.env.SENTRY_PLAID_SYNC_MONITOR_SCHEDULE;

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

afterEach(() => {
  vi.unstubAllEnvs();
  restoreEnv('SENTRY_PLAID_SYNC_MONITOR_SLUG', originalMonitorSlug);
  restoreEnv('SENTRY_PLAID_SYNC_MONITOR_SCHEDULE', originalMonitorSchedule);
  vi.clearAllMocks();
});

describe('plaid sync observability', () => {
  it('captures terminal job failures with useful Sentry tags', () => {
    vi.stubEnv('NODE_ENV', 'production');

    reportPlaidSyncJobTerminal({
      job: {
        id: 'job_1',
        itemId: 'item_1',
        userId: 'user_1',
        attempts: 5,
        reason: 'manual',
      },
      failure: {
        class: 'permanent',
        isItemError: true,
        errorCode: 'ITEM_LOGIN_REQUIRED',
        errorMessage: 'reconnect',
      },
      summary: 'ITEM_LOGIN_REQUIRED: reconnect',
    });

    expect(withScope).toHaveBeenCalledTimes(1);
    expect(scope.setLevel).toHaveBeenCalledWith('error');
    expect(scope.setTag).toHaveBeenCalledWith('plaid_sync.item_id', 'item_1');
    expect(scope.setTag).toHaveBeenCalledWith('plaid.error_code', 'ITEM_LOGIN_REQUIRED');
    expect(captureMessage).toHaveBeenCalledWith('Plaid sync job reached terminal failed state');
  });

  it('sends cron monitor check-ins with the configured slug and schedule', () => {
    process.env.SENTRY_PLAID_SYNC_MONITOR_SLUG = 'custom-sync';
    process.env.SENTRY_PLAID_SYNC_MONITOR_SCHEDULE = '0 * * * *';

    const checkInId = startPlaidSyncCronCheckIn();
    finishPlaidSyncCronCheckIn({ checkInId, status: 'ok' });

    expect(captureCheckIn).toHaveBeenNthCalledWith(
      1,
      { monitorSlug: 'custom-sync', status: 'in_progress' },
      expect.objectContaining({
        schedule: { type: 'crontab', value: '0 * * * *' },
      }),
    );
    expect(captureCheckIn).toHaveBeenNthCalledWith(
      2,
      { checkInId: 'check_in_1', monitorSlug: 'custom-sync', status: 'ok' },
      expect.objectContaining({
        schedule: { type: 'crontab', value: '0 * * * *' },
      }),
    );
  });

  it('captures cron drain failures', () => {
    const err = new Error('boom');
    reportPlaidSyncCronDrainFailure(err);

    expect(scope.setTag).toHaveBeenCalledWith('plaid_sync.event', 'cron_drain_failure');
    expect(captureException).toHaveBeenCalledWith(err);
  });
});
