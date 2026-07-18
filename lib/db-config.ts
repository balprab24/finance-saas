// Connection-option policy for the postgres.js client, shared by db/drizzle.ts and
// the tsx scripts. Pure and framework-free so scripts can import it without pulling
// in the app's db singleton.
//
// TLS rule: any non-loopback host gets ssl: 'require' unless the URL already carries
// an explicit sslmode/ssl parameter (the driver honors those). The decision is
// hostname-based rather than NODE_ENV-based because the seed/rotate scripts run with
// NODE_ENV unset while pointing at arbitrary databases. Production additionally
// fails closed: a remote connection that would end up plaintext throws.

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal']);

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host.replace(/^\[|\]$/g, '').toLowerCase());
}

export type ResolvedDbOptions = {
  ssl?: 'require';
  max: number;
  idle_timeout: number;
  connect_timeout: number;
  max_lifetime: number;
};

export function resolveDbOptions(
  connectionString: string,
  env: Record<string, string | undefined> = process.env,
): ResolvedDbOptions {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL is not a valid connection URL');
  }

  const loopback = isLoopbackHost(url.hostname);
  const sslParam = url.searchParams.get('sslmode') ?? url.searchParams.get('ssl');
  const sslDisabledByParam = sslParam === 'disable' || sslParam === 'false';
  const sslDisabledByEnv = env.DATABASE_SSL === 'disable';

  const ssl: 'require' | undefined =
    sslParam !== null || loopback || sslDisabledByEnv ? undefined : 'require';

  if (
    env.NODE_ENV === 'production' &&
    !loopback &&
    (sslDisabledByEnv || sslDisabledByParam)
  ) {
    throw new Error(
      'Refusing plaintext Postgres connection in production; use sslmode=require or unset DATABASE_SSL',
    );
  }

  const maxOverride = Number.parseInt(env.DATABASE_POOL_MAX ?? '', 10);

  return {
    ...(ssl ? { ssl } : {}),
    // Small pool: serverless instances multiply, and pgbouncer-style poolers (the
    // prepare: false companion) do the real fan-in. Timeouts are seconds.
    max: Number.isFinite(maxOverride) && maxOverride > 0 ? maxOverride : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  };
}
