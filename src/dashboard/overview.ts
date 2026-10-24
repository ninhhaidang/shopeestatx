// Figures for the Tổng quan screen (pure). Spend totals come from computeStats; this adds the
// groupings the screen needs (per month, per shop, month over month) so no UI code sums orders.
import type { Order } from '../types/index.js';
import { monthOf, monthSpend } from './month.js';
import { isExcludedOrder } from './order-status.js';
import { computeStats, type Stats } from './stats.js';

const TOP_SHOP_LIMIT = 5;

export interface MonthTotal {
  /** "9/2026" */
  label: string;
  total: number;
}

export interface ShopTotal {
  name: string;
  amount: number;
  orders: number;
  products: number;
}

export interface Overview {
  stats: Stats;
  /** Orders that count towards spend (cancelled and returned ones are left out). */
  orderCount: number;
  averageOrderValue: number;
  monthly: MonthTotal[];
  topShops: ShopTotal[];
}

/** "user - Shop name" is shown as "Shop name". */
const shopDisplayName = (shopName: string) => shopName.split(' - ')[1] || shopName;

export function computeOverview(orders: Order[]): Overview {
  const included = orders.filter(o => !isExcludedOrder(o));
  const stats = computeStats(orders);

  const byMonth = new Map<number, MonthTotal>();
  const byShop = new Map<string, ShopTotal>();
  for (const o of included) {
    const m = monthOf(o);
    if (m) {
      const sortKey = m.year * 12 + m.month;
      const entry = byMonth.get(sortKey) ?? { label: `${m.month}/${m.year}`, total: 0 };
      entry.total += o.subTotal;
      byMonth.set(sortKey, entry);
    }
    const name = shopDisplayName(o.shopName);
    const shop = byShop.get(name) ?? { name, amount: 0, orders: 0, products: 0 };
    shop.amount += o.subTotal;
    shop.orders += 1;
    shop.products += o.productCount;
    byShop.set(name, shop);
  }

  return {
    stats,
    orderCount: included.length,
    averageOrderValue: included.length ? stats.netSpend / included.length : 0,
    monthly: [...byMonth].sort((a, b) => a[0] - b[0]).map(([, m]) => m),
    topShops: [...byShop.values()].sort((a, b) => b.amount - a.amount).slice(0, TOP_SHOP_LIMIT),
  };
}

export interface MonthChange {
  /** "10/2026": the month `current` is about. */
  label: string;
  /** "9/2026": the month it is compared with. */
  previousLabel: string;
  current: number;
  previous: number;
  /** Rounded to one decimal; null when the previous month had no spend to compare with. */
  percent: number | null;
}

/** Net spend of the month containing `anchor` against the month before it. */
export function monthChange(orders: Order[], anchor: Date): MonthChange {
  const month = anchor.getMonth() + 1;
  const year = anchor.getFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const current = monthSpend(orders, month, year);
  const previous = monthSpend(orders, prevMonth, prevYear);
  return {
    label: `${month}/${year}`,
    previousLabel: `${prevMonth}/${prevYear}`,
    current,
    previous,
    percent: previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null,
  };
}
