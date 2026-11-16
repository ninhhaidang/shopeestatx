// Global date range: what the user picked, the bounds it means, and filtering orders by it (pure)
import type { DateRange, Order } from '../types/index.js';
import { deliveryDateOf } from './delivery-date.js';

export type RangePreset = 'all' | 'last7days' | 'thisMonth' | 'lastMonth' | 'last3months' | 'thisYear' | 'year' | 'month' | 'custom';

/** The user's choice. `from`/`to` (yyyy-mm-dd) are used by `custom`; `year` by `year` and `month`; `month` (1-12) by `month`. */
export interface RangeSelection {
  preset: RangePreset;
  from?: string;
  to?: string;
  year?: number;
  month?: number;
}

export const RANGE_PRESETS: RangePreset[] = ['all', 'last7days', 'thisMonth', 'lastMonth', 'last3months', 'thisYear', 'year', 'month', 'custom'];

const endOfMonth = (year: number, month: number) => new Date(year, month + 1, 0, 23, 59, 59, 999);

/** Turn a selection into inclusive bounds; a null side is open. */
export function resolveRange(selection: RangeSelection, now: Date): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (selection.preset) {
    case 'last7days':
      return { start: new Date(year, now.getMonth(), now.getDate() - 6), end: new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999) };
    case 'year': {
      const y = selection.year ?? year;
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999) };
    }
    case 'month': {
      const y = selection.year ?? year;
      const m = (selection.month ?? month + 1) - 1;
      return { start: new Date(y, m, 1), end: endOfMonth(y, m) };
    }
    case 'thisMonth':
      return { start: new Date(year, month, 1), end: endOfMonth(year, month) };
    case 'lastMonth':
      return { start: new Date(year, month - 1, 1), end: endOfMonth(year, month - 1) };
    case 'last3months':
      return { start: new Date(year, month - 2, 1), end: endOfMonth(year, month) };
    case 'thisYear':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
    case 'custom': {
      // Dates typed in the wrong order still mean the days between them, not an empty history.
      const [from, to] = selection.from && selection.to && selection.from > selection.to
        ? [selection.to, selection.from]
        : [selection.from, selection.to];
      return {
        start: from ? new Date(`${from}T00:00:00`) : null,
        end: to ? new Date(`${to}T23:59:59.999`) : null,
      };
    }
    default:
      return { start: null, end: null };
  }
}

/** Orders delivered inside the range. Orders with no usable delivery date only survive an open range. */
export function filterByRange(orders: Order[], { start, end }: DateRange): Order[] {
  if (!start && !end) return orders;
  return orders.filter(order => {
    const delivered = deliveryDateOf(order);
    return delivered !== null && !(start && delivered < start) && !(end && delivered > end);
  });
}

/** The last day the range reaches, never later than `now` (a range cannot look into the future). */
export function rangeEnd(range: DateRange, now: Date): Date {
  return range.end && range.end < now ? range.end : now;
}
