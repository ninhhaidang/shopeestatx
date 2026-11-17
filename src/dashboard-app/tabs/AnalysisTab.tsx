import { useMemo, useState } from 'react';
import { computeStats, needsRescan, type Stats } from '../../dashboard/stats.js';
import { t } from '../../i18n/index.js';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { RescanBanner } from '../components/RescanBanner';
import { useDashboard } from '../context';
import { money } from '../format';
import { RankList } from '../../ui/components/RankList';
import { card, segment, segments } from '../../ui/styles/classes';

import { Budget } from './analysis/Budget';
import { Heatmap } from './analysis/Heatmap';
import { Insights } from './analysis/Insights';
import { Loyalty } from './analysis/Loyalty';

/** Rows a product list shows before "see all". */
const SHORT_LIST = 5;

/** Four habit figures: tiles in a row, or a ruled list when the card stands beside the heatmap. */
function Habits({ stats }: { stats: Stats }) {
  const none = t('stats.none');
  const tiles = [
    { label: t('stats.weekday'), value: stats.busiestWeekday === null ? none : t(`stats.weekday.${stats.busiestWeekday}`) },
    { label: t('stats.hour'), value: stats.busiestHour === null ? none : `${stats.busiestHour}:00 – ${stats.busiestHour + 1}:00` },
    { label: t('stats.streak'), value: stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : none },
    { label: t('stats.rate'), value: stats.dailySpendRate ? t('stats.rate.unit', { amount: money(stats.dailySpendRate) }) : none },
  ];
  return (
    <section aria-labelledby="analysis-habits" className={`${card} flex min-w-0 flex-col @5xl:col-span-6 @7xl:col-span-2`}>
      <h3 id="analysis-habits" className="text-base font-semibold">{t('analysis.habits')}</h3>
      <p className="mb-3 text-xs text-muted">{t('stats.date.hint')}</p>
      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 @3xl:grid-cols-4 @7xl:auto-rows-fr @7xl:grid-cols-1 @7xl:gap-0 @7xl:divide-y @7xl:divide-line">
        {tiles.map(item => (
          <div key={item.label} className="@7xl:flex @7xl:items-center @7xl:justify-between @7xl:gap-4 @7xl:py-2">
            <dt className="text-xs text-muted @7xl:text-sm">{item.label}</dt>
            <dd className="num mt-0.5 text-lg font-semibold @7xl:mt-0 @7xl:text-right">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

interface ProductRows {
  title: string;
  rows: { name: string; value: string; share: number }[];
}

/** Most bought and priciest share one card: a switch picks the ranking, and it starts short. */
function Products({ quantity, price }: { quantity: ProductRows; price: ProductRows }) {
  const [by, setBy] = useState<'quantity' | 'price'>('quantity');
  const [all, setAll] = useState(false);
  const { title, rows } = by === 'quantity' ? quantity : price;
  return (
    <section aria-labelledby="analysis-products" className={`${card} min-w-0 @5xl:col-span-2`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 id="analysis-products" className="text-base font-semibold">{t('analysis.products')}</h3>
        <div role="group" aria-label={t('analysis.products.by')} className={segments}>
          <button type="button" aria-pressed={by === 'quantity'} onClick={() => setBy('quantity')} className={segment(by === 'quantity')}>{t('analysis.products.quantity')}</button>
          <button type="button" aria-pressed={by === 'price'} onClick={() => setBy('price')} className={segment(by === 'price')}>{t('analysis.products.price')}</button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t('analysis.noProducts')}</p>
      ) : (
        <>
          <RankList label={title} rows={(all ? rows : rows.slice(0, SHORT_LIST)).map(row => ({ ...row, key: row.name }))} />
          {rows.length > SHORT_LIST && (
            <button type="button" aria-expanded={all} onClick={() => setAll(!all)} className="mt-4 cursor-pointer rounded text-sm text-muted underline underline-offset-2 hover:text-fg">
              {all ? t('analysis.products.less') : t('analysis.products.more', { n: rows.length })}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Phân tích, wide: three rows of a broad card and a narrow one. This month (insights, budget), when
 * (heatmap, habits), where and what (repeat shops, products). Narrow: the same cards in one column.
 * Habits and products follow the selected range; the other cards say which period they cover.
 */
export function AnalysisTab() {
  const { data, orders, range, now } = useDashboard();
  const stats = useMemo(() => computeStats(orders), [orders]);
  const stale = needsRescan(data.orders);

  if (orders.length === 0) return <NoOrdersInRange />;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @5xl:grid-cols-6">
      {stale && <RescanBanner className="col-span-full" />}
      <div className="min-w-0 @5xl:col-span-4"><Insights orders={data.orders} now={now} /></div>
      <div className="min-w-0 @5xl:col-span-2"><Budget allOrders={data.orders} now={now} /></div>
      <Heatmap orders={data.orders} range={range} now={now} />
      <Habits stats={stats} />
      <Loyalty orders={data.orders} />
      <Products
        quantity={{
          title: t('stats.topQuantity'),
          rows: stale ? [] : stats.topByQuantity.map(p => ({ name: p.name, value: t('stats.quantity.unit', { n: p.quantity }), share: p.quantity / (stats.topByQuantity[0]?.quantity || 1) })),
        }}
        price={{
          title: t('stats.priciest'),
          rows: stale ? [] : stats.priciest.map(p => ({ name: p.name, value: money(p.unitPrice), share: p.unitPrice / (stats.priciest[0]?.unitPrice || 1) })),
        }}
      />
    </div>
  );
}
