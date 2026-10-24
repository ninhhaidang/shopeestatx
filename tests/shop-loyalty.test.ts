import { describe, expect, it } from 'vitest';
import { analyzeShopLoyalty } from '../src/dashboard/shop-loyalty';
import { makeOrder } from './support/orders';

const alpha = (date: string, overrides = {}) => makeOrder(date, { shopName: 'a - Alpha', subTotal: 100_000, ...overrides });

describe('analyzeShopLoyalty', () => {
  it('keeps only shops with at least 3 orders', () => {
    const orders = [alpha('2026-10-01T10:00:00'), alpha('2026-10-02T10:00:00'), makeOrder('2026-10-03T10:00:00', { shopName: 'b - Beta' })];
    expect(analyzeShopLoyalty(orders)).toEqual([]);
  });

  it('summarises a repeat shop: count, spend, average, first and last order and orders per month', () => {
    const orders = [alpha('2026-08-05T10:00:00'), alpha('2026-09-05T10:00:00', { subTotal: 200_000 }), alpha('2026-10-05T10:00:00', { subTotal: 300_000 })];
    expect(analyzeShopLoyalty(orders)).toEqual([
      { shopName: 'Alpha', orderCount: 3, totalSpent: 600_000, firstOrder: '2026-08-05', lastOrder: '2026-10-05', avgOrderValue: 200_000, repeatRate: 1 },
    ]);
  });

  it('ignores cancelled and returned orders', () => {
    const orders = [alpha('2026-10-01T10:00:00'), alpha('2026-10-02T10:00:00'), alpha('2026-10-03T10:00:00', { statusCode: 4 }), alpha('2026-10-04T10:00:00', { statusCode: 12 })];
    expect(analyzeShopLoyalty(orders)).toEqual([]);
  });

  it('caps the span at 12 months and lists the busiest shops first', () => {
    const many = (shop: string, n: number) => Array.from({ length: n }, (_, i) => makeOrder(`2024-0${1 + (i % 9)}-10T10:00:00`, { shopName: `x - ${shop}` }));
    const result = analyzeShopLoyalty([...many('Few', 3), ...many('Many', 9)]);
    expect(result.map(s => s.shopName)).toEqual(['Many', 'Few']);
    expect(result[0].repeatRate).toBe(1); // 9 orders over 9 months
  });
});
