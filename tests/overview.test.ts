import { describe, expect, it } from 'vitest';
import { computeOverview, monthChange } from '../src/dashboard/overview';
import { makeOrder } from './support/orders';

describe('computeOverview', () => {
  const orders = [
    makeOrder('2026-08-10T10:00:00', { subTotal: 300_000, shopName: 'a - Alpha', productCount: 2 }),
    makeOrder('2026-09-05T10:00:00', { subTotal: 100_000, shopName: 'b - Beta', productCount: 1 }),
    makeOrder('2026-09-20T10:00:00', { subTotal: 200_000, shopName: 'a - Alpha', productCount: 3 }),
    makeOrder('2026-09-21T10:00:00', { subTotal: 900_000, statusCode: 4, refundAmount: 900_000, shopName: 'c - Gamma' }),
  ];

  it('counts only non-excluded orders and averages their net spend', () => {
    const o = computeOverview(orders);
    expect(o.orderCount).toBe(3);
    expect(o.stats.netSpend).toBe(600_000);
    expect(o.averageOrderValue).toBe(200_000);
    expect(o.stats.refundTotal).toBe(900_000);
  });

  it('averages to zero without orders', () => {
    expect(computeOverview([]).averageOrderValue).toBe(0);
  });

  it('totals spend per month, oldest first, ignoring excluded orders', () => {
    expect(computeOverview(orders).monthly).toEqual([
      { label: '8/2026', total: 300_000 },
      { label: '9/2026', total: 300_000 },
    ]);
  });

  it('orders months chronologically across years', () => {
    const o = computeOverview([
      makeOrder('2026-01-10T10:00:00'),
      makeOrder('2025-12-10T10:00:00'),
    ]);
    expect(o.monthly.map(m => m.label)).toEqual(['12/2025', '1/2026']);
  });

  it('ranks shops by spend using the shop display name', () => {
    expect(computeOverview(orders).topShops).toEqual([
      { name: 'Alpha', amount: 500_000, orders: 2, products: 5 },
      { name: 'Beta', amount: 100_000, orders: 1, products: 1 },
    ]);
  });

  it('keeps only the five biggest shops', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      makeOrder('2026-09-05T10:00:00', { subTotal: (i + 1) * 1000, shopName: `s${i} - Shop ${i}` }));
    const shops = computeOverview(many).topShops;
    expect(shops).toHaveLength(5);
    expect(shops[0].name).toBe('Shop 6');
  });
});

describe('monthChange', () => {
  const orders = [
    makeOrder('2026-09-10T10:00:00', { subTotal: 200_000 }),
    makeOrder('2026-10-02T10:00:00', { subTotal: 300_000 }),
    makeOrder('2026-10-03T10:00:00', { subTotal: 400_000, statusCode: 12, refundAmount: 400_000 }),
  ];

  it('compares the anchor month with the one before, as a percentage', () => {
    expect(monthChange(orders, new Date(2026, 9, 24))).toEqual({ label: '10/2026', previousLabel: '9/2026', current: 300_000, previous: 200_000, percent: 50 });
  });

  it('rounds to one decimal', () => {
    const o = [makeOrder('2026-09-10T10:00:00', { subTotal: 300_000 }), makeOrder('2026-10-02T10:00:00', { subTotal: 400_000 })];
    expect(monthChange(o, new Date(2026, 9, 24)).percent).toBe(33.3);
  });

  it('has no percentage when the previous month had no spend', () => {
    expect(monthChange(orders, new Date(2026, 10, 5))).toEqual({ label: '11/2026', previousLabel: '10/2026', current: 0, previous: 300_000, percent: -100 });
    expect(monthChange(orders, new Date(2026, 8, 5)).percent).toBeNull();
  });

  it('looks back across the year boundary', () => {
    const o = [makeOrder('2025-12-10T10:00:00', { subTotal: 100_000 }), makeOrder('2026-01-10T10:00:00', { subTotal: 50_000 })];
    expect(monthChange(o, new Date(2026, 0, 20)).percent).toBe(-50);
  });
});
