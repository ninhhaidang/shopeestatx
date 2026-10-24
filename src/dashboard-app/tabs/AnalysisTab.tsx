import { useMemo } from 'react';
import { computeStats, needsRescan, type Stats } from '../../dashboard/stats.js';
import { formatCurrency } from '../../i18n/format.js';
import { t } from '../../i18n/index.js';
import { Button } from '../../ui/components/Button';
import { StateMessage } from '../../ui/components/StateMessage';
import { useDashboard } from '../context';

import { Budget } from './analysis/Budget';
import { Heatmap } from './analysis/Heatmap';
import { Insights } from './analysis/Insights';
import { card } from '../../ui/styles/classes';
const money = (n: number) => formatCurrency(n);

function Habits({ stats }: { stats: Stats }) {
  const none = t('stats.none');
  const tiles = [
    { label: t('stats.weekday'), value: stats.busiestWeekday === null ? none : t(`stats.weekday.${stats.busiestWeekday}`) },
    { label: t('stats.hour'), value: stats.busiestHour === null ? none : `${stats.busiestHour}:00 – ${stats.busiestHour + 1}:00` },
    { label: t('stats.streak'), value: stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : none },
    { label: t('stats.rate'), value: stats.dailySpendRate ? t('stats.rate.unit', { amount: money(stats.dailySpendRate) }) : none },
  ];
  return (
    <section aria-labelledby="analysis-habits" className={card}>
      <h2 id="analysis-habits" className="text-sm font-semibold">{t('analysis.habits')}</h2>
      <p className="mb-3 text-xs text-muted">{t('stats.date.hint')}</p>
      <dl className="grid grid-cols-2 gap-2.5">
        {tiles.map(tileItem => (
          <div key={tileItem.label} className="rounded-xl border border-line px-3.5 py-3">
            <dt className="text-xs text-muted">{tileItem.label}</dt>
            <dd className="num text-lg font-semibold">{tileItem.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ProductList({ title, rows }: { title: string; rows: { name: string; value: string }[] }) {
  return (
    <section aria-label={title} className={card}>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
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

/** Phân tích: spending habits, products, insights, heatmap, prediction and the monthly budget. */
export function AnalysisTab() {
  const { data, orders, range, now, resetRange, refresh } = useDashboard();
  const stats = useMemo(() => computeStats(orders), [orders]);
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

  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      {stale && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg @2xl:col-span-2">
          <span>{t('stats.rescan')}</span>
          <Button variant="link" onClick={refresh}>{t('stats.rescan.btn')}</Button>
        </div>
      )}
      <Insights orders={data.orders} now={now} />
      <Budget allOrders={data.orders} now={now} />
      <Habits stats={stats} />
      <Heatmap orders={data.orders} range={range} now={now} />
      <div className="grid content-start gap-4">
        <ProductList
          title={t('stats.topQuantity')}
          rows={stale ? [] : stats.topByQuantity.map(p => ({ name: p.name, value: t('stats.quantity.unit', { n: p.quantity }) }))}
        />
        <ProductList
          title={t('stats.priciest')}
          rows={stale ? [] : stats.priciest.map(p => ({ name: p.name, value: money(p.unitPrice) }))}
        />
      </div>
    </div>
  );
}
