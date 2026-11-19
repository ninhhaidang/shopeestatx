// Which Shopee membership tier the orders reach, by the rules Shopee publishes (shopee.vn/blog, 13/04/2026):
// counted per half-year cycle (1/1–30/6, 1/7–31/12), paid and delivered orders only, both thresholds met.
// An estimate from the order history: Shopee's own count can differ (it may date orders differently).
import type { Order } from '../types/index.js';
import { monthOf } from './month.js';
import { isExcludedOrder } from './order-status.js';

export type Tier = 'silver' | 'gold' | 'diamond';

/** Highest tier first: [tier, orders, spend in đồng]. */
const TIERS: [Tier, number, number][] = [
  ['diamond', 75, 15_000_000],
  ['gold', 20, 5_000_000],
  ['silver', 3, 1_000_000],
];

/** The highest tier any half-year cycle of these orders meets, or null below Bạc. */
export function bestTier(orders: Order[]): Tier | null {
  const cycles = new Map<number, { orders: number; spend: number }>();
  for (const o of orders) {
    const m = monthOf(o);
    if (!m || isExcludedOrder(o)) continue;
    const key = m.year * 2 + (m.month > 6 ? 1 : 0);
    const cycle = cycles.get(key) ?? { orders: 0, spend: 0 };
    cycle.orders += 1;
    cycle.spend += o.subTotal;
    cycles.set(key, cycle);
  }
  const met = (min: number, spend: number) => [...cycles.values()].some(c => c.orders >= min && c.spend >= spend);
  return TIERS.find(([, min, spend]) => met(min, spend))?.[0] ?? null;
}
