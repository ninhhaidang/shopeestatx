import { useMemo, useState } from 'react';
import { computeOverview, monthChange, yearChange } from '../../dashboard/overview.js';
import { rangeEnd } from '../../dashboard/range.js';
import { needsRescan } from '../../dashboard/stats.js';
import { t } from '../../i18n/index.js';
import { Button } from '../../ui/components/Button';
import { MonthChart, MonthMatrix, type MonthPoint } from '../../ui/components/MonthChart';
import { RankList } from '../../ui/components/RankList';
import { card, segment, segments } from '../../ui/styles/classes';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { RescanBanner } from '../components/RescanBanner';
import { useDashboard } from '../context';
import { money, shortMoney } from '../format';
import { ChangeLine } from './overview/ChangeLine';
import { ShareDialog } from './overview/ShareDialog';

/** Tổng quan: Chi tiêu ròng with its comparisons and four figures, spend per month, top shops, share image. */
export function OverviewTab() {
  const { data, orders, range, selection, setSelection, resetRange, now } = useDashboard();
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [sharing, setSharing] = useState(false);
  const overview = useMemo(() => computeOverview(orders), [orders]);
  // The month-over-month figure looks at the whole history, anchored on the range's last day (never in the future).
  const anchor = useMemo(() => rangeEnd(range, now), [range, now]);
  const monthDiff = useMemo(() => monthChange(data.orders, anchor), [data, anchor]);
  const yearDiff = useMemo(() => yearChange(data.orders, anchor), [data, anchor]);
  // The chart always shows the whole history, so a picked month keeps its neighbours for comparison.
  const series = useMemo(() => {
    const points: MonthPoint[] = computeOverview(data.orders).monthly.map(m => {
      const [month, year] = m.label.split('/').map(Number);
      return { month, year, total: m.total };
    });
    return {
      points,
      active: points.map(({ month, year }) =>
        !(range.end && new Date(year, month - 1, 1) > range.end) && !(range.start && new Date(year, month, 0, 23, 59, 59, 999) < range.start)),
    };
  }, [data, range]);
  const stale = needsRescan(data.orders);

  if (orders.length === 0) return <NoOrdersInRange />;

  const pickMonth = (i: number) => {
    const { month, year } = series.points[i];
    // Picking the month already picked goes back to everything.
    if (selection.preset === 'month' && selection.month === month && selection.year === year) resetRange();
    else setSelection({ preset: 'month', year, month });
  };

  const { stats, topShops } = overview;
  const none = t('stats.none');
  const topAmount = topShops[0]?.amount || 1;
  const tiles = [
    { label: t('dash.overview.orders'), value: overview.orderCount.toLocaleString('vi-VN') },
    { label: t('dash.overview.average'), value: shortMoney(overview.averageOrderValue) },
    { label: t('stats.refund'), value: stale ? none : shortMoney(stats.refundTotal), note: stats.excludedCount ? t('stats.excluded', { count: stats.excludedCount }) : undefined },
    { label: t('stats.savings'), value: stale ? none : shortMoney(stats.estimatedSavings) },
  ];
  const chartTitle = t('chart.spendingByMonth');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @5xl:grid-cols-[minmax(0,1fr)_21rem] @7xl:grid-cols-[minmax(0,1fr)_25rem]">
      {stale && <RescanBanner className="col-span-full" />}

      <section aria-label={t('stats.netSpend')} className="col-span-full flex flex-col gap-4 @5xl:flex-row @5xl:items-end @5xl:justify-between @5xl:gap-8">
        <div>
          <p className="text-sm font-medium text-muted">{t('stats.netSpend')}</p>
          <p data-testid="net-spend" className="num my-1 text-[clamp(2.125rem,7cqi,3.75rem)] font-semibold leading-tight tracking-tight">
            {money(stats.netSpend)}
          </p>
          <div className="grid gap-0.5">
            <ChangeLine unit="month" change={monthDiff} testId="month-change" />
            <ChangeLine unit="year" change={yearDiff} testId="year-change" />
          </div>
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line @2xl:grid-cols-4 @5xl:max-w-3xl">
          {tiles.map(item => (
            <div key={item.label} className="bg-card px-4 py-3.5">
              <dt className="text-xs text-muted">{item.label}</dt>
              <dd className="num mt-0.5 text-2xl font-semibold">
                {item.value}
                {item.note && <span className="mt-0.5 block text-xs font-normal text-muted">{item.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            <h2 className="text-base font-semibold">{chartTitle}</h2>
            <p className="text-xs text-muted">{t('dash.chart.hint')}</p>
          </div>
          <div role="group" aria-label={t('dash.chart.view')} className={segments}>
            <button type="button" aria-pressed={view === 'chart'} onClick={() => setView('chart')} className={segment(view === 'chart')}>{t('dash.chart.showChart')}</button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')} className={segment(view === 'table')}>{t('dash.chart.showTable')}</button>
          </div>
        </div>
        {view === 'chart' ? (
          <MonthChart title={chartTitle} points={series.points} active={series.active} onSelect={pickMonth} formatValue={money} formatTick={shortMoney} />
        ) : (
          <MonthMatrix title={chartTitle} points={series.points} formatTick={shortMoney} />
        )}
      </section>

      <section className={`${card} flex flex-col`}>
        <h2 className="mb-4 text-base font-semibold">{t('dash.overview.topShops')}</h2>
        <RankList
          label={t('dash.overview.topShops')}
          rows={topShops.map(shop => ({
            key: shop.shopKey,
            name: shop.name,
            note: t('dash.overview.shopOrders', { n: shop.orders }),
            value: shortMoney(shop.amount),
            share: shop.amount / topAmount,
          }))}
        />
        <div className="mt-auto pt-5">
          <div className="border-t border-line pt-4">
          <p className="mb-2 text-xs text-muted">{t('share.pitch')}</p>
          <Button variant="outline" className="w-full py-2.5 font-medium" onClick={() => setSharing(true)}>{t('stats.share')}</Button>
          </div>
        </div>
      </section>

      {sharing && (
        <ShareDialog
          data={{ stats, financialAvailable: !stale, monthly: overview.monthly.map(m => m.total) }}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
