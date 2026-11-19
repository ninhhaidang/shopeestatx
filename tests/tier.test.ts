import { describe, expect, it } from 'vitest';
import { tierBetween } from '../src/dashboard/tier';
import { makeOrder } from './support/orders';

/** `n` orders of `each` đồng delivered on the given day. */
const orders = (n: number, each: number, date = '2026-03-10T10:00:00') => Array.from({ length: n }, () => makeOrder(date, { subTotal: each }));
const all = (list: ReturnType<typeof orders>) => tierBetween(list, null, null);
const H1_2025 = '2025-03-10T10:00:00';
const H2_2025 = '2025-09-10T10:00:00';
const diamond = (date: string) => orders(75, 200_000, date);
const gold = (date: string) => orders(20, 250_000, date);

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
    expect(all([...list])).toBe(tier);
  });

  it('counts each half-year cycle from zero', () => {
    // 2 + 2 orders either side of 1/7 reach no tier.
    expect(all([...orders(2, 600_000, '2026-06-30T10:00:00'), ...orders(2, 600_000, '2026-07-01T10:00:00')])).toBeNull();
  });

  it('keeps Kim Cương into the next cycle, and loses it once a cycle falls short', () => {
    const history = [...diamond(H1_2025), ...diamond(H2_2025), ...orders(2, 100_000, '2026-02-10T10:00:00')];
    // Kim Cương met in both halves of 2025, so H1 2026 starts at Kim Cương even with two orders.
    expect(tierBetween(history, new Date(2026, 0, 1), new Date(2026, 5, 30))).toBe('diamond');
    // H1 2026 fell short (nothing reached), so H2 2026 starts below Bạc.
    expect(tierBetween(history, new Date(2026, 6, 1), new Date(2026, 11, 31))).toBeNull();
  });

  it('starts one step lower after any other tier', () => {
    // Vàng in H1 2025, nothing after: H2 2025 starts at Bạc, H1 2026 below Bạc.
    expect(tierBetween(gold(H1_2025), new Date(2025, 6, 1), new Date(2025, 11, 31))).toBe('silver');
    expect(tierBetween(gold(H1_2025), new Date(2026, 0, 1), new Date(2026, 5, 30))).toBeNull();
    // A Kim Cương cycle that only reaches Vàng next time: held Kim Cương, then Bạc after.
    const slipping = [...diamond(H1_2025), ...gold(H2_2025)];
    expect(tierBetween(slipping, new Date(2025, 6, 1), new Date(2025, 11, 31))).toBe('diamond');
    expect(tierBetween(slipping, new Date(2026, 0, 1), new Date(2026, 5, 30))).toBe('silver');
  });

  it('shows the best tier held inside the range, not before it', () => {
    const history = [...diamond(H1_2025), ...orders(3, 400_000, '2026-09-10T10:00:00')];
    expect(tierBetween(history, new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe('silver');
    expect(tierBetween(history, null, null)).toBe('diamond');
  });

  it('leaves out cancelled and undated orders', () => {
    const cancelled = makeOrder('2026-03-10T10:00:00', { subTotal: 900_000, statusCode: 4 });
    expect(all([...orders(2, 600_000), cancelled, makeOrder(null, { subTotal: 900_000 })])).toBeNull();
  });
});
