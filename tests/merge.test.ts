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
  });

  it('gives a legacy order the seller ID of a newer order from the same username', () => {
    const legacy = makeOrder('2026-10-01T10:00:00', { orderId: 'L', shopName: 'seller - Shop' });
    const other = makeOrder('2026-10-01T10:00:00', { orderId: 'O', shopName: 'other - Shop' });
    const scanned = makeOrder('2026-10-02T10:00:00', { orderId: 'S', shopName: 'seller - Shop', shopId: '17' });

    const { data } = mergeOrderData(makeData([legacy, other]), makeData([scanned]), NOW);

    expect(data.orders.map(o => [o.orderId, o.shopId])).toEqual([['S', '17'], ['L', '17'], ['O', undefined]]);
  });

  it('treats a first scan as all new', () => {
    expect(mergeOrderData(null, makeData([kept, fresh]), NOW).added).toBe(2);
  });

  it('turns an unusable stored delivery date into an unknown date', () => {
    const junk = makeOrder(null, { orderId: 'JUNK', deliveryDate: 'not-a-date', orderMonth: 9, orderYear: 2026 });
    const emptyString = makeOrder(null, { orderId: 'EMPTY', deliveryDate: '' });
    const sentinel = makeOrder(null, { orderId: 'SENTINEL', deliveryDate: '1970-01-01T00:00:00.000Z', orderMonth: 1, orderYear: 1970 });
    const stale = makeOrder(null, { orderId: 'STALE', deliveryDate: null, orderMonth: 9, orderYear: 2026 });
    const { data } = mergeOrderData(makeData([junk, emptyString, sentinel, stale]), makeData([]), NOW);

    const byId = new Map(data.orders.map(o => [o.orderId, o]));
    for (const id of ['JUNK', 'EMPTY', 'SENTINEL', 'STALE']) {
      expect(byId.get(id)).toMatchObject({ deliveryDate: null, orderMonth: null, orderYear: null });
    }
  });
});
