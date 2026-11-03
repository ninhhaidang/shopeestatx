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
    expect(sortOrders(orders, 'deliveryDate', 'asc').map(o => o.orderId)).toEqual(['invalid', 'undated', 'early', 'late']);
    expect(sortOrders(orders, 'deliveryDate', 'desc').map(o => o.orderId)).toEqual(['late', 'early', 'invalid', 'undated']);
  });
});
