import { useMemo } from 'react';
import { buildHeatmapGrid, heatmapWindow } from '../../../dashboard/heatmap.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { DateRange, Order } from '../../../types/index.js';
import { card } from '../../../ui/styles/classes';

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 24;
const TOP = 20;
const DAY_LABELS: Record<number, string> = { 1: 'heatmap.day.mon', 3: 'heatmap.day.wed', 5: 'heatmap.day.fri' };

/** Empty days use the line colour; busier days mix in more of the accent. */
const FILL = [
  'var(--line)',
  'color-mix(in srgb, var(--accent) 30%, var(--card))',
  'color-mix(in srgb, var(--accent) 55%, var(--card))',
  'color-mix(in srgb, var(--accent) 80%, var(--card))',
  'var(--accent-strong)',
];

const dayOf = (key: string) => formatDate(new Date(`${key}T00:00:00`));

/** Orders per day over the 12 months ending at the range's last day, from the whole history (calendar view), with the same numbers as a table. */
export function Heatmap({ orders, range, now }: { orders: Order[]; range: DateRange; now: Date }) {
  const grid = useMemo(() => {
    const { start, end } = heatmapWindow(range, now);
    return buildHeatmapGrid(orders, start, end);
  }, [orders, range, now]);

  const title = t('analysis.heatmap.title');
  const from = formatDate(grid.start);
  const to = formatDate(grid.end);
  const summary = t('analysis.heatmap.summary', { title, days: grid.days.length, orders: grid.totalOrders, from, to });
  const width = grid.weeks.length * STEP + LEFT;
  const height = 7 * STEP + TOP;

  return (
    <section aria-labelledby="analysis-heatmap" className={`${card} min-w-0 @5xl:col-span-6`}>
      <h2 id="analysis-heatmap" className="text-sm font-semibold">{title}</h2>
      <p className="mb-3 text-xs text-muted">{t('analysis.heatmap.period', { from, to })}</p>
      {/* Wide grids scroll sideways inside the card; focusable so the keyboard can scroll it. */}
      <div role="region" aria-label={t('analysis.heatmap.scroll')} tabIndex={0} className="overflow-x-auto rounded-lg pb-2">
        <svg role="img" aria-label={summary} width={width} height={height} className="block max-w-none">
          {Object.entries(DAY_LABELS).map(([row, key]) => (
            <text key={row} x={0} y={TOP + Number(row) * STEP + CELL - 1} fontSize={10} fill="var(--muted)">{t(key)}</text>
          ))}
          {grid.monthLabels.map(m => (
            <text key={`${m.col}-${m.month}`} x={LEFT + m.col * STEP} y={12} fontSize={10} fill="var(--muted)">
              {t('analysis.heatmap.month', { n: m.month + 1 })}
            </text>
          ))}
          {grid.weeks.map((week, col) =>
            week.map((cell, row) =>
              cell && (
                <rect
                  key={cell.date}
                  data-date={cell.date}
                  data-level={cell.intensity}
                  x={LEFT + col * STEP}
                  y={TOP + row * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={FILL[cell.intensity]}
                >
                  <title>{cell.orderCount ? t('analysis.heatmap.tip', { date: dayOf(cell.date), n: cell.orderCount }) : dayOf(cell.date)}</title>
                </rect>
              ),
            ),
          )}
        </svg>
      </div>
      <details className="mt-2 text-sm">
        <summary className="w-fit cursor-pointer rounded text-muted hover:text-fg">{t('dash.chart.showTable')}</summary>
        {grid.days.length === 0 ? (
          <p className="mt-2 text-muted">{t('analysis.heatmap.empty')}</p>
        ) : (
          <table className="num mt-2 w-full text-left">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1 font-medium">{t('analysis.heatmap.date')}</th>
                <th scope="col" className="py-1 text-right font-medium">{t('analysis.heatmap.orders')}</th>
              </tr>
            </thead>
            <tbody>
              {grid.days.map(day => (
                <tr key={day.date} className="border-t border-line">
                  <th scope="row" className="py-1 font-normal">{dayOf(day.date)}</th>
                  <td className="py-1 text-right">{day.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
    </section>
  );
}
