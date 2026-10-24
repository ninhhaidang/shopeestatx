import { useMemo } from 'react';
import { generateInsights } from '../../../dashboard/insights.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { card } from './styles';

/** Auto-written observations about the orders in range. */
export function Insights({ orders, now }: { orders: Order[]; now: Date }) {
  const insights = useMemo(() => generateInsights(orders, now), [orders, now]);
  return (
    <section aria-labelledby="analysis-insights" className={card}>
      <h2 id="analysis-insights" className="mb-3 text-sm font-semibold">{t('insights.title')}</h2>
      {insights.length === 0 ? (
        <p className="text-sm text-muted">{t('insights.empty')}</p>
      ) : (
        <ul aria-label={t('insights.title')} className="grid gap-2.5 text-sm">
          {insights.map(text => (
            <li key={text} className="rounded-lg bg-bg px-3 py-2">{text}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
