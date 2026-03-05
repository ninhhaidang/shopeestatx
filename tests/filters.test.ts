import { describe, it, expect } from 'vitest';
import { sortOrders } from '../src/dashboard/filters';
import type { Order } from '../src/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '123',
    name: 'Test Product',
    productCount: 1,
    subTotal: 100000,
    subTotalFormatted: '100.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'test - Test Shop',
    productSummary: 'Test Product (SL: 1)',
    deliveryDate: '2025-01-15T00:00:00.000Z',
    orderMonth: 1,
    orderYear: 2025,
    ...overrides,
  };
}

describe('sortOrders', () => {
  const orders: Order[] = [
    makeOrder({ subTotal: 300000, deliveryDate: '2025-03-01T00:00:00.000Z', statusCode: 3 }),
    makeOrder({ subTotal: 100000, deliveryDate: '2025-01-01T00:00:00.000Z', statusCode: 7 }),
    makeOrder({ subTotal: 200000, deliveryDate: '2025-02-01T00:00:00.000Z', statusCode: 4 }),
  ];

  it('sorts by subTotal ascending', () => {
    const sorted = sortOrders(orders, 'subTotal', 'asc');
    expect(sorted[0].subTotal).toBe(100000);
    expect(sorted[1].subTotal).toBe(200000);
    expect(sorted[2].subTotal).toBe(300000);
  });

  it('sorts by subTotal descending', () => {
    const sorted = sortOrders(orders, 'subTotal', 'desc');
    expect(sorted[0].subTotal).toBe(300000);
    expect(sorted[2].subTotal).toBe(100000);
  });

  it('sorts by deliveryDate ascending', () => {
    const sorted = sortOrders(orders, 'deliveryDate', 'asc');
    expect(sorted[0].deliveryDate).toContain('2025-01');
    expect(sorted[2].deliveryDate).toContain('2025-03');
  });

  it('sorts by deliveryDate descending', () => {
    const sorted = sortOrders(orders, 'deliveryDate', 'desc');
    expect(sorted[0].deliveryDate).toContain('2025-03');
    expect(sorted[2].deliveryDate).toContain('2025-01');
  });

  it('sorts by status (statusCode) ascending', () => {
    const sorted = sortOrders(orders, 'status', 'asc');
    expect(sorted[0].statusCode).toBe(3);
    expect(sorted[2].statusCode).toBe(7);
  });

  it('handles null deliveryDate in sort', () => {
    const withNull = [
      makeOrder({ deliveryDate: null }),
      makeOrder({ deliveryDate: '2025-06-01T00:00:00.000Z' }),
    ];
    const sorted = sortOrders(withNull, 'deliveryDate', 'asc');
    expect(sorted[0].deliveryDate).toBeNull();
    expect(sorted[1].deliveryDate).toContain('2025-06');
  });

  it('returns original order for unknown field', () => {
    const sorted = sortOrders(orders, 'unknown', 'asc');
    expect(sorted).toHaveLength(3);
  });

  it('does not mutate original array', () => {
    const original = [...orders];
    sortOrders(orders, 'subTotal', 'asc');
    expect(orders[0].subTotal).toBe(original[0].subTotal);
  });
});
