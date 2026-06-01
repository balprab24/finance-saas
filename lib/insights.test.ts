import { describe, expect, it } from 'vitest';

import { flagUnusual } from './insights';

describe('flagUnusual', () => {
  it('flags a clear spike above the trailing average', () => {
    const r = flagUnusual(120_000, 50_000);
    expect(r.flagged).toBe(true);
    expect(r.isNew).toBe(false);
    expect(r.multiple).toBe(2.4);
  });

  it('does not flag spend within normal range', () => {
    expect(flagUnusual(55_000, 50_000).flagged).toBe(false);
  });

  it('suppresses categories below the noise floor', () => {
    // 5x jump but tiny absolute amount
    const r = flagUnusual(10_000, 2_000);
    expect(r.flagged).toBe(false);
  });

  it('suppresses spikes whose absolute increase is below the floor', () => {
    // ratio 1.6x but only a $15 increase (< $20 floor)
    const r = flagUnusual(40_000, 25_000, { floorMilliunits: 20_000 });
    expect(r.flagged).toBe(false);
  });

  it('flags a brand-new category as new', () => {
    const r = flagUnusual(80_000, 0);
    expect(r.flagged).toBe(true);
    expect(r.isNew).toBe(true);
    expect(r.multiple).toBe(0);
  });

  it('respects a custom multiple', () => {
    expect(flagUnusual(90_000, 50_000, { multiple: 2 }).flagged).toBe(false);
    expect(flagUnusual(110_000, 50_000, { multiple: 2 }).flagged).toBe(true);
  });
});
