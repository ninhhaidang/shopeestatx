import type { Order, OrderData } from '../../src/types';

let seq = 0;

/** A completed order delivered on `date` (local time); override anything else. */
export function makeOrder(date: string | null, overrides: Partial<Order> = {}): Order {
  const d = date ? new Date(date) : null;
  seq += 1;
  return {
    orderId: String(1000 + seq),
    name: 'Sản phẩm',
    productCount: 1,
    subTotal: 100_000,
    subTotalFormatted: '',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'shop_a - Shop A',
    productSummary: '',
    deliveryDate: d ? d.toISOString() : null,
    orderMonth: d ? d.getMonth() + 1 : null,
    orderYear: d ? d.getFullYear() : null,
    refundAmount: 0,
    ...overrides,
  };
}

export function makeData(orders: Order[], overrides: Partial<OrderData> = {}): OrderData {
  return {
    orders,
    totalCount: orders.length,
    totalAmount: 0,
    totalAmountFormatted: '',
    fetchedAt: '2026-10-24T08:00:00.000Z',
    cachedAt: '2026-10-24T08:00:00.000Z',
    ...overrides,
  };
}
