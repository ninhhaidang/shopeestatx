// Calendar heatmap — GitHub-style 52-week order count visualization
import type { DateRange, Order } from '../types/index.js';
import { rangeEnd } from './range.js';
import { state } from './state.js';
import { t } from '../i18n/index.js';
import { EVENTS } from '../config.js';
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

function buildDayIndex(orders: Order[], startDate: Date, endDate: Date): Record<string, HeatmapDay> {
  const dayMap: Record<string, number> = {};

  orders.forEach(order => {
    if (isExcludedOrder(order)) return;
    if (!order.deliveryDate) return;
    const dateStr = order.deliveryDate.substring(0, 10);
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d < startDate || d > endDate) return;
    dayMap[dateStr] = (dayMap[dateStr] || 0) + 1;
  });

  const toIntensity = intensityScale(Object.values(dayMap));

  const index: Record<string, HeatmapDay> = {};
  Object.entries(dayMap).forEach(([date, count]) => {
    index[date] = { date, orderCount: count, intensity: toIntensity(count) };
  });
  return index;
}

export function renderHeatmap(container: HTMLElement, orders: Order[]): void {
  // Get selected year from filter
  const filterYear = (document.getElementById('filterYear') as HTMLSelectElement).value;
  const selectedYear = filterYear ? parseInt(filterYear) : null;

  // Determine date range based on selected year
  let startDate: Date, endDate: Date;
  if (selectedYear) {
    // Show full year - align to Sunday before Jan 1
    startDate = new Date(selectedYear, 0, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Align to Sunday
    endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
  } else {
    // Fallback: last 12 months - align to first of month, then to Sunday
    endDate = new Date();
    endDate.setDate(0); // Last day of previous month
    startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(1); // First day of month
    // Align to Sunday before or on the first day
    startDate.setDate(startDate.getDate() - startDate.getDay());
  }

  // Calculate actual number of weeks needed
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const COLS = Math.ceil(totalDays / 7);

  const dayIndex = buildDayIndex(orders, startDate, endDate);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const cellSize = 12;
  const gap = 3;
  const step = cellSize + gap;
  const ROWS = 7;
  const svgWidth = COLS * step + 24; // +24 for day labels on left
  const svgHeight = ROWS * step + 20; // +20 for month labels

  // Pre-compute month start columns for accurate label positioning
  const monthStartCols: Record<number, number> = {};

  for (let col = 0; col < COLS; col++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + col * ROWS);

    // Check each day in this week to find the 1st of month
    for (let row = 0; row < ROWS; row++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + row);
      if (dayDate > endDate) continue;

      const monthKey = dayDate.getFullYear() * 12 + dayDate.getMonth();

      // Store first occurrence of each month (within date range)
      if (dayDate.getDate() === 1 && monthStartCols[monthKey] === undefined) {
        monthStartCols[monthKey] = col;
      }
    }
  }

  let cells = '';
  let monthLabels = '';
  let dayLabels = '';

  // Add day labels (Mon, Wed, Fri) - GitHub style (English only)
  const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  for (let row = 0; row < ROWS; row++) {
    if (DAYS[row]) {
      const y = row * step + 20 + cellSize / 2 + 3;
      dayLabels += `<text x="2" y="${y}" class="heatmap-day-label">${DAYS[row]}</text>`;
    }
  }

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + col * ROWS + row);
      if (d > endDate) continue;

      const dateStr = d.toISOString().substring(0, 10);
      const day = dayIndex[dateStr];
      const lvl = day?.intensity ?? 0;
      const x = col * step + 24; // +24 for day labels on left
      const y = row * step + 20;
      // Show only order count in tooltip (not amount)
      const tooltipText = day
        ? `${dateStr}: ${day.orderCount} ${t('heatmap.tooltip.orders', { value: String(day.orderCount) })}`
        : dateStr;

      cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" class="heatmap-cell heatmap-${lvl}" data-date="${dateStr}" data-tip="${tooltipText}" />`;
    }
  }

  // Draw month labels at pre-computed positions (aligned to first day of each month)
  Object.entries(monthStartCols)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([monthKey, col]) => {
      const month = Number(monthKey) % 12;
      monthLabels += `<text x="${col * step + 24}" y="12" class="heatmap-label">${MONTHS[month]}</text>`;
    });

  container.innerHTML = `
    <div class="heatmap-scroll">
      <svg width="${svgWidth}" height="${svgHeight}" class="heatmap-svg">${dayLabels}${monthLabels}${cells}</svg>
    </div>`;

  // Floating tooltip — reuse existing one to avoid duplicates on re-render
  const svg = container.querySelector('.heatmap-svg')!;
  let tip = document.querySelector<HTMLDivElement>('.heatmap-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'heatmap-tooltip';
    document.body.appendChild(tip);
  }

  svg.addEventListener('mousemove', (e) => {
    const cell = (e.target as Element).closest('.heatmap-cell') as SVGElement | null;
    if (cell?.dataset.tip) {
      tip.textContent = cell.dataset.tip;
      tip.style.left = `${(e as MouseEvent).clientX + 12}px`;
      tip.style.top = `${(e as MouseEvent).clientY - 34}px`;
      tip.style.display = 'block';
    } else {
      tip.style.display = 'none';
    }
  });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

  // Click cell → filter table to that day (via custom event to avoid circular dep)
  svg.addEventListener('click', (e) => {
    const cell = (e.target as Element).closest('.heatmap-cell') as SVGElement | null;
    if (!cell?.dataset.date) return;
    const [year, month, day] = cell.dataset.date.split('-').map(Number);
    (document.getElementById('filterYear') as HTMLSelectElement).value = String(year);
    (document.getElementById('filterMonth') as HTMLSelectElement).value = String(month);
    state.selectedDay = day;
    document.dispatchEvent(new CustomEvent(EVENTS.FILTERS_REQUESTED));
    document.getElementById('ordersTable')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ---- Pure grid for the React heatmap (local calendar days, no DOM) ----

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
