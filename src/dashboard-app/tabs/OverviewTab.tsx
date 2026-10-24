import { useMemo } from 'react';
import { computeOverview, monthChange } from '../../dashboard/overview.js';
import { rangeEnd } from '../../dashboard/range.js';
import { downloadShareImage } from '../../dashboard/share-image.js';
import { needsRescan } from '../../dashboard/stats.js';
import { formatCurrency } from '../../i18n/format.js';
import { t } from '../../i18n/index.js';
import { BarChart } from '../../ui/components/BarChart';
import { Button } from '../../ui/components/Button';
import { StateMessage } from '../../ui/components/StateMessage';
import { useDashboard } from '../context';

const card = 'rounded-2xl border border-line bg-card p-4 @2xl:p-5';
const money = (n: number) => formatCurrency(n);
const short = (n: number) => formatCurrency(n, true);

/** Tổng quan: Chi tiêu ròng, change vs last month, four metric tiles, spend per month, top shops. */
export function OverviewTab() {
  const { data, orders, range, now, resetRange, refresh } = useDashboard();
  const overview = useMemo(() => computeOverview(orders), [orders]);
  // The month-over-month figure looks at the whole history, anchored on the range's last day (never in the future).
  const change = useMemo(() => monthChange(data.orders, rangeEnd(range, now)), [data, range, now]);
  const series = useMemo(
    () => ({ labels: overview.monthly.map(m => m.label), values: overview.monthly.map(m => m.total) }),
    [overview],
  );
  const stale = needsRescan(data.orders);

  if (orders.length === 0) {
    return (
      <StateMessage
        title={t('dash.noOrdersInRange.title')}
        message={t('dash.noOrdersInRange.message')}
        action={{ label: t('dash.noOrdersInRange.action'), onClick: resetRange }}
      />
    );
  }

  const { stats, topShops } = overview;
  const none = t('stats.none');
  const topAmount = topShops[0]?.amount || 1;
  const up = (change.percent ?? 0) >= 0;
  const tiles = [
    { label: t('dash.overview.orders'), value: overview.orderCount.toLocaleString('vi-VN') },
    { label: t('dash.overview.average'), value: short(overview.averageOrderValue) },
    { label: t('stats.refund'), value: stale ? none : short(stats.refundTotal), note: stats.excludedCount ? t('stats.excluded', { count: stats.excludedCount }) : undefined },
    { label: t('stats.savings'), value: stale ? none : short(stats.estimatedSavings) },
  ];

  return (
    <div className="grid gap-4 @2xl:grid-cols-[2fr_1fr]">
      {stale && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg @2xl:col-span-2">
          <span>{t('stats.rescan')}</span>
          <Button variant="link" onClick={refresh}>{t('stats.rescan.btn')}</Button>
        </div>
      )}

      <section aria-label={t('stats.netSpend')} className="flex flex-col gap-4 @2xl:col-span-2 @2xl:flex-row @2xl:items-end @2xl:justify-between @2xl:gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted">{t('stats.netSpend')}</p>
          <p data-testid="net-spend" className="num my-1 text-[clamp(2.125rem,7cqi,3.5rem)] font-semibold leading-tight tracking-tight">
            {money(stats.netSpend)}
          </p>
          <p data-testid="month-change" className="text-sm">
            <span className="text-muted">{t('comparison.month', { month: change.label, amount: money(change.current) })}</span>
            {' · '}
            <span className={`font-semibold ${change.percent === null ? 'text-muted' : up ? 'text-bad' : 'text-good'}`}>
              {change.percent === null
                ? t('comparison.noLastMonth', { month: change.previousLabel })
                : t(up ? 'comparison.vsLastMonthUp' : 'comparison.vsLastMonthDown', {
                    change: Math.abs(change.percent).toLocaleString('vi-VN'),
                    month: change.previousLabel,
                  })}
            </span>
          </p>
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-2.5 @2xl:max-w-xl @2xl:grid-cols-4">
          {tiles.map(tileItem => (
            <div key={tileItem.label} className="rounded-xl border border-line bg-card px-3.5 py-3">
              <dt className="text-xs text-muted">{tileItem.label}</dt>
              <dd className="num text-xl font-semibold">{tileItem.value}</dd>
              {tileItem.note && <p className="text-xs text-muted">{tileItem.note}</p>}
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-semibold">{t('chart.spendingByMonth')}</h2>
        <BarChart
          title={t('chart.spendingByMonth')}
          labels={series.labels}
          values={series.values}
          labelHeader={t('dash.chart.month')}
          valueHeader={t('dash.chart.spend')}
          formatValue={money}
          formatTick={short}
        />
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-semibold">{t('dash.overview.topShops')}</h2>
        <ol aria-label={t('dash.overview.topShops')} className="grid gap-3.5">
          {topShops.map((shop, i) => (
            <li key={shop.name} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2.5 text-sm">
              <span className="text-muted">{i + 1}</span>
              <div className="min-w-0">
                <p className="truncate" title={shop.name}>{shop.name}</p>
                <div aria-hidden="true" className="mt-1 h-1.5 rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(shop.amount / topAmount) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-muted">{t('dash.overview.shopOrders', { n: shop.orders })}</p>
              </div>
              <span className="num font-semibold">{short(shop.amount)}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="@2xl:col-span-2">
        <Button variant="outline" onClick={() => downloadShareImage(stats)}>{t('stats.share')}</Button>
      </div>
    </div>
  );
}
