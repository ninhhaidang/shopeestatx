import { useMemo } from 'react';
import { computeOverview, monthChange, yearChange } from '../../dashboard/overview.js';
import { rangeEnd } from '../../dashboard/range.js';
import { downloadShareImage } from '../../dashboard/share-image.js';
import { needsRescan } from '../../dashboard/stats.js';
import { t } from '../../i18n/index.js';
import { BarChart } from '../../ui/components/BarChart';
import { Button } from '../../ui/components/Button';
import { card } from '../../ui/styles/classes';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { RescanBanner } from '../components/RescanBanner';
import { useDashboard } from '../context';
import { money, shortMoney } from '../format';
import { ChangeLine } from './overview/ChangeLine';


/** Tổng quan: Chi tiêu ròng, change vs last month, four metric tiles, spend per month, top shops. */
export function OverviewTab() {
  const { data, orders, range, selection, setSelection, resetRange, now } = useDashboard();
  const overview = useMemo(() => computeOverview(orders), [orders]);
  // The month-over-month figure looks at the whole history, anchored on the range's last day (never in the future).
  const anchor = useMemo(() => rangeEnd(range, now), [range, now]);
  const monthDiff = useMemo(() => monthChange(data.orders, anchor), [data, anchor]);
  const yearDiff = useMemo(() => yearChange(data.orders, anchor), [data, anchor]);
  // The chart always shows the whole history, so a picked month keeps its neighbours for comparison.
  const series = useMemo(() => {
    const monthly = computeOverview(data.orders).monthly;
    // "9/2026" -> the first and last instant of that month, to test against the range.
    const months = monthly.map(m => m.label.split('/').map(Number) as [number, number]);
    return {
      labels: monthly.map(m => m.label),
      values: monthly.map(m => m.total),
      months,
      active: months.map(([month, year]) =>
        !(range.end && new Date(year, month - 1, 1) > range.end) && !(range.start && new Date(year, month, 0, 23, 59, 59, 999) < range.start)),
    };
  }, [data, range]);
  const pickMonth = (i: number) => {
    const [month, year] = series.months[i];
    // Clicking the month already picked goes back to everything.
    if (selection.preset === 'month' && selection.month === month && selection.year === year) resetRange();
    else setSelection({ preset: 'month', year, month });
  };
  const stale = needsRescan(data.orders);

  if (orders.length === 0) return <NoOrdersInRange />;

  const { stats, topShops } = overview;
  const none = t('stats.none');
  const topAmount = topShops[0]?.amount || 1;
  const tiles = [
    { label: t('dash.overview.orders'), value: overview.orderCount.toLocaleString('vi-VN') },
    { label: t('dash.overview.average'), value: shortMoney(overview.averageOrderValue) },
    { label: t('stats.refund'), value: stale ? none : shortMoney(stats.refundTotal), note: stats.excludedCount ? t('stats.excluded', { count: stats.excludedCount }) : undefined },
    { label: t('stats.savings'), value: stale ? none : shortMoney(stats.estimatedSavings) },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @4xl:grid-cols-[2fr_1fr]">
      {stale && <RescanBanner className="@4xl:col-span-2" />}

      <section aria-label={t('stats.netSpend')} className="flex flex-col gap-4 @4xl:col-span-2 @5xl:flex-row @5xl:items-end @5xl:justify-between @5xl:gap-6">
        <div>
          <p className="text-sm font-medium text-muted">{t('stats.netSpend')}</p>
          <p data-testid="net-spend" className="num my-1 text-[clamp(2.125rem,7cqi,3.5rem)] font-semibold leading-tight tracking-tight">
            {money(stats.netSpend)}
          </p>
          <div className="grid gap-0.5">
            <ChangeLine unit="month" change={monthDiff} testId="month-change" />
            <ChangeLine unit="year" change={yearDiff} testId="year-change" />
          </div>
          <Button variant="outline" className="mt-3" onClick={() => downloadShareImage(stats, !stale)}>{t('stats.share')}</Button>
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line @2xl:grid-cols-4 @5xl:max-w-xl">
          {tiles.map(item => (
            <div key={item.label} className="bg-card px-3.5 py-3">
              <dt className="text-xs text-muted">{item.label}</dt>
              <dd className="num text-xl font-semibold">
                {item.value}
                {item.note && <span className="mt-0.5 block text-xs font-normal text-muted">{item.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <h2 className="text-base font-semibold">{t('chart.spendingByMonth')}</h2>
        <p className="mb-3 text-xs text-muted">{t('dash.chart.hint')}</p>
        <BarChart
          title={t('chart.spendingByMonth')}
          labels={series.labels}
          values={series.values}
          labelHeader={t('dash.chart.month')}
          valueHeader={t('dash.chart.spend')}
          formatValue={money}
          formatTick={shortMoney}
          active={series.active}
          onSelect={pickMonth}
        />
      </section>

      <section className={card}>
        <h2 className="mb-3 text-base font-semibold">{t('dash.overview.topShops')}</h2>
        <ol aria-label={t('dash.overview.topShops')} className="grid gap-3.5">
          {topShops.map((shop, i) => (
            <li key={shop.shopKey} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2.5 text-sm">
              <span className="text-muted">{i + 1}</span>
              <div className="min-w-0">
                <p className="truncate" title={shop.name}>{shop.name}</p>
                <div aria-hidden="true" className="mt-1 h-1.5 rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(shop.amount / topAmount) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-muted">{t('dash.overview.shopOrders', { n: shop.orders })}</p>
              </div>
              <span className="num font-semibold">{shortMoney(shop.amount)}</span>
            </li>
          ))}
        </ol>
      </section>

    </div>
  );
}
