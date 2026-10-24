import { describe, expect, it } from 'vitest';
import { filterByRange, rangeEnd, resolveRange } from '../src/dashboard/range';
import { makeOrder } from './support/orders';

const NOW = new Date(2026, 9, 24, 15, 0); // 24 Oct 2026

describe('resolveRange', () => {
  it('"all" has no bounds', () => {
    expect(resolveRange({ preset: 'all' }, NOW)).toEqual({ start: null, end: null });
  });

  it('this month spans the whole calendar month', () => {
    const { start, end } = resolveRange({ preset: 'thisMonth' }, NOW);
    expect(start).toEqual(new Date(2026, 9, 1));
    expect(end).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));
  });

  it('last month crosses the year boundary in January', () => {
    const { start, end } = resolveRange({ preset: 'lastMonth' }, new Date(2026, 0, 10));
    expect(start).toEqual(new Date(2025, 11, 1));
    expect(end).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
  });

  it('last 3 months covers this and the two previous months', () => {
    const { start, end } = resolveRange({ preset: 'last3months' }, NOW);
    expect(start).toEqual(new Date(2026, 7, 1));
    expect(end).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));
  });

  it('this year spans January to December', () => {
    const { start, end } = resolveRange({ preset: 'thisYear' }, NOW);
    expect(start).toEqual(new Date(2026, 0, 1));
    expect(end).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
  });

  it('last 7 days runs from six days ago, midnight, to the end of today', () => {
    const { start, end } = resolveRange({ preset: 'last7days' }, NOW);
    expect(start).toEqual(new Date(2026, 9, 18));
    expect(end).toEqual(new Date(2026, 9, 24, 23, 59, 59, 999));
  });

  it('a chosen year spans January to December of that year', () => {
    const { start, end } = resolveRange({ preset: 'year', year: 2025 }, NOW);
    expect(start).toEqual(new Date(2025, 0, 1));
    expect(end).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
  });

  it('a chosen month spans that calendar month, February of a leap year included', () => {
    const { start, end } = resolveRange({ preset: 'month', year: 2024, month: 2 }, NOW);
    expect(start).toEqual(new Date(2024, 1, 1));
    expect(end).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });

  it('year and month default to the current ones', () => {
    expect(resolveRange({ preset: 'year' }, NOW).start).toEqual(new Date(2026, 0, 1));
    expect(resolveRange({ preset: 'month' }, NOW).start).toEqual(new Date(2026, 9, 1));
  });

  it('custom takes inclusive day bounds and tolerates an open side', () => {
    const both = resolveRange({ preset: 'custom', from: '2026-03-05', to: '2026-03-07' }, NOW);
    expect(both.start).toEqual(new Date(2026, 2, 5));
    expect(both.end).toEqual(new Date(2026, 2, 7, 23, 59, 59, 999));
    expect(resolveRange({ preset: 'custom', from: '2026-03-05' }, NOW).end).toBeNull();
    expect(resolveRange({ preset: 'custom' }, NOW)).toEqual({ start: null, end: null });
  });
});

describe('filterByRange', () => {
  const inRange = makeOrder('2026-10-10T10:00:00');
  const before = makeOrder('2026-09-30T23:00:00');
  const undated = makeOrder(null);

  it('returns everything for an open range, undated orders included', () => {
    expect(filterByRange([inRange, before, undated], { start: null, end: null })).toHaveLength(3);
  });

  it('keeps orders inside the range and drops undated ones once a bound is set', () => {
    const range = resolveRange({ preset: 'thisMonth' }, NOW);
    expect(filterByRange([inRange, before, undated], range)).toEqual([inRange]);
  });
});

describe('rangeEnd', () => {
  it('is the range end, but never later than now', () => {
    expect(rangeEnd(resolveRange({ preset: 'lastMonth' }, NOW), NOW)).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999));
    expect(rangeEnd(resolveRange({ preset: 'thisYear' }, NOW), NOW)).toBe(NOW);
    expect(rangeEnd({ start: null, end: null }, NOW)).toBe(NOW);
  });
});
