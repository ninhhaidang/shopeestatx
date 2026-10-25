import { describe, expect, it } from 'vitest';
import { currentMonthSpend } from '../src/dashboard/budget';
import { generateInsights } from '../src/dashboard/insights';
import { buildHeatmapGrid, heatmapWindow } from '../src/dashboard/heatmap';
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

  it('averages only valid dated orders over real populated months', () => {
    const undated = Array.from({ length: 20 }, () => makeOrder(null));
    const invalid = makeOrder(null, { deliveryDate: 'not-a-date' });
    expect(generateInsights([drifted, ...undated, invalid], NOW).some(s => s.includes('đơn/tháng'))).toBe(false);
    expect(generateInsights([drifted, prior, ...undated, invalid], NOW)).toContain('Bạn đặt trung bình 1 đơn/tháng trên Shopee.');
  });

  it('reports local peak day, stable top seller and excluded original value without savings claims', () => {
    const orders = [
      makeOrder(new Date(2026, 9, 2, 0, 15).toISOString(), { shopId: '1', shopName: 'a - constructor - Full' }),
      makeOrder(new Date(2026, 9, 2, 23, 45).toISOString(), { shopId: '1', shopName: 'a - Renamed' }),
      makeOrder(new Date(2026, 9, 3, 12).toISOString(), { shopId: '2', shopName: 'b - constructor - Full' }),
      makeOrder(null, { statusCode: 4, subTotal: 0, refundAmount: 70_000 }),
      makeOrder(null, { statusCode: 12, subTotal: 0, refundAmount: undefined }),
    ];
    const insights = generateInsights(orders, NOW);
    expect(insights).toContain('Shop "constructor - Full" là nơi bạn mua nhiều nhất (2 đơn).');
    expect(insights.find(s => s.startsWith('Ngày '))).toMatch(/Ngày 2026-10-02.*200\.000/);
    const excluded = insights.find(s => s.includes('70.000'));
    expect(excluded).toBeDefined();
    expect(excluded).toMatch(/giá trị.*hủy\/trả hàng/i);
    expect(excluded).not.toMatch(/tiết kiệm|hoàn tiền/i);
  });

  it('includes both leap-year heatmap endpoints without adding the next March day', () => {
    const now = new Date(2024, 1, 29, 12);
    const { start, end } = heatmapWindow({ start: null, end: null }, now);
    expect(start).toEqual(new Date(2023, 2, 1));
    expect(end).toEqual(new Date(2024, 1, 29));
    const grid = buildHeatmapGrid([
      makeOrder(new Date(2023, 2, 1, 0, 15).toISOString()),
      makeOrder(new Date(2024, 1, 29, 23, 45).toISOString()),
    ], start, end);
    expect(grid.days.map(day => day.date)).toEqual(['2023-03-01', '2024-02-29']);
    expect(grid.totalOrders).toBe(2);
  });
});
