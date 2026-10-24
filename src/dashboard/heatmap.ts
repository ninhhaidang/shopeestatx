// Calendar heatmap: orders per day over the last 12 months (pure grid; the React Phân tích tab draws it)
import type { DateRange, Order } from '../types/index.js';
import { rangeEnd } from './range.js';
import { isExcludedOrder } from './order-status.js';

export interface HeatmapDay {
  date: string;       // YYYY-MM-DD
  orderCount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

/** Order-count quartiles of the days that have orders decide the colour level. */
function intensityScale(dayCounts: number[]): (count: number) => 0 | 1 | 2 | 3 | 4 {
  const counts = [...dayCounts].sort((a, b) => a - b);
  const q = (p: number) => counts[Math.floor(counts.length * p)] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return c => {
    if (c === 0) return 0;
    if (c <= q1) return 1;
    if (c <= q2) return 2;
    if (c <= q3) return 3;
    return 4;
  };
}

export interface HeatmapCell extends HeatmapDay {
  /** Day of the week, 0 = Sunday. */
  weekday: number;
}

export interface HeatmapGrid {
  start: Date;
  end: Date;
  /** One entry per week (Sunday first); null where the day falls outside start..end. */
  weeks: (HeatmapCell | null)[][];
  /** Column of the week holding the 1st of each month, with month 0-11. */
  monthLabels: { col: number; month: number }[];
  /** Days that have orders, oldest first. */
  days: HeatmapDay[];
  totalOrders: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** yyyy-mm-dd of the local calendar day. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * The days the heatmap covers: the 12 months ending at the last day of the global range (never later
 * than `now`). Only the end follows the range; the orders drawn are the whole history, as before.
 */
export function heatmapWindow(range: DateRange, now: Date): { start: Date; end: Date } {
  const last = rangeEnd(range, now);
  const end = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  return { start: new Date(end.getFullYear() - 1, end.getMonth(), end.getDate() + 1), end };
}

export function buildHeatmapGrid(orders: Order[], start: Date, end: Date): HeatmapGrid {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    if (isExcludedOrder(o) || !o.deliveryDate) continue;
    const d = new Date(o.deliveryDate);
    if (isNaN(d.getTime())) continue;
    const key = localDateKey(d);
    if (key < localDateKey(start) || key > localDateKey(end)) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const level = intensityScale(Object.values(counts));

  const first = new Date(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay());
  const weeks: HeatmapGrid['weeks'] = [];
  const monthLabels: HeatmapGrid['monthLabels'] = [];
  for (let cursor = new Date(first); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
    const col = weeks.length;
    const week: (HeatmapCell | null)[] = [];
    for (let row = 0; row < 7; row++) {
      const day = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + row);
      if (day < start || day > end) {
        week.push(null);
        continue;
      }
      const date = localDateKey(day);
      const orderCount = counts[date] ?? 0;
      week.push({ date, orderCount, intensity: level(orderCount), weekday: row });
      if (day.getDate() === 1) monthLabels.push({ col, month: day.getMonth() });
    }
    weeks.push(week);
  }
  const days = Object.keys(counts).sort().map(date => ({ date, orderCount: counts[date], intensity: level(counts[date]) }));
  return { start, end, weeks, monthLabels, days, totalOrders: days.reduce((s, d) => s + d.orderCount, 0) };
}
