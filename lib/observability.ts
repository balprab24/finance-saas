import * as Sentry from '@sentry/nextjs';

export function reportApiRouteError(
  err: unknown,
  context: {
    method: string;
    path: string;
  },
) {
  try {
    Sentry.withScope((scope) => {
      scope.setTag('area', 'api');
      scope.setTag('http.method', context.method);
      scope.setTag('route.path', context.path);
      scope.setContext('api_route', context);
      Sentry.captureException(err);
    });
  } catch (captureErr) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sentry capture failed]', captureErr);
    }
  }
}
