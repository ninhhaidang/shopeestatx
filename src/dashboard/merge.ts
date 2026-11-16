// Merge a fresh Shopee scan into the cached orders (pure)
import type { Order, OrderData } from '../types/index.js';
import { deliveryDateOf } from './delivery-date.js';
import { isExcludedOrder } from './order-status.js';
import { shopUsername } from './shop.js';

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
  const all = [...freshById.values(), ...[...cachedById.values()].filter(o => !freshById.has(o.orderId))];
  // Older caches have no seller ID; borrow it from an order of the same username so one shop stays one group.
  const idByUsername = new Map(all.filter(o => o.shopId && shopUsername(o.shopName)).map(o => [shopUsername(o.shopName), o.shopId]));
  const orders = all.map(o => {
    const shopId = o.shopId ? undefined : idByUsername.get(shopUsername(o.shopName));
    return shopId ? { ...o, shopId } : o;
  });
  const totalAmount = orders.filter(o => !isExcludedOrder(o)).reduce((s, o) => s + o.subTotal, 0);

  return {
    added: [...freshById.keys()].filter(id => !cachedById.has(id)).length,
    data: {
      ...fresh,
      user: fresh.user ?? cached?.user,
      orders,
      totalCount: orders.reduce((s, o) => s + o.productCount, 0),
      totalAmount,
      cachedAt: now.toISOString(),
    },
  };
}
