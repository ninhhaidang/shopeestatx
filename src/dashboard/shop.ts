// Shop naming shared by the figures that group orders per shop (pure)
import type { Order } from '../types/index.js';

/** "user - Shop name" is shown as "Shop name". */
export const shopDisplayName = (shopName: string): string => {
  const separator = shopName.indexOf(' - ');
  return separator < 0 ? shopName : shopName.slice(separator + 3) || shopName;
};

/** Stable seller ID, falling back to the username retained in historical shop labels. */
export function shopIdentity(order: Pick<Order, 'shopName' | 'shopId'>): string {
  if (order.shopId) return `id:${order.shopId}`;
  const separator = order.shopName.indexOf(' - ');
  return `username:${separator < 0 ? order.shopName : order.shopName.slice(0, separator)}`;
}
