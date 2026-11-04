import { describe, expect, it } from 'vitest';
import { deliveryDateOf, deliveryTimeOf, formatDeliveryDate } from '../src/dashboard/delivery-date';
import { makeOrder } from './support/orders';

describe('delivery date validity', () => {
  it('returns the stored timestamp for a parseable date', () => {
    const order = makeOrder('2026-10-01T12:00:00');
    expect(deliveryTimeOf(order)).toBe(new Date('2026-10-01T12:00:00').getTime());
    expect(deliveryDateOf(order)?.getTime()).toBe(new Date('2026-10-01T12:00:00').getTime());
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

  it('treats the 1970-01-01 no-time sentinel as having no delivery date', () => {
    const order = makeOrder(null, { deliveryDate: '1970-01-01T00:00:00.000Z' });
    expect(deliveryTimeOf(order)).toBeNull();
    expect(deliveryDateOf(order)).toBeNull();
    expect(formatDeliveryDate(order, 'Chưa có')).toBe('Chưa có');
  });

  it('formats a usable date locally instead of the fallback', () => {
    const label = formatDeliveryDate(makeOrder('2026-10-01T12:00:00'), 'Chưa có');
    expect(label).toBe(new Date('2026-10-01T12:00:00').toLocaleDateString('vi-VN'));
    expect(label).not.toBe('Chưa có');
  });
});
