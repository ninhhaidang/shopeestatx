import { describe, it, expect } from 'vitest';
import { computeStats, needsRescan } from '../src/dashboard/stats';
import type { Order } from '../src/types';

// Local-time dates so weekday/hour assertions do not depend on the machine's timezone.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '1', name: 'A', productCount: 1, subTotal: 100_000, subTotalFormatted: '',
    status: 'Hoàn thành', statusCode: 3, shopName: 's - Shop', productSummary: '',
    deliveryDate: at(2025, 1, 15), orderMonth: 1, orderYear: 2025,
    refundAmount: 0, ...overrides,
  };
}
const cancelled = (refund: number) => makeOrder({ statusCode: 4, status: 'Đã hủy', subTotal: 0, refundAmount: refund });

describe('computeStats: net spend and refunds', () => {
  it('returns zeros and nulls for no orders', () => {
    expect(computeStats([])).toMatchObject({
      netSpend: 0, refundTotal: 0, excludedCount: 0, estimatedSavings: 0,
      busiestWeekday: null, busiestHour: null, longestMonthStreak: 0, dailySpendRate: 0,
      topByQuantity: [], priciest: [],
    });
  });

  it('sums net spend over included orders only and counts excluded orders with their refunds', () => {
    const s = computeStats([makeOrder(), makeOrder({ subTotal: 50_000 }), cancelled(70_000), cancelled(30_000)]);
    expect(s).toMatchObject({ netSpend: 150_000, refundTotal: 100_000, excludedCount: 2 });
  });

  it('treats a missing refundAmount (old cache) as zero', () => {
    const old = makeOrder({ statusCode: 12, subTotal: 0 });
    delete old.refundAmount;
    expect(computeStats([old])).toMatchObject({ refundTotal: 0, excludedCount: 1 });
  });
});

describe('computeStats: estimated savings', () => {
  it('is items total minus amount paid, per included order', () => {
    const s = computeStats([
      makeOrder({ itemsTotal: 175_000, subTotal: 140_000 }),
      makeOrder({ itemsTotal: 100_000, subTotal: 100_000 }),
    ]);
    expect(s.estimatedSavings).toBe(35_000);
  });

  it('floors each order at zero when shipping pushes the paid amount above the items total', () => {
    const s = computeStats([
      makeOrder({ itemsTotal: 100_000, subTotal: 130_000 }),
      makeOrder({ itemsTotal: 100_000, subTotal: 90_000 }),
    ]);
    expect(s.estimatedSavings).toBe(10_000);
  });

  it('ignores excluded orders and orders without an items total', () => {
    const s = computeStats([
      { ...cancelled(100_000), itemsTotal: 100_000 },
      makeOrder({ subTotal: 10_000 }),
    ]);
    expect(s.estimatedSavings).toBe(0);
  });
});

describe('computeStats: buying habits', () => {
  it('picks the weekday and hour with the most orders', () => {
    // 2025-01-15 is a Wednesday, 2025-01-17 a Friday.
    const s = computeStats([
      makeOrder({ deliveryDate: at(2025, 1, 17, 10) }),
      makeOrder({ deliveryDate: at(2025, 1, 17, 10) }),
      makeOrder({ deliveryDate: at(2025, 1, 15, 21) }),
    ]);
    expect(s.busiestWeekday).toBe(5);
    expect(s.busiestHour).toBe(10);
  });

  it('breaks ties toward the earlier weekday (Monday first) and earlier hour', () => {
    // 2025-01-19 is a Sunday, 2025-01-20 a Monday.
    const s = computeStats([
      makeOrder({ deliveryDate: at(2025, 1, 19, 20) }),
      makeOrder({ deliveryDate: at(2025, 1, 20, 8) }),
    ]);
    expect(s.busiestWeekday).toBe(1);
    expect(s.busiestHour).toBe(8);
  });

  it('ignores orders without a date for habit stats', () => {
    const s = computeStats([makeOrder({ deliveryDate: null, orderMonth: null, orderYear: null })]);
    expect(s.busiestWeekday).toBeNull();
    expect(s.busiestHour).toBeNull();
    expect(s.longestMonthStreak).toBe(0);
  });

  it('finds the longest run of consecutive months with an order, across a year boundary', () => {
    const m = (y: number, mo: number) => makeOrder({ deliveryDate: at(y, mo, 5), orderMonth: mo, orderYear: y });
    const s = computeStats([m(2024, 11), m(2024, 12), m(2025, 1), m(2025, 1), m(2025, 3)]);
    expect(s.longestMonthStreak).toBe(3);
  });

  it('computes daily spend rate over the span from first to last order, inclusive', () => {
    const s = computeStats([
      makeOrder({ deliveryDate: at(2025, 1, 1), subTotal: 100_000 }),
      makeOrder({ deliveryDate: at(2025, 1, 10), subTotal: 200_000 }),
    ]);
    expect(s.dailySpendRate).toBe(30_000);
  });
});

describe('computeStats: products', () => {
  const withItems = (items: Order['items']) => makeOrder({ items });

  it('ranks products by total quantity bought, then by name', () => {
    const s = computeStats([
      withItems([{ name: 'Cap sac', quantity: 2, unitPrice: 20_000 }]),
      withItems([{ name: 'Cap sac', quantity: 3, unitPrice: 25_000 }, { name: 'Bao tay', quantity: 5, unitPrice: 10_000 }]),
      withItems([{ name: 'Op lung', quantity: 1, unitPrice: 90_000 }]),
    ]);
    expect(s.topByQuantity).toEqual([
      { name: 'Bao tay', quantity: 5 },
      { name: 'Cap sac', quantity: 5 },
      { name: 'Op lung', quantity: 1 },
    ]);
  });

  it('ranks the priciest products by the highest unit price paid', () => {
    const s = computeStats([
      withItems([{ name: 'Cap sac', quantity: 1, unitPrice: 20_000 }, { name: 'Tai nghe', quantity: 1, unitPrice: 900_000 }]),
      withItems([{ name: 'Cap sac', quantity: 1, unitPrice: 30_000 }]),
    ]);
    expect(s.priciest).toEqual([
      { name: 'Tai nghe', unitPrice: 900_000 },
      { name: 'Cap sac', unitPrice: 30_000 },
    ]);
  });

  it('limits each product list to ten entries and skips excluded orders', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `P${i}`, quantity: 1, unitPrice: 1000 + i }));
    const s = computeStats([withItems(many), { ...cancelled(1), items: [{ name: 'Gone', quantity: 99, unitPrice: 1 }] }]);
    expect(s.topByQuantity).toHaveLength(10);
    expect(s.priciest).toHaveLength(10);
    expect(s.topByQuantity.map(p => p.name)).not.toContain('Gone');
  });
});

describe('needsRescan', () => {
  it('flags a cache whose orders lack refundAmount', () => {
    const old = makeOrder();
    delete old.refundAmount;
    expect(needsRescan([makeOrder(), old])).toBe(true);
  });

  it('is false for a current cache and for an empty one', () => {
    expect(needsRescan([makeOrder()])).toBe(false);
    expect(needsRescan([])).toBe(false);
  });
});
