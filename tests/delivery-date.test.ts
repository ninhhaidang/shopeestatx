import { describe, expect, it } from 'vitest';
import { deliveryDateOf, deliveryTimeOf, formatDeliveryDate } from '../src/dashboard/delivery-date';
import { makeOrder } from './support/orders';

describe('delivery date validity', () => {
  it('returns the stored timestamp for a parseable date', () => {
    const order = makeOrder('2026-10-01T12:00:00');
    expect(deliveryTimeOf(order)).toBe(new Date('2026-10-01T12:00:00').getTime());
    expect(deliveryDateOf(order)?.toISOString()).toBe(new Date('2026-10-01T12:00:00').toISOString());
  });

  it('treats an undated order as having no delivery date', () => {
    const order = makeOrder(null);
    expect(deliveryTimeOf(order)).toBeNull();
    expect(deliveryDateOf(order)).toBeNull();
  });

  it('treats an unparseable stored date as having no delivery date', () => {
    const order = makeOrder(null, { deliveryDate: 'not-a-date' });
    expect(deliveryTimeOf(order)).toBeNull();
    expect(deliveryDateOf(order)).toBeNull();
    expect(formatDeliveryDate(order, 'Chưa có')).toBe('Chưa có');
  });

  it('formats a usable date locally instead of the fallback', () => {
    expect(formatDeliveryDate(makeOrder('2026-10-01T12:00:00'), 'Chưa có')).toBe('1/10/2026');
  });
});
