import { describe, expect, it } from 'vitest';
import { currentMonthSpend } from '../src/dashboard/budget';
import { generateInsights } from '../src/dashboard/insights';
import { computeOverview, monthChange } from '../src/dashboard/overview';
import { predictMonthEnd } from '../src/dashboard/predictions';
import { filterByRange, resolveRange } from '../src/dashboard/range';
import { monthSpend } from '../src/dashboard/month';
import { makeOrder } from './support/orders';

// The cached month/year fields can disagree with the delivery date (cache saved in another time zone).
// Every figure must bucket by the delivery date, the same thing the date range filters on.
const NOW = new Date(2026, 9, 24, 12, 0);
const drifted = makeOrder('2026-10-10T10:00:00', { subTotal: 300_000, orderMonth: 9, orderYear: 2026 });
const prior = makeOrder('2026-09-10T10:00:00', { subTotal: 100_000, orderMonth: 9, orderYear: 2026 });

describe('one month basis: the delivery date', () => {
  it('monthSpend sums the orders delivered in that month', () => {
    expect(monthSpend([drifted, prior], 10, 2026)).toBe(300_000);
    expect(monthSpend([drifted, prior], 9, 2026)).toBe(100_000);
  });

  it('the range filter and the monthly chart agree', () => {
    const range = resolveRange({ preset: 'thisMonth' }, NOW);
    const inRange = filterByRange([drifted, prior], range);
    expect(computeOverview(inRange).monthly).toEqual([{ label: '10/2026', total: 300_000 }]);
  });

  it('budget, prediction, month change and insights use it too', () => {
    expect(currentMonthSpend([drifted, prior], NOW)).toBe(300_000);
    expect(predictMonthEnd([drifted, prior], NOW)).toBe(Math.round((300_000 / 24) * 31));
    expect(monthChange([drifted, prior], NOW)).toMatchObject({ current: 300_000, previous: 100_000 });
    expect(generateInsights([drifted, prior], NOW)[0]).toMatch(/Tháng này bạn đã chi 300\.000.*tăng 200%/);
  });
});
