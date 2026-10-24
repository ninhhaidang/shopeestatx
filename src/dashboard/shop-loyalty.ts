// Shop loyalty analysis: repeat-purchase metrics per shop (pure)
import type { Order } from '../types/index.js';
import { isExcludedOrder } from './order-status.js';
import { shopDisplayName } from './shop.js';

export interface ShopLoyalty {
  shopName: string;
  orderCount: number;
  totalSpent: number;
  firstOrder: string;   // YYYY-MM-DD
  lastOrder: string;    // YYYY-MM-DD
  avgOrderValue: number;
  repeatRate: number;   // orders per month (over the data span, at most 12 months)
}

const MIN_ORDERS = 3;
const MAX_SHOPS = 10;
const MAX_SPAN_MONTHS = 12;

/** Shops with at least 3 orders that count towards spend, most orders first. */
export function analyzeShopLoyalty(allOrders: Order[]): ShopLoyalty[] {
  const shopMap: Record<string, { orders: number; spent: number; dates: string[] }> = {};

  for (const o of allOrders.filter(o => !isExcludedOrder(o))) {
    const shop = shopDisplayName(o.shopName);
    if (!shopMap[shop]) shopMap[shop] = { orders: 0, spent: 0, dates: [] };
    shopMap[shop].orders += 1;
    shopMap[shop].spent += o.subTotal;
    if (o.deliveryDate) shopMap[shop].dates.push(o.deliveryDate.substring(0, 10));
  }

  return Object.entries(shopMap)
    .filter(([, v]) => v.orders >= MIN_ORDERS)
    .map(([shopName, v]) => {
      const sorted = [...v.dates].sort();
      const firstOrder = sorted[0] ?? '';
      const lastOrder = sorted[sorted.length - 1] ?? '';
      // Divide by the real span (capped at 12 months), not always by 12.
      let monthsSpan = 1;
      if (firstOrder && lastOrder && firstOrder !== lastOrder) {
        const f = new Date(firstOrder), l = new Date(lastOrder);
        monthsSpan = Math.min(
          Math.max((l.getFullYear() - f.getFullYear()) * 12 + (l.getMonth() - f.getMonth()) + 1, 1),
          MAX_SPAN_MONTHS,
        );
      }
      return {
        shopName,
        orderCount: v.orders,
        totalSpent: v.spent,
        firstOrder,
        lastOrder,
        avgOrderValue: Math.round(v.spent / v.orders),
        repeatRate: parseFloat((v.orders / monthsSpan).toFixed(1)),
      };
    })
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, MAX_SHOPS);
}
