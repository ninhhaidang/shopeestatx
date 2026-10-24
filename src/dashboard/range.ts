// Global date range: what the user picked, the bounds it means, and filtering orders by it (pure)
import type { DateRange, Order } from '../types/index.js';

export type RangePreset = 'all' | 'thisMonth' | 'lastMonth' | 'last3months' | 'thisYear' | 'custom';

/** The user's choice. `from`/`to` are yyyy-mm-dd and only used by `custom`. */
export interface RangeSelection {
  preset: RangePreset;
  from?: string;
  to?: string;
}

export const RANGE_PRESETS: RangePreset[] = ['all', 'thisMonth', 'lastMonth', 'last3months', 'thisYear', 'custom'];

const endOfMonth = (year: number, month: number) => new Date(year, month + 1, 0, 23, 59, 59, 999);

/** Turn a selection into inclusive bounds; a null side is open. */
export function resolveRange(selection: RangeSelection, now: Date): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (selection.preset) {
    case 'thisMonth':
      return { start: new Date(year, month, 1), end: endOfMonth(year, month) };
    case 'lastMonth':
      return { start: new Date(year, month - 1, 1), end: endOfMonth(year, month - 1) };
    case 'last3months':
      return { start: new Date(year, month - 2, 1), end: endOfMonth(year, month) };
    case 'thisYear':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
    case 'custom':
      return {
        start: selection.from ? new Date(`${selection.from}T00:00:00`) : null,
        end: selection.to ? new Date(`${selection.to}T23:59:59.999`) : null,
      };
    default:
      return { start: null, end: null };
  }
}

/** Orders delivered inside the range. Undated orders only survive an open range. */
export function filterByRange(orders: Order[], { start, end }: DateRange): Order[] {
  if (!start && !end) return orders;
  return orders.filter(order => {
    if (!order.deliveryDate) return false;
    const d = new Date(order.deliveryDate);
    return !(start && d < start) && !(end && d > end);
  });
}

/** The last day the range reaches, never later than `now` (a range cannot look into the future). */
export function rangeEnd(range: DateRange, now: Date): Date {
  return range.end && range.end < now ? range.end : now;
}
