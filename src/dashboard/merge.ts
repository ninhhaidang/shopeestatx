// Merge a fresh Shopee scan into the cached orders (pure)
import type { OrderData } from '../types/index.js';
import { isExcludedOrder } from './order-status.js';

/**
 * Fresh orders win; cached orders the scan did not return are kept. `added` counts orders not seen before.
 */
export function mergeOrderData(
  cached: OrderData | null,
  fresh: OrderData,
  now: Date,
): { data: OrderData; added: number } {
  const cachedOrders = cached?.orders ?? [];
  const cachedIds = new Set(cachedOrders.map(o => String(o.orderId)));
  const freshIds = new Set(fresh.orders.map(o => String(o.orderId)));

  const orders = [...fresh.orders, ...cachedOrders.filter(o => !freshIds.has(String(o.orderId)))];
  const totalAmount = orders.filter(o => !isExcludedOrder(o)).reduce((s, o) => s + o.subTotal, 0);

  return {
    added: fresh.orders.filter(o => !cachedIds.has(String(o.orderId))).length,
    data: {
      ...fresh,
      orders,
      totalCount: orders.reduce((s, o) => s + o.productCount, 0),
      totalAmount,
      totalAmountFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount),
      cachedAt: now.toISOString(),
    },
  };
}
