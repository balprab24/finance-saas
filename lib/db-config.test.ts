import { describe, expect, it } from 'vitest';

import { isLoopbackHost, resolveDbOptions } from './db-config';

const REMOTE = 'postgresql://app:pw@db.example.com:5432/aurex';
const LOCAL = 'postgresql://postgres:postgres@localhost:5432/postgres';

describe('isLoopbackHost', () => {
  it('accepts loopback spellings', () => {
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('::1')).toBe(true);
    expect(isLoopbackHost('[::1]')).toBe(true);
    expect(isLoopbackHost('host.docker.internal')).toBe(true);
  });

  it('rejects remote hosts', () => {
    expect(isLoopbackHost('db.example.com')).toBe(false);
    expect(isLoopbackHost('10.0.0.5')).toBe(false);
  });
});

describe('resolveDbOptions — TLS', () => {
  it('requires ssl for remote hosts', () => {
    expect(resolveDbOptions(REMOTE, {}).ssl).toBe('require');
  });

  it('leaves loopback connections plaintext', () => {
    expect(resolveDbOptions(LOCAL, {}).ssl).toBeUndefined();
    expect(resolveDbOptions('postgresql://u@127.0.0.1/db', {}).ssl).toBeUndefined();
  });

  it('defers to an explicit sslmode in the URL', () => {
    expect(resolveDbOptions(`${REMOTE}?sslmode=verify-full`, {}).ssl).toBeUndefined();
    expect(resolveDbOptions(`${REMOTE}?ssl=true`, {}).ssl).toBeUndefined();
  });

  it('honors the DATABASE_SSL=disable escape hatch outside production', () => {
    const opts = resolveDbOptions(REMOTE, { DATABASE_SSL: 'disable' });
    expect(opts.ssl).toBeUndefined();
  });

  it('throws on a plaintext remote connection in production', () => {
    expect(() =>
      resolveDbOptions(REMOTE, { NODE_ENV: 'production', DATABASE_SSL: 'disable' }),
    ).toThrow(/Refusing plaintext/);
    expect(() =>
      resolveDbOptions(`${REMOTE}?sslmode=disable`, { NODE_ENV: 'production' }),
    ).toThrow(/Refusing plaintext/);
  });

  it('allows loopback plaintext even in production', () => {
    expect(resolveDbOptions(LOCAL, { NODE_ENV: 'production' }).ssl).toBeUndefined();
  });

  it('rejects an unparsable connection string', () => {
    expect(() => resolveDbOptions('not a url', {})).toThrow(/not a valid connection URL/);
  });
});

describe('resolveDbOptions — pool', () => {
  it('applies serverless-safe defaults', () => {
    const opts = resolveDbOptions(LOCAL, {});
    expect(opts.max).toBe(5);
    expect(opts.idle_timeout).toBe(20);
    expect(opts.connect_timeout).toBe(10);
    expect(opts.max_lifetime).toBe(1800);
  });

  it('respects DATABASE_POOL_MAX', () => {
    expect(resolveDbOptions(LOCAL, { DATABASE_POOL_MAX: '2' }).max).toBe(2);
  });

  it('ignores invalid DATABASE_POOL_MAX values', () => {
    expect(resolveDbOptions(LOCAL, { DATABASE_POOL_MAX: 'lots' }).max).toBe(5);
    expect(resolveDbOptions(LOCAL, { DATABASE_POOL_MAX: '0' }).max).toBe(5);
  });
});
