// Pure spending statistics derived from cached orders (no DOM, no network)
import type { Order } from '../types/index.js';

export interface Stats {
  netSpend: number;
  refundTotal: number;
  excludedCount: number;
  estimatedSavings: number;
  busiestWeekday: number | null;   // 0 = Sunday … 6 = Saturday
  busiestHour: number | null;      // 0–23, from delivery time
  longestMonthStreak: number;
  dailySpendRate: number;
  topByQuantity: { name: string; quantity: number }[];
  priciest: { name: string; unitPrice: number }[];
}

const LIST_LIMIT = 10;
const MS_PER_DAY = 86_400_000;

const isExcluded = (o: Order) => o.statusCode === 4 || o.statusCode === 12;

// Index of the most frequent bucket; ties go to the earlier position in `order`.
function peak(counts: number[], order: number[]): number | null {
  let best: number | null = null;
  for (const i of order) {
    if (counts[i] > 0 && (best === null || counts[i] > counts[best])) best = i;
  }
  return best;
}

function longestStreak(monthIndexes: Set<number>): number {
  let best = 0;
  for (const m of monthIndexes) {
    if (monthIndexes.has(m - 1)) continue;
    let len = 1;
    while (monthIndexes.has(m + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}

export function computeStats(orders: Order[]): Stats {
  const included = orders.filter(o => !isExcluded(o));
  const excluded = orders.filter(isExcluded);

  const netSpend = included.reduce((s, o) => s + o.subTotal, 0);
  const refundTotal = excluded.reduce((s, o) => s + (o.refundAmount ?? 0), 0);
  const estimatedSavings = included.reduce(
    (s, o) => (o.itemsTotal === undefined ? s : s + Math.max(0, o.itemsTotal - o.subTotal)), 0);

  const weekdays = new Array<number>(7).fill(0);
  const hours = new Array<number>(24).fill(0);
  const months = new Set<number>();
  let first = Infinity;
  let last = -Infinity;
  for (const o of included) {
    if (!o.deliveryDate) continue;
    const d = new Date(o.deliveryDate);
    weekdays[d.getDay()]++;
    hours[d.getHours()]++;
    months.add(d.getFullYear() * 12 + d.getMonth());
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    first = Math.min(first, day);
    last = Math.max(last, day);
  }
  const spanDays = Number.isFinite(first) ? Math.round((last - first) / MS_PER_DAY) + 1 : 0;

  const quantities = new Map<string, number>();
  const maxPrice = new Map<string, number>();
  for (const o of included) {
    for (const item of o.items ?? []) {
      quantities.set(item.name, (quantities.get(item.name) ?? 0) + item.quantity);
      maxPrice.set(item.name, Math.max(maxPrice.get(item.name) ?? 0, item.unitPrice));
    }
  }

  return {
    netSpend,
    refundTotal,
    excludedCount: excluded.length,
    estimatedSavings,
    busiestWeekday: peak(weekdays, [1, 2, 3, 4, 5, 6, 0]),
    busiestHour: peak(hours, hours.map((_, i) => i)),
    longestMonthStreak: longestStreak(months),
    dailySpendRate: spanDays ? Math.round(netSpend / spanDays) : 0,
    topByQuantity: [...quantities]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
      .slice(0, LIST_LIMIT),
    priciest: [...maxPrice]
      .map(([name, unitPrice]) => ({ name, unitPrice }))
      .sort((a, b) => b.unitPrice - a.unitPrice || a.name.localeCompare(b.name))
      .slice(0, LIST_LIMIT),
  };
}

/** True when the cache predates the stats fields (all of refundAmount, itemsTotal, items arrive together); a re-scan fills them in. */
export function needsRescan(orders: Order[]): boolean {
  return orders.some(o => o.refundAmount === undefined);
}
