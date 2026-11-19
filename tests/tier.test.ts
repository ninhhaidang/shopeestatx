import { describe, expect, it } from 'vitest';
import { bestTier } from '../src/dashboard/tier';
import { makeOrder } from './support/orders';

/** `n` orders of `each` đồng delivered on the given day. */
const orders = (n: number, each: number, date = '2026-03-10T10:00:00') => Array.from({ length: n }, () => makeOrder(date, { subTotal: each }));

describe('Shopee tier estimate', () => {
  it.each([
    [orders(2, 600_000), null],
    [orders(3, 300_000), null],
    [orders(3, 400_000), 'silver'],
    [orders(19, 300_000), 'silver'],
    [orders(20, 250_000), 'gold'],
    [orders(74, 300_000), 'gold'],
    [orders(75, 200_000), 'diamond'],
  ] as const)('needs both the order count and the spend', (list, tier) => {
    expect(bestTier([...list])).toBe(tier);
  });

  it('counts each half-year cycle on its own and keeps the best', () => {
    // 2 + 2 orders across 30/6 and 1/7 reach no tier; a later cycle with 3 does.
    expect(bestTier([...orders(2, 600_000, '2026-06-30T10:00:00'), ...orders(2, 600_000, '2026-07-01T10:00:00')])).toBeNull();
    expect(bestTier([...orders(20, 300_000, '2025-02-01T10:00:00'), ...orders(3, 400_000, '2026-08-01T10:00:00')])).toBe('gold');
  });

  it('leaves out cancelled, undated orders', () => {
    const cancelled = makeOrder('2026-03-10T10:00:00', { subTotal: 900_000, statusCode: 4 });
    expect(bestTier([...orders(2, 600_000), cancelled, makeOrder(null, { subTotal: 900_000 })])).toBeNull();
  });
});
