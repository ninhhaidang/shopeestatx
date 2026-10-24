import { describe, expect, it } from 'vitest';
import { mergeOrderData } from '../src/dashboard/merge';
import { makeData, makeOrder } from './support/orders';

const NOW = new Date('2026-10-24T09:00:00.000Z');

describe('mergeOrderData', () => {
  const kept = makeOrder('2026-09-01T10:00:00', { orderId: 'A', subTotal: 100_000 });
  const stale = makeOrder('2026-08-01T10:00:00', { orderId: 'OLD', subTotal: 50_000 });
  const fresh = makeOrder('2026-10-01T10:00:00', { orderId: 'NEW', subTotal: 70_000 });
  const cancelled = makeOrder('2026-10-02T10:00:00', { orderId: 'X', subTotal: 999, statusCode: 4 });

  it('takes fresh orders, keeps cached ones the scan no longer returns, and counts the new ones', () => {
    const cached = makeData([kept, stale]);
    const { data, added } = mergeOrderData(cached, makeData([{ ...kept }, fresh]), NOW);

    expect(data.orders.map(o => o.orderId)).toEqual(['A', 'NEW', 'OLD']);
    expect(added).toBe(1);
  });
  it('preserves cached user profile when fresh scan has no user', () => {
    const cached = { ...makeData([kept]), user: { name: 'cached_user', avatar: 'https://avatar' } };
    const freshWithoutUser: OrderData = { ...makeData([fresh]), user: undefined };
    const { data } = mergeOrderData(cached, freshWithoutUser, NOW);

    expect(data.user).toEqual({ name: 'cached_user', avatar: 'https://avatar' });
  });

  it('recomputes totals without cancelled or returned orders and stamps the cache time', () => {
    const { data } = mergeOrderData(null, makeData([kept, cancelled]), NOW);

    expect(data.totalAmount).toBe(100_000);
    expect(data.totalCount).toBe(2);
    expect(data.cachedAt).toBe('2026-10-24T09:00:00.000Z');
    expect(data.totalAmountFormatted).toContain('100.000');
  });

  it('treats a first scan as all new', () => {
    expect(mergeOrderData(null, makeData([kept, fresh]), NOW).added).toBe(2);
  });
});
