import { useId, useMemo, type ReactNode } from 'react';
import { computeStats, needsRescan, type Stats } from '../../dashboard/stats.js';
import { t } from '../../i18n/index.js';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { RescanBanner } from '../components/RescanBanner';
import { useDashboard } from '../context';
import { money } from '../format';
import { card } from '../../ui/styles/classes';

import { Budget } from './analysis/Budget';
import { Heatmap } from './analysis/Heatmap';
import { Insights } from './analysis/Insights';
import { Loyalty } from './analysis/Loyalty';

function Habits({ stats }: { stats: Stats }) {
  const none = t('stats.none');
  const tiles = [
    { label: t('stats.weekday'), value: stats.busiestWeekday === null ? none : t(`stats.weekday.${stats.busiestWeekday}`) },
    { label: t('stats.hour'), value: stats.busiestHour === null ? none : `${stats.busiestHour}:00 – ${stats.busiestHour + 1}:00` },
    { label: t('stats.streak'), value: stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : none },
    { label: t('stats.rate'), value: stats.dailySpendRate ? t('stats.rate.unit', { amount: money(stats.dailySpendRate) }) : none },
  ];
  return (
    <section aria-labelledby="analysis-habits" className={`${card} min-w-0 @5xl:col-span-2`}>
      <h3 id="analysis-habits" className="text-base font-semibold">{t('analysis.habits')}</h3>
      <p className="mb-3 text-xs text-muted">{t('stats.date.hint')}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 @5xl:grid-cols-1">
        {tiles.map(item => (
          <div key={item.label} className="border-t border-line pt-2.5">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="num text-lg font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ProductList({ title, rows }: { title: string; rows: { name: string; value: string }[] }) {
  return (
    <section aria-label={title} className={`${card} min-w-0 @5xl:col-span-2`}>
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t('analysis.noProducts')}</p>
      ) : (
        <ol aria-label={title} className="grid gap-2.5">
          {rows.map((row, i) => (
            <li key={row.name} className="grid grid-cols-[1.25rem_1fr_auto] items-baseline gap-2.5 text-sm">
              <span className="text-muted">{i + 1}</span>
              <span className="truncate" title={row.name}>{row.name}</span>
              <span className="num font-semibold">{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** A group of cards that share one scope, named so nobody has to read each card's small print. */
function Band({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @5xl:grid-cols-6">{children}</div>
    </section>
  );
}

/** Phân tích: spending habits, products, insights, heatmap, prediction and the monthly budget. */
export function AnalysisTab() {
  const { data, orders, range, now } = useDashboard();
  const stats = useMemo(() => computeStats(orders), [orders]);
  const stale = needsRescan(data.orders);

  if (orders.length === 0) return <NoOrdersInRange />;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      {stale && <RescanBanner />}
      <Band title={t('analysis.band.range')}>
        <Habits stats={stats} />
        <ProductList
          title={t('stats.topQuantity')}
          rows={stale ? [] : stats.topByQuantity.map(p => ({ name: p.name, value: t('stats.quantity.unit', { n: p.quantity }) }))}
        />
        <ProductList
          title={t('stats.priciest')}
          rows={stale ? [] : stats.priciest.map(p => ({ name: p.name, value: money(p.unitPrice) }))}
        />
        <Heatmap orders={data.orders} range={range} now={now} />
      </Band>
      <Band title={t('analysis.band.history')}>
        <div className="min-w-0 @5xl:col-span-3"><Insights orders={data.orders} now={now} /></div>
        <div className="min-w-0 @5xl:col-span-3"><Budget allOrders={data.orders} now={now} /></div>
        <Loyalty orders={data.orders} />
      </Band>
    </div>
  );
}
