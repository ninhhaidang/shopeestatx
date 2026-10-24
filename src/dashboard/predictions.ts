// Month-end spending prediction based on current daily pace
import type { Order } from '../types/index.js';
import { monthSpend } from './month.js';

export function predictMonthEnd(allOrders: Order[], now: Date = new Date()): number {
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const currentSpending = monthSpend(allOrders, now.getMonth() + 1, now.getFullYear());
  // BUG-3: require at least 3 days of data to avoid wild early-month extrapolations
  if (dayOfMonth < 3 || currentSpending === 0) return 0;
  return Math.round((currentSpending / dayOfMonth) * daysInMonth);
}
