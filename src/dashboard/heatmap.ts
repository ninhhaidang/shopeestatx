// Calendar heatmap — GitHub-style 52-week order count visualization
import type { Order } from '../types/index.js';
import { state } from './state.js';
import { t } from '../i18n/index.js';

export interface HeatmapDay {
  date: string;       // YYYY-MM-DD
  orderCount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

function buildDayIndex(orders: Order[], startDate: Date, endDate: Date): Record<string, HeatmapDay> {
  const dayMap: Record<string, number> = {};

  orders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;
    if (!order.deliveryDate) return;
    const dateStr = order.deliveryDate.substring(0, 10);
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d < startDate || d > endDate) return;
    dayMap[dateStr] = (dayMap[dateStr] || 0) + 1;
  });

  // Use order count quartiles for intensity instead of amount
  const counts = Object.values(dayMap).sort((a, b) => a - b);
  const q = (p: number) => counts[Math.floor(counts.length * p)] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];

  const toIntensity = (c: number): 0 | 1 | 2 | 3 | 4 => {
    if (c === 0) return 0;
    if (c <= q1) return 1;
    if (c <= q2) return 2;
    if (c <= q3) return 3;
    return 4;
  };

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
    // Show full year
    startDate = new Date(selectedYear, 0, 1);
    endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
  } else {
    // Fallback: last 12 months
    endDate = new Date();
    startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // align to Sunday
  }

  const dayIndex = buildDayIndex(orders, startDate, endDate);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const cellSize = 12;
  const gap = 3;
  const step = cellSize + gap;
  const COLS = 53;
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
    document.dispatchEvent(new CustomEvent('shopeestatx:apply-filters'));
    document.getElementById('ordersTable')?.scrollIntoView({ behavior: 'smooth' });
  });
}
