import * as Sentry from '@sentry/nextjs';

import { scrubBreadcrumb, scrubEvent, scrubLog } from '@/lib/sentry-scrub';

function sampleRate(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: sampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
  enableLogs: true,
  sendDefaultPii: false,
  // Redact secrets that may be interpolated into error messages/logs/breadcrumbs.
  beforeSend: (event) => scrubEvent(event),
  beforeSendLog: (log) => scrubLog(log),
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
});
