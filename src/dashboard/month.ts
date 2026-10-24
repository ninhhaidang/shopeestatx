// Calendar-month bucketing of orders (pure). One basis everywhere: the local delivery date, the same
// field the global date range filters on, so a chart bar, a month figure and a range always agree.
import type { Order } from '../types/index.js';
import { isExcludedOrder } from './order-status.js';

export interface OrderMonth {
  /** 1-12 */
  month: number;
  year: number;
}

/** The month an order is delivered in, or null for an undated order. */
export function monthOf(order: Pick<Order, 'deliveryDate'>): OrderMonth | null {
  if (!order.deliveryDate) return null;
  const d = new Date(order.deliveryDate);
  return Number.isNaN(d.getTime()) ? null : { month: d.getMonth() + 1, year: d.getFullYear() };
}

/** Net spend of the orders delivered in the given month (cancelled and returned orders left out). */
export function monthSpend(orders: Order[], month: number, year: number): number {
  return orders.reduce((sum, o) => {
    const m = monthOf(o);
    return m && m.month === month && m.year === year && !isExcludedOrder(o) ? sum + o.subTotal : sum;
  }, 0);
}
