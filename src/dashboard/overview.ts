// Figures for the Tổng quan screen (pure). Spend totals come from computeStats; this adds the
// groupings the screen needs (per month, per shop, month over month) so no UI code sums orders.
import type { Order } from '../types/index.js';
import { deliveryDateOf } from './delivery-date.js';
import { monthOf, monthSpend, yearSpend } from './month.js';
import { isExcludedOrder } from './order-status.js';
import { shopDisplayName, shopIdentity } from './shop.js';
import { computeStats, type Stats } from './stats.js';

const TOP_SHOP_LIMIT = 5;

interface MonthTotal {
  /** "9/2026" */
  label: string;
  total: number;
}

interface ShopTotal {
  shopKey: string;
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
    const shopKey = shopIdentity(o);
    const shop = byShop.get(shopKey) ?? { shopKey, name, amount: 0, orders: 0, products: 0 };
    shop.amount += o.subTotal;
    shop.orders += 1;
    shop.products += o.productCount;
    byShop.set(shopKey, shop);
  }

  // Months without spend still get a zero bar, so the chart's time axis is even.
  const keys = [...byMonth.keys()];
  for (let key = Math.min(...keys); key < Math.max(...keys); key++) {
    const year = Math.floor((key - 1) / 12);
    if (!byMonth.has(key)) byMonth.set(key, { label: `${key - year * 12}/${year}`, total: 0 });
  }

  return {
    stats,
    orderCount: included.length,
    averageOrderValue: included.length ? stats.netSpend / included.length : 0,
    monthly: [...byMonth].sort((a, b) => a[0] - b[0]).map(([, m]) => m),
    topShops: [...byShop.values()].sort((a, b) => b.amount - a.amount).slice(0, TOP_SHOP_LIMIT),
  };
}

export interface PeriodChange {
  /** "10/2026" or "2026": the period `current` is about. */
  label: string;
  /** The period it is compared with. */
  previousLabel: string;
  current: number;
  previous: number;
  /** Rounded to one decimal; null when the previous period had no spend to compare with. */
  percent: number | null;
  /** Set when the period is still running at `anchor`: both sides then count only up to that day. */
  through: Date | null;
}

export type MonthChange = PeriodChange;

const change = (label: string, previousLabel: string, current: number, previous: number, through: Date | null = null): PeriodChange => ({
  label,
  previousLabel,
  current,
  previous,
  percent: previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null,
  through,
});

const daysIn = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();

/** Net spend delivered from the 1st of `monthIndex` up to the end of `day` of `toMonthIndex` (same year). */
function spendUpTo(orders: Order[], year: number, monthIndex: number, toMonthIndex: number, day: number): number {
  const from = new Date(year, monthIndex, 1);
  // A day past the end of a shorter month (31/3 against February) stops at that month's last day.
  const to = new Date(year, toMonthIndex, Math.min(day, daysIn(year, toMonthIndex)), 23, 59, 59, 999);
  return orders.reduce((sum, o) => {
    const d = deliveryDateOf(o);
    return d && d >= from && d <= to && !isExcludedOrder(o) ? sum + o.subTotal : sum;
  }, 0);
}

/**
 * Net spend of the calendar month containing `anchor` against the month before it. A month still
 * running at `anchor` is compared day for day (1–17/11 against 1–17/10), not against a whole month.
 */
export function monthChange(orders: Order[], anchor: Date): MonthChange {
  const month = anchor.getMonth() + 1;
  const year = anchor.getFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const label = `${month}/${year}`;
  const previousLabel = `${prevMonth}/${prevYear}`;
  const day = anchor.getDate();
  if (day === daysIn(year, month - 1)) return change(label, previousLabel, monthSpend(orders, month, year), monthSpend(orders, prevMonth, prevYear));
  return change(label, previousLabel, spendUpTo(orders, year, month - 1, month - 1, day), spendUpTo(orders, prevYear, prevMonth - 1, prevMonth - 1, day), anchor);
}

/** Net spend of the calendar year containing `anchor` against the year before; a year still running is compared up to the same day. */
export function yearChange(orders: Order[], anchor: Date): PeriodChange {
  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const day = anchor.getDate();
  if (monthIndex === 11 && day === 31) return change(String(year), String(year - 1), yearSpend(orders, year), yearSpend(orders, year - 1));
  return change(String(year), String(year - 1), spendUpTo(orders, year, 0, monthIndex, day), spendUpTo(orders, year - 1, 0, monthIndex, day), anchor);
}
