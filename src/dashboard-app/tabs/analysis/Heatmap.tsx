import { useMemo, useState } from 'react';
import { buildHeatmapGrid, heatmapWindow } from '../../../dashboard/heatmap.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { DateRange, Order } from '../../../types/index.js';
import { card, chip } from '../../../ui/styles/classes';

const CELL = 12;
const GAP = 2.5;
const STEP = CELL + GAP;
const LEFT = 20;
const TOP = 18;
const DAY_LABELS: Record<number, string> = { 1: 'heatmap.day.mon', 3: 'heatmap.day.wed', 5: 'heatmap.day.fri' };

/** Empty days use a faint line colour; busier days mix in more of the accent. */
const FILL = [
  'color-mix(in srgb, var(--line) 60%, var(--card))',
  'color-mix(in srgb, var(--accent) 30%, var(--card))',
  'color-mix(in srgb, var(--accent) 55%, var(--card))',
  'color-mix(in srgb, var(--accent) 80%, var(--card))',
  'var(--accent-strong)',
];

const dayOf = (key: string) => formatDate(new Date(`${key}T00:00:00`));

/** Orders per day over the 12 months ending at the range's last day, from the whole history (calendar view), with the same numbers as a screen-reader table. */
export function Heatmap({ orders, range, now }: { orders: Order[]; range: DateRange; now: Date }) {
  const grid = useMemo(() => {
    const { start, end } = heatmapWindow(range, now);
    return buildHeatmapGrid(orders, start, end);
  }, [orders, range, now]);

  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const title = t('analysis.heatmap.title');
  const from = formatDate(grid.start);
  const to = formatDate(grid.end);
  const summary = t('analysis.heatmap.summary', { title, days: grid.days.length, orders: grid.totalOrders, from, to });
  const width = grid.weeks.length * STEP + LEFT;
  const height = 7 * STEP + TOP;

  return (
    <section aria-labelledby="analysis-heatmap" className={`${card} min-w-0 @5xl:col-span-6 @7xl:col-span-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="analysis-heatmap" className="text-base font-semibold">{title}</h3>
        <span className={chip}>{t('analysis.scope.year')}</span>
      </div>
      <p className="mb-3 text-xs text-muted">{t('analysis.heatmap.period', { from, to })}</p>
      {/* The grid grows with the card; below its minimum width it scrolls sideways (focusable for the keyboard). */}
      <div role="region" aria-label={t('analysis.heatmap.scroll')} tabIndex={0} className="overflow-x-auto rounded-lg pb-2">
        <div className="relative min-w-[40rem] max-w-[72rem]" onMouseLeave={() => setTip(null)}>
          <svg role="img" aria-label={summary} viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full">
            {Object.entries(DAY_LABELS).map(([row, key]) => (
              <text key={row} x={0} y={TOP + Number(row) * STEP + CELL - 2} fontSize={9} fill="var(--muted)">{t(key)}</text>
            ))}
            {grid.monthLabels.map(m => (
              <text key={`${m.col}-${m.month}`} x={LEFT + m.col * STEP} y={11} fontSize={9} fill="var(--muted)">
                {t('analysis.heatmap.month', { n: m.month + 1 })}
              </text>
            ))}
            {grid.weeks.map((week, col) =>
              week.map((cell, row) => {
                if (!cell) return null;
                const text = cell.orderCount ? t('analysis.heatmap.tip', { date: dayOf(cell.date), n: cell.orderCount }) : dayOf(cell.date);
                const x = LEFT + col * STEP;
                const y = TOP + row * STEP;
                return (
                  <rect
                    key={cell.date}
                    data-date={cell.date}
                    data-level={cell.intensity}
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={2.5}
                    fill={FILL[cell.intensity]}
                    onMouseEnter={() => setTip({ text, x: ((x + CELL / 2) / width) * 100, y: (y / height) * 100 })}
                  >
                    <title>{text}</title>
                  </rect>
                );
              }),
            )}
          </svg>
          {tip && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line bg-card px-2 py-1 text-xs shadow-lg"
              style={{ left: `clamp(4.5rem, ${tip.x}%, calc(100% - 4.5rem))`, top: `calc(${tip.y}% - 4px)` }}
            >
              {tip.text}
            </div>
          )}
        </div>
      </div>
      <p aria-hidden="true" className="mt-1 flex items-center gap-1 text-xs text-muted">
        {t('analysis.heatmap.less')}
        {FILL.map(fill => (
          <span key={fill} className="size-3 rounded-[2px]" style={{ background: fill }} />
        ))}
        {t('analysis.heatmap.more')}
      </p>
      {/* Screen readers get the per-day numbers; sighted users read them from the hover tip. */}
      {grid.days.length > 0 && (
        <table className="sr-only">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">{t('analysis.heatmap.date')}</th>
              <th scope="col">{t('analysis.heatmap.orders')}</th>
            </tr>
          </thead>
          <tbody>
            {grid.days.map(day => (
              <tr key={day.date}>
                <th scope="row">{dayOf(day.date)}</th>
                <td>{day.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
