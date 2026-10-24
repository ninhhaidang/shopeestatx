// Pure order search and sort for the Đơn hàng screen
import type { Order, SortDirection } from '../types/index.js';

export function sortOrders(orders: Order[], field: string, direction: SortDirection): Order[] {
  return [...orders].sort((a, b) => {
    let aVal: number;
    let bVal: number;

    switch (field) {
      case 'deliveryDate':
        aVal = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        bVal = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
        break;
      case 'subTotal':
        aVal = a.subTotal || 0;
        bVal = b.subTotal || 0;
        break;
      case 'status':
        aVal = a.statusCode || 0;
        bVal = b.statusCode || 0;
        break;
      default:
        return 0;
    }

    if (aVal === bVal) return 0;
    return direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });
}

/** Status code (null = any) and lower-cased search term against order id, product, shop, summary and status. */
export function matchesStatusAndSearch(order: Order, status: number | null, searchTerm: string): boolean {
  if (status !== null && order.statusCode !== status) return false;
  if (!searchTerm) return true;
  const searchableText = [order.orderId?.toString(), order.name, order.shopName, order.productSummary, order.status]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return searchableText.includes(searchTerm);
}
