import { useMemo } from 'react';
import { computeOverview } from '../../../dashboard/overview.js';
import { downloadShareImage } from '../../../dashboard/share-image.js';
import { needsRescan } from '../../../dashboard/stats.js';
import { t } from '../../../i18n/index.js';
import { Button } from '../../../ui/components/Button';
import { NoOrdersInRange } from '../../components/NoOrdersInRange';
import { useDashboard } from '../../context';
import { money, shortMoney } from '../../format';

const SHOP_TONES = ['bg-warm-b1', 'bg-warm-b2', 'bg-warm-b3', 'bg-warm-b4', 'bg-warm-b5'];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 150;

/**
 * Tổng quan, warm variant: single narrative column matching prototype/overview Variant B
 * (commit 55395c1) — greeting, serif net-spend, flowing summary sentence, a smooth area chart
 * and a single segmented bar + legend for top-shop share, instead of a card grid.
 */
export function OverviewTabWarm() {
  const { data, orders } = useDashboard();
  const overview = useMemo(() => computeOverview(orders), [orders]);
  const stale = needsRescan(data.orders);

  if (orders.length === 0) return <NoOrdersInRange />;

  const { stats, monthly, topShops } = overview;
  const none = t('stats.none');
  const userName = data.user?.username || data.user?.name;

  const maxMonthly = Math.max(...monthly.map((m) => m.total), 1);
  const step = monthly.length > 1 ? CHART_WIDTH / (monthly.length - 1) : CHART_WIDTH;
  const points = monthly.map((m, i) => [i * step, CHART_HEIGHT - 10 - (m.total / maxMonthly) * (CHART_HEIGHT - 30)]);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;

  const topTotal = topShops.reduce((s, shop) => s + shop.amount, 0) || 1;

  return (
    <div className="mx-auto flex max-w-prose flex-col gap-7 py-2 font-serif text-[15px] leading-relaxed text-warm-fg">
      <section>
        {userName && <p className="text-sm text-warm-muted">{t('dash.overview.warmGreeting', { name: userName })}</p>}
        <p data-testid="net-spend" className="my-1 font-serif text-[clamp(2.125rem,7cqi,3.5rem)] font-semibold leading-tight tracking-tight">
          {money(stats.netSpend)}
        </p>
        <p>
          {t('dash.overview.warmOrdersLead')} <b className="font-serif">{overview.orderCount.toLocaleString('vi-VN')}</b>{' '}
          {t('dash.overview.warmOrdersUnit')} <b className="font-serif">{shortMoney(overview.averageOrderValue)}</b>{' '}
          {t('dash.overview.warmPerOrder')} {t('dash.overview.warmRefundLead')}{' '}
          <b className="font-serif">{stale ? none : shortMoney(stats.refundTotal)}</b>
          {!stale && stats.excludedCount ? <span className="text-warm-muted"> ({t('stats.excluded', { count: stats.excludedCount })})</span> : null}{' '}
          {t('dash.overview.warmSavingsLead')} <b className="font-serif">{stale ? none : shortMoney(stats.estimatedSavings)}</b>.
        </p>
      </section>

      <section aria-label={t('chart.spendingByMonth')}>
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" className="h-[150px] w-full" aria-hidden="true">
          <path d={area} className="fill-warm-accent opacity-[0.14]" />
          <path d={line} fill="none" className="stroke-warm-accent" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {monthly.length > 0 && (
          <div className="mt-1 flex justify-between text-xs text-warm-muted">
            <span>{monthly[0].label}</span>
            <span>{monthly[monthly.length - 1].label}</span>
          </div>
        )}
      </section>

      <section aria-label={t('dash.overview.warmSpendBreakdown')}>
        <h2 className="mb-3.5 text-xl font-medium">{t('dash.overview.warmSpendBreakdown')}</h2>
        <div className="flex h-[18px] gap-0.5 overflow-hidden rounded-full">
          {topShops.map((shop, i) => (
            <div key={shop.name} title={shop.name} className={SHOP_TONES[i % SHOP_TONES.length]} style={{ flex: shop.amount }} />
          ))}
        </div>
        <ul aria-label={t('dash.overview.warmSpendBreakdown')} className="mt-4 grid grid-cols-1 gap-x-7 gap-y-2.5 @lg:grid-cols-2">
          {topShops.map((shop, i) => (
            <li key={shop.name} className="flex items-center gap-2.5 border-b border-warm-line pb-2.5 text-sm">
              <span className={`size-2.5 shrink-0 rounded-full ${SHOP_TONES[i % SHOP_TONES.length]}`} />
              <span className="flex-1 truncate">{shop.name}</span>
              <b className="font-sans tabular-nums">{Math.round((shop.amount / topTotal) * 100)}%</b>
            </li>
          ))}
        </ul>
      </section>

      <div>
        <Button variant="outline" onClick={() => downloadShareImage(stats)}>{t('stats.share')}</Button>
      </div>
    </div>
  );
}
