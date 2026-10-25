import { useMemo } from 'react';
import { computeOverview, monthChange, yearChange } from '../../../dashboard/overview.js';
import { rangeEnd } from '../../../dashboard/range.js';
import { downloadShareImage } from '../../../dashboard/share-image.js';
import { needsRescan } from '../../../dashboard/stats.js';
import { t } from '../../../i18n/index.js';
import { Button } from '../../../ui/components/Button';
import { NoOrdersInRange } from '../../components/NoOrdersInRange';
import { useDashboard } from '../../context';
import { money, shortMoney } from '../../format';

const changeSentence = (
  change: { label: string; current: number; percent: number | null; previousLabel: string },
  keys: { current: string; up: string; down: string; none: string },
) => {
  const up = (change.percent ?? 0) >= 0;
  const main = t(keys.current, { period: change.label, amount: money(change.current) });
  const delta =
    change.percent === null
      ? t(keys.none, { period: change.previousLabel })
      : t(up ? keys.up : keys.down, { change: Math.abs(change.percent).toLocaleString('vi-VN'), period: change.previousLabel });
  return `${main} · ${delta}`;
};

/**
 * Tổng quan, warm variant: net spend, month/year change, refund/savings and top shops as a
 * narrative column — same figures and chart data as OverviewTab, no grid of cards.
 */
export function OverviewTabWarm() {
  const { data, orders, range, now } = useDashboard();
  const overview = useMemo(() => computeOverview(orders), [orders]);
  const anchor = useMemo(() => rangeEnd(range, now), [range, now]);
  const monthDiff = useMemo(() => monthChange(data.orders, anchor), [data, anchor]);
  const yearDiff = useMemo(() => yearChange(data.orders, anchor), [data, anchor]);
  const stale = needsRescan(data.orders);

  if (orders.length === 0) return <NoOrdersInRange />;

  const { stats, monthly, topShops } = overview;
  const none = t('stats.none');
  const topAmount = topShops[0]?.amount || 1;
  const maxMonthly = Math.max(...monthly.map((m) => m.total), 1);

  return (
    <div className="style-warm mx-auto grid max-w-prose gap-7 py-2 font-serif text-[15px] leading-relaxed text-warm-fg">
      <section aria-label={t('stats.netSpend')}>
        <p className="text-sm tracking-wide text-warm-muted">{t('stats.netSpend')}</p>
        <p data-testid="net-spend" className="my-1 font-serif text-[clamp(2.125rem,7cqi,3.5rem)] font-semibold leading-tight tracking-tight">
          {money(stats.netSpend)}
        </p>
        <p data-testid="month-change" className="text-sm text-warm-muted">
          {changeSentence(monthDiff, { current: 'comparison.month', up: 'comparison.vsLastMonthUp', down: 'comparison.vsLastMonthDown', none: 'comparison.noLastMonth' })}
        </p>
        <p data-testid="year-change" className="text-sm text-warm-muted">
          {changeSentence(yearDiff, { current: 'comparison.year', up: 'comparison.vsLastYearUp', down: 'comparison.vsLastYearDown', none: 'comparison.noLastYear' })}
        </p>
      </section>

      <section aria-label={t('dash.overview.orders')}>
        <p>
          {t('dash.overview.orders')}: <b className="font-serif">{overview.orderCount.toLocaleString('vi-VN')}</b>, {t('dash.overview.average').toLowerCase()}{' '}
          <b className="font-serif">{shortMoney(overview.averageOrderValue)}</b>.
        </p>
        <p className="mt-1">
          {t('stats.refund')}: <b className="font-serif">{stale ? none : shortMoney(stats.refundTotal)}</b>
          {!stale && stats.excludedCount ? <span className="text-warm-muted"> ({t('stats.excluded', { count: stats.excludedCount })})</span> : null}
          {' · '}
          {t('stats.savings')}: <b className="font-serif">{stale ? none : shortMoney(stats.estimatedSavings)}</b>
        </p>
      </section>

      <section aria-label={t('chart.spendingByMonth')}>
        <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{t('chart.spendingByMonth')}</h2>
        <div className="flex items-end gap-1" style={{ height: '5rem' }}>
          {monthly.map((m) => (
            <div key={m.label} className="flex-1" title={`${m.label}: ${money(m.total)}`}>
              <div className="rounded-t bg-warm-accent" style={{ height: `${Math.max((m.total / maxMonthly) * 100, 2)}%` }} />
            </div>
          ))}
        </div>
      </section>

      <section aria-label={t('dash.overview.topShops')}>
        <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{t('dash.overview.topShops')}</h2>
        <ol aria-label={t('dash.overview.topShops')} className="grid gap-3">
          {topShops.map((shop, i) => (
            <li key={shop.name}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate">{i + 1}. {shop.name}</span>
                <span className="shrink-0 font-serif">{shortMoney(shop.amount)}</span>
              </div>
              <div className="relative h-1 overflow-hidden rounded-full bg-warm-line">
                <div className="absolute inset-y-0 left-0 rounded-full bg-warm-accent" style={{ width: `${(shop.amount / topAmount) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-warm-muted">{t('dash.overview.shopOrders', { n: shop.orders })}</p>
            </li>
          ))}
        </ol>
      </section>

      <div>
        <Button variant="outline" onClick={() => downloadShareImage(stats)}>{t('stats.share')}</Button>
      </div>
    </div>
  );
}
