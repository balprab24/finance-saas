// Classifies a failed Plaid sync into transient (worth retrying with backoff) vs
// permanent (the job will never succeed as-is). Kept free of db / Plaid-client
// imports so it is a pure leaf module: trivially unit-testable and safe to import
// from lib/plaid-sync.ts without creating an import cycle.

export type PlaidFailureClass = 'transient' | 'permanent';

export type PlaidFailureClassification = {
  class: PlaidFailureClass;
  // True only for recognized item-auth/config errors that require the user to
  // reconnect or fix the Item. Drives flipping plaid_items.status to 'error'.
  // Unknown errors and exhausted transients are NOT item errors — the bank is
  // fine, so we must not tell the user to reconnect.
  isItemError: boolean;
  errorCode?: string;
  errorMessage: string;
};

// Item-auth / config errors: retrying never helps until the user acts. These flip
// the Item to 'error' so the UI can prompt a reconnect.
const PERMANENT_ITEM_ERROR_CODES = new Set([
  'ITEM_LOGIN_REQUIRED',
  'INVALID_CREDENTIALS',
  'INVALID_MFA',
  'INVALID_ACCESS_TOKEN',
  'INVALID_UPDATED_USERNAME',
  'ITEM_LOCKED',
  'USER_SETUP_REQUIRED',
  'MFA_NOT_SUPPORTED',
  'INSUFFICIENT_CREDENTIALS',
  'NO_ACCOUNTS',
  'ITEM_NOT_SUPPORTED',
  'ACCESS_NOT_GRANTED',
  'PRODUCTS_NOT_SUPPORTED',
  'INSTITUTION_NO_LONGER_SUPPORTED',
]);

// Rate limits, Plaid-side outages, and the sync-pagination race: retry with backoff.
const TRANSIENT_ERROR_CODES = new Set([
  'RATE_LIMIT_EXCEEDED',
  'INTERNAL_SERVER_ERROR',
  'PLANNED_MAINTENANCE',
  'INSTITUTION_DOWN',
  'INSTITUTION_NOT_RESPONDING',
  'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION',
]);

// Node/axios transport failures that are inherently retryable.
const TRANSIENT_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNABORTED',
  'EAI_AGAIN',
  'ENOTFOUND',
  'ECONNREFUSED',
]);

function extractErrorDetails(err: unknown): {
  errorCode?: string;
  errorMessage: string;
  httpStatus?: number;
  networkCode?: string;
} {
  const anyErr = err as
    | {
        response?: {
          status?: unknown;
          data?: { error_code?: unknown; error_message?: unknown };
        };
        code?: unknown;
      }
    | null
    | undefined;

  const data = anyErr?.response?.data;
  const hasData = data && typeof data === 'object';

  const errorCode =
    hasData && 'error_code' in data && data.error_code ? String(data.error_code) : undefined;
  const errorMessage =
    hasData && 'error_message' in data && data.error_message
      ? String(data.error_message)
      : err instanceof Error
        ? err.message
        : 'Plaid sync failed';
  const httpStatus =
    typeof anyErr?.response?.status === 'number' ? anyErr.response.status : undefined;
  const networkCode = typeof anyErr?.code === 'string' ? anyErr.code : undefined;

  return { errorCode, errorMessage, httpStatus, networkCode };
}

export function classifyPlaidFailure(err: unknown): PlaidFailureClassification {
  const { errorCode, errorMessage, httpStatus, networkCode } = extractErrorDetails(err);

  if (errorCode && PERMANENT_ITEM_ERROR_CODES.has(errorCode)) {
    return { class: 'permanent', isItemError: true, errorCode, errorMessage };
  }
  if (errorCode && TRANSIENT_ERROR_CODES.has(errorCode)) {
    return { class: 'transient', isItemError: false, errorCode, errorMessage };
  }

  // No recognized Plaid error_code: fall back to transport signals.
  if (httpStatus === 429 || (typeof httpStatus === 'number' && httpStatus >= 500)) {
    return { class: 'transient', isItemError: false, errorCode, errorMessage };
  }
  if (networkCode && TRANSIENT_NETWORK_CODES.has(networkCode)) {
    return { class: 'transient', isItemError: false, errorCode, errorMessage };
  }

  // Unknown 4xx, app logic bugs (e.g. "Missing local account…"), malformed
  // responses: fail the job fast (don't hammer it) but do NOT flag the Item —
  // it isn't the bank's fault, so the user shouldn't be told to reconnect.
  return { class: 'permanent', isItemError: false, errorCode, errorMessage };
}
