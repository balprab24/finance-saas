import { describe, expect, it } from 'vitest';

import { parseCsvDate } from './csv-date';

function ymd(d: Date | null) {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

describe('parseCsvDate', () => {
  it('parses the legacy timestamp format', () => {
    expect(ymd(parseCsvDate('2026-04-30 13:45:00'))).toBe('2026-04-30');
  });

  it('parses date-only ISO', () => {
    expect(ymd(parseCsvDate('2026-04-30'))).toBe('2026-04-30');
  });

  it('parses US slash format', () => {
    expect(ymd(parseCsvDate('04/30/2026'))).toBe('2026-04-30');
    expect(ymd(parseCsvDate('4/5/2026'))).toBe('2026-04-05');
  });

  it('parses month-name formats', () => {
    expect(ymd(parseCsvDate('Apr 30, 2026'))).toBe('2026-04-30');
    expect(ymd(parseCsvDate('30 Apr 2026'))).toBe('2026-04-30');
  });

  it('parses ISO 8601 with timezone via the native fallback', () => {
    const d = parseCsvDate('2026-04-30T13:45:00Z');
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2026);
    expect(d!.getUTCMonth()).toBe(3);
    expect(d!.getUTCDate()).toBe(30);
  });

  it('returns null for empty / nullish input', () => {
    expect(parseCsvDate('')).toBeNull();
    expect(parseCsvDate('   ')).toBeNull();
    expect(parseCsvDate(null)).toBeNull();
    expect(parseCsvDate(undefined)).toBeNull();
  });

  it('returns null for unparseable strings', () => {
    expect(parseCsvDate('not a date')).toBeNull();
    expect(parseCsvDate('2026-13-99')).toBeNull();
  });
});
