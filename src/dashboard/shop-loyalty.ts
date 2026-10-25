// Shop loyalty analysis: repeat-purchase metrics per shop (pure)
import type { Order } from '../types/index.js';
import { isExcludedOrder } from './order-status.js';
import { shopDisplayName, shopIdentity } from './shop.js';
import { localDateKey } from './month.js';

export interface ShopLoyalty {
  shopKey: string;
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
  const shopMap = new Map<string, { name: string; orders: number; spent: number; dates: string[] }>();

  for (const o of allOrders.filter(o => !isExcludedOrder(o))) {
    const key = shopIdentity(o);
    const shop = shopMap.get(key) ?? { name: shopDisplayName(o.shopName), orders: 0, spent: 0, dates: [] };
    shop.orders += 1;
    shop.spent += o.subTotal;
    const date = o.deliveryDate ? new Date(o.deliveryDate) : null;
    if (date && !Number.isNaN(date.getTime())) shop.dates.push(localDateKey(date));
    shopMap.set(key, shop);
  }

  return [...shopMap]
    .filter(([, v]) => v.orders >= MIN_ORDERS)
    .map(([shopKey, v]) => {
      const sorted = [...v.dates].sort();
      const firstOrder = sorted[0] ?? '';
      const lastOrder = sorted[sorted.length - 1] ?? '';
      // Divide by the real span (capped at 12 months), not always by 12.
      let monthsSpan = 1;
      if (firstOrder && lastOrder && firstOrder !== lastOrder) {
        const [firstYear, firstMonth] = firstOrder.split('-').map(Number);
        const [lastYear, lastMonth] = lastOrder.split('-').map(Number);
        monthsSpan = Math.min(
          Math.max((lastYear - firstYear) * 12 + lastMonth - firstMonth + 1, 1),
          MAX_SPAN_MONTHS,
        );
      }
      return {
        shopKey,
        shopName: v.name,
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
