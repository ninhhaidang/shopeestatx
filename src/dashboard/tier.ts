// Which Shopee membership tier the orders give, by the rules Shopee publishes (shopee.vn/blog, 13/04/2026):
// counted per half-year cycle (1/1–30/6, 1/7–31/12), paid and delivered orders only, both thresholds met.
// Each cycle starts from a tier set by the cycle before: Kim Cương is kept when that cycle met Kim Cương again;
// any other tier starts one step lower (Vàng → Bạc, from a third-party example; the owner confirmed Kim Cương).
// An estimate from the order history: Shopee's own count can differ (ShopeeFood orders are not in it, for one).
import type { Order } from '../types/index.js';
import { deliveryDateOf } from './delivery-date.js';
import { isExcludedOrder } from './order-status.js';

export type Tier = 'silver' | 'gold' | 'diamond';

/** Ranks 1–3, lowest first: [tier, orders, spend in đồng]. Rank 0 is no tier (Thành viên thân thiết). */
const TIERS: [Tier, number, number][] = [
  ['silver', 3, 1_000_000],
  ['gold', 20, 5_000_000],
  ['diamond', 75, 15_000_000],
];
const DIAMOND = 3;

const cycleOf = (date: Date) => date.getFullYear() * 2 + (date.getMonth() >= 6 ? 1 : 0);

/**
 * The highest tier held in any half-year cycle from `from` to `to` (open ends reach the first and last order),
 * counting what earlier cycles carry over. Null when no cycle reaches Bạc.
 */
export function tierBetween(orders: Order[], from: Date | null, to: Date | null): Tier | null {
  const cycles = new Map<number, { orders: number; spend: number }>();
  for (const o of orders) {
    const date = deliveryDateOf(o);
    if (!date || isExcludedOrder(o)) continue;
    const cycle = cycles.get(cycleOf(date)) ?? { orders: 0, spend: 0 };
    cycle.orders += 1;
    cycle.spend += o.subTotal;
    cycles.set(cycleOf(date), cycle);
  }
  if (cycles.size === 0) return null;

  const keys = [...cycles.keys()];
  const first = Math.min(...keys);
  const fromKey = from ? cycleOf(from) : first;
  const toKey = to ? cycleOf(to) : Math.max(...keys);
  let start = 0;
  let best = 0;
  for (let key = first; key <= toKey; key++) {
    const c = cycles.get(key);
    const reached = c ? TIERS.reduce((rank, [, min, spend], i) => (c.orders >= min && c.spend >= spend ? i + 1 : rank), 0) : 0;
    if (key >= fromKey) best = Math.max(best, start, reached);
    start = reached === DIAMOND ? DIAMOND : Math.max(0, reached - 1);
  }
  return best ? TIERS[best - 1][0] : null;
}
