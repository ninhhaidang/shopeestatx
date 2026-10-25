// Merge a fresh Shopee scan into the cached orders (pure)
import { formatCurrency } from '../i18n/format.js';
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
  const cachedById = new Map(cached?.orders.map(o => [String(o.orderId), { ...o, orderId: String(o.orderId) }]));
  const freshById = new Map(fresh.orders.map(o => [String(o.orderId), { ...o, orderId: String(o.orderId) }]));
  const orders = [...freshById.values(), ...[...cachedById.values()].filter(o => !freshById.has(o.orderId))];
  const totalAmount = orders.filter(o => !isExcludedOrder(o)).reduce((s, o) => s + o.subTotal, 0);

  return {
    added: [...freshById.keys()].filter(id => !cachedById.has(id)).length,
    data: {
      ...fresh,
      user: fresh.user ?? cached?.user,
      orders,
      totalCount: orders.reduce((s, o) => s + o.productCount, 0),
      totalAmount,
      totalAmountFormatted: formatCurrency(totalAmount),
      cachedAt: now.toISOString(),
    },
  };
}
