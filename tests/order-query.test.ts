import { describe, expect, it } from 'vitest';
import { sortOrders } from '../src/dashboard/order-query';
import { makeOrder } from './support/orders';

describe('delivery date sorting', () => {
  it('treats invalid dates as undated without disrupting chronological order', () => {
    const invalid = makeOrder(null, { orderId: 'invalid', deliveryDate: 'not-a-date' });
    const undated = makeOrder(null, { orderId: 'undated' });
    const early = makeOrder('2026-09-01T12:00:00', { orderId: 'early' });
    const late = makeOrder('2026-10-01T12:00:00', { orderId: 'late' });
    const orders = [early, invalid, late, undated];

    const asc = sortOrders(orders, 'deliveryDate', 'asc').map(o => o.orderId);
    expect(asc.slice(0, 2)).toEqual(expect.arrayContaining(['invalid', 'undated']));
    expect(asc.slice(2)).toEqual(['early', 'late']);

    const desc = sortOrders(orders, 'deliveryDate', 'desc').map(o => o.orderId);
    expect(desc.slice(0, 2)).toEqual(['late', 'early']);
    expect(desc.slice(2)).toEqual(expect.arrayContaining(['invalid', 'undated']));
  });
});
