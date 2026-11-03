// Merge a fresh Shopee scan into the cached orders (pure)
import { formatCurrency } from '../i18n/format.js';
import type { Order, OrderData } from '../types/index.js';
import { deliveryDateOf } from './delivery-date.js';
import { isExcludedOrder } from './order-status.js';

/** Keep `deliveryDate` either a real timestamp or null; junk stored by an older cache becomes unknown. */
function withUsableDeliveryDate(order: Order): Order {
  if (deliveryDateOf(order)) return order;
  return order.deliveryDate == null && order.orderMonth == null && order.orderYear == null
    ? order
    : { ...order, deliveryDate: null, orderMonth: null, orderYear: null };
}

/**
 * Fresh orders win; cached orders the scan did not return are kept. `added` counts orders not seen before.
 */
export function mergeOrderData(
  cached: OrderData | null,
  fresh: OrderData,
  now: Date,
): { data: OrderData; added: number } {
  const byId = (order: Order) => withUsableDeliveryDate({ ...order, orderId: String(order.orderId) });
  const cachedById = new Map(cached?.orders.map(o => [String(o.orderId), byId(o)]));
  const freshById = new Map(fresh.orders.map(o => [String(o.orderId), byId(o)]));
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
