// Shop naming shared by the figures that group orders per shop (pure)
import type { Order } from '../types/index.js';

/** "user - Shop name" is shown as "Shop name". */
export const shopDisplayName = (shopName: string): string => {
  const separator = shopName.indexOf(' - ');
  return separator < 0 ? shopName : shopName.slice(separator + 3) || shopName;
};

/** Stable seller ID, falling back to the username retained in historical shop labels. */
export function shopIdentity(order: Pick<Order, 'shopName' | 'shopId'>): string {
  return order.shopId ? `id:${order.shopId}` : `username:${shopUsername(order.shopName)}`;
}

/** The "user" part of "user - Shop name". */
export function shopUsername(shopName: string): string {
  const separator = shopName.indexOf(' - ');
  return separator < 0 ? shopName : shopName.slice(0, separator);
}
