// Calendar-month bucketing of orders (pure). One basis everywhere: the local delivery date, the same
// field the global date range filters on, so a chart bar, a month figure and a range always agree.
import type { Order } from '../types/index.js';
import { deliveryDateOf } from './delivery-date.js';
import { isExcludedOrder } from './order-status.js';

export interface OrderMonth {
  /** 1-12 */
  month: number;
  year: number;
}

/** YYYY-MM-DD of a valid local delivery-calendar date. */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The month an order is delivered in, or null for an undated or unusable date. */
export function monthOf(order: Pick<Order, 'deliveryDate'>): OrderMonth | null {
  const d = deliveryDateOf(order);
  return d ? { month: d.getMonth() + 1, year: d.getFullYear() } : null;
}

/** Net spend of the orders delivered in the given month (cancelled and returned orders left out). */
export function monthSpend(orders: Order[], month: number, year: number): number {
  return orders.reduce((sum, o) => {
    const m = monthOf(o);
    return m && m.month === month && m.year === year && !isExcludedOrder(o) ? sum + o.subTotal : sum;
  }, 0);
}

/**
 * Net spend of an average month: the total over every month from the first dated order to the last,
 * empty months included (the same figure as the dashed line on the month chart). 0 without dated orders.
 */
export function averageMonthSpend(orders: Order[]): number {
  let first = Infinity;
  let last = -Infinity;
  let total = 0;
  for (const o of orders) {
    const m = monthOf(o);
    if (!m || isExcludedOrder(o)) continue;
    const key = m.year * 12 + m.month;
    first = Math.min(first, key);
    last = Math.max(last, key);
    total += o.subTotal;
  }
  return Number.isFinite(first) ? total / (last - first + 1) : 0;
}

/** The years that have a dated order, newest first. */
export function orderYears(orders: Order[]): number[] {
  const years = new Set<number>();
  for (const o of orders) {
    const m = monthOf(o);
    if (m) years.add(m.year);
  }
  return [...years].sort((a, b) => b - a);
}

/** Net spend of the orders delivered in the given year (cancelled and returned orders left out). */
export function yearSpend(orders: Order[], year: number): number {
  return orders.reduce((sum, o) => (monthOf(o)?.year === year && !isExcludedOrder(o) ? sum + o.subTotal : sum), 0);
}
