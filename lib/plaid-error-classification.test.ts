import { describe, expect, it } from 'vitest';

import { classifyPlaidFailure } from '@/lib/plaid-error-classification';

// status defaults to 400 so the transient-code cases prove the error_code (not
// the HTTP status) is what drives the classification.
function plaidError(error_code: string, error_message = 'msg', status = 400) {
  return { response: { status, data: { error_code, error_message } } };
}

describe('classifyPlaidFailure', () => {
  it('classifies item-auth/config errors as permanent item errors', () => {
    for (const code of [
      'ITEM_LOGIN_REQUIRED',
      'INVALID_CREDENTIALS',
      'INVALID_ACCESS_TOKEN',
      'ITEM_LOCKED',
      'NO_ACCOUNTS',
      'INSUFFICIENT_CREDENTIALS',
      'INSTITUTION_NO_LONGER_SUPPORTED',
    ]) {
      expect(classifyPlaidFailure(plaidError(code))).toMatchObject({
        class: 'permanent',
        isItemError: true,
        errorCode: code,
      });
    }
  });

  it('classifies rate limits, Plaid outages, and the pagination race as transient', () => {
    for (const code of [
      'RATE_LIMIT_EXCEEDED',
      'INTERNAL_SERVER_ERROR',
      'PLANNED_MAINTENANCE',
      'INSTITUTION_DOWN',
      'INSTITUTION_NOT_RESPONDING',
      'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION',
    ]) {
      expect(classifyPlaidFailure(plaidError(code))).toMatchObject({
        class: 'transient',
        isItemError: false,
        errorCode: code,
      });
    }
  });

  it('falls back to transient on 429 / 5xx without a recognized error_code', () => {
    expect(classifyPlaidFailure({ response: { status: 429, data: {} } }).class).toBe('transient');
    expect(classifyPlaidFailure({ response: { status: 503, data: {} } }).class).toBe('transient');
    expect(classifyPlaidFailure({ response: { status: 500 } }).class).toBe('transient');
  });

  it('treats network/transport errors as transient', () => {
    for (const code of ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED']) {
      expect(classifyPlaidFailure({ code }).class).toBe('transient');
    }
  });

  it('treats unknown 4xx and app logic bugs as permanent but NOT item errors', () => {
    expect(classifyPlaidFailure({ response: { status: 400, data: {} } })).toMatchObject({
      class: 'permanent',
      isItemError: false,
    });

    const bug = classifyPlaidFailure(new Error('Missing local account for Plaid account a1'));
    expect(bug).toMatchObject({ class: 'permanent', isItemError: false });
    expect(bug.errorMessage).toContain('Missing local account');
  });

  it('extracts error_code and error_message from the Plaid response body', () => {
    const result = classifyPlaidFailure(plaidError('ITEM_LOGIN_REQUIRED', 'please reconnect'));
    expect(result.errorCode).toBe('ITEM_LOGIN_REQUIRED');
    expect(result.errorMessage).toBe('please reconnect');
  });

  it('handles null/undefined/string errors without throwing', () => {
    expect(classifyPlaidFailure(null)).toMatchObject({ class: 'permanent', isItemError: false });
    expect(classifyPlaidFailure(undefined)).toMatchObject({ class: 'permanent', isItemError: false });
    expect(classifyPlaidFailure('boom').errorMessage).toBe('Plaid sync failed');
  });
});
