import { useMemo } from 'react';
import { buildHeatmapGrid, heatmapWindow } from '../../../dashboard/heatmap.js';
import { generateInsights } from '../../../dashboard/insights.js';
import { computeStats, needsRescan } from '../../../dashboard/stats.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import { NoOrdersInRange } from '../../components/NoOrdersInRange';
import { useDashboard } from '../../context';
import { money } from '../../format';
import { Budget } from './Budget';
import { Loyalty } from './Loyalty';

const dayOf = (key: string) => (key ? formatDate(new Date(`${key}T00:00:00`)) : t('stats.none'));

const WEEKDAY_KEYS = ['stats.weekday.0', 'stats.weekday.1', 'stats.weekday.2', 'stats.weekday.3', 'stats.weekday.4', 'stats.weekday.5', 'stats.weekday.6'];

const FILL = ['var(--w-line)', 'color-mix(in srgb, var(--w-accent) 30%, var(--w-card))', 'color-mix(in srgb, var(--w-accent) 60%, var(--w-card))', 'var(--w-accent-strong)'];

/**
 * Phân tích, warm variant: the same insights/habits/products/loyalty/heatmap/budget figures as
 * AnalysisTab, read as a flowing narrative with thin rank bars instead of a grid of cards.
 */
export function AnalysisTabWarm() {
  const { data, orders, range, now } = useDashboard();
  const stats = useMemo(() => computeStats(orders), [orders]);
  const stale = needsRescan(data.orders);
  const insights = useMemo(() => generateInsights(data.orders, now), [data.orders, now]);
  const grid = useMemo(() => {
    const { start, end } = heatmapWindow(range, now);
    return buildHeatmapGrid(data.orders, start, end);
  }, [data.orders, range, now]);

  if (orders.length === 0) return <NoOrdersInRange />;

  const weekday = stats.busiestWeekday === null ? t('stats.none') : t(WEEKDAY_KEYS[stats.busiestWeekday]);
  const hour = stats.busiestHour === null ? t('stats.none') : `${stats.busiestHour}:00`;
  const streak = stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : t('stats.none');
  const rate = stats.dailySpendRate ? money(stats.dailySpendRate) : t('stats.none');

  return (
    <div className="mx-auto flex max-w-prose flex-col gap-7 py-2 font-serif text-[15px] leading-relaxed text-warm-fg">
      <p>{t('analysisWarm.habitsIntro', { weekday, hour, streak, rate })}</p>

      {insights.length > 0 && (
        <p>
          {insights.map((text) => (
            <span key={text}>{text} </span>
          ))}
        </p>
      )}

      <section aria-label={t('stats.topQuantity')}>
        <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{t('stats.topQuantity')}</h2>
        {stale ? (
          <p className="text-warm-muted">{t('analysisWarm.topProductsStale')}</p>
        ) : (
          <ol aria-label={t('stats.topQuantity')} className="grid gap-1.5">
            {stats.topByQuantity.map((p, i) => (
              <li key={p.name} className="flex items-baseline gap-2">
                <span className="font-serif text-warm-muted">{i + 1}.</span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-serif">{t('stats.quantity.unit', { n: p.quantity })}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label={t('stats.priciest')}>
        <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{t('stats.priciest')}</h2>
        {stale ? (
          <p className="text-warm-muted">{t('analysisWarm.topProductsStale')}</p>
        ) : (
          <ol aria-label={t('stats.priciest')} className="grid gap-1.5">
            {stats.priciest.map((p, i) => (
              <li key={p.name} className="flex items-baseline gap-2">
                <span className="font-serif text-warm-muted">{i + 1}.</span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-serif">{money(p.unitPrice)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Loyalty orders={data.orders} />

      <section aria-label={t('analysis.heatmap.title')}>
        <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{t('analysis.heatmap.title')}</h2>
        <div className="overflow-x-auto rounded-lg pb-2">
          <svg role="img" aria-label={t('analysis.heatmap.title')} width={grid.weeks.length * 11 + 8} height={7 * 11 + 4} className="block max-w-none">
            {grid.weeks.map((week, col) =>
              week.map(
                (cell, row) =>
                  cell && (
                    <rect key={cell.date} x={8 + col * 11} y={row * 11} width={8} height={8} rx={2} fill={FILL[Math.min(cell.intensity, 3)]}>
                      <title>{t('analysis.heatmap.tip', { date: dayOf(cell.date), n: cell.orderCount })}</title>
                    </rect>
                  ),
              ),
            )}
          </svg>
        </div>
      </section>

      <Budget allOrders={data.orders} now={now} />
    </div>
  );
}
