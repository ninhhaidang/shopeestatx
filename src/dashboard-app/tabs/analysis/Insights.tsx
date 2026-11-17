import { useMemo } from 'react';
import { generateInsights } from '../../../dashboard/insights.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { card, chip } from '../../../ui/styles/classes';

/** Auto-written observations about the whole order history (they compare this month with last month). */
export function Insights({ orders, now }: { orders: Order[]; now: Date }) {
  const insights = useMemo(() => generateInsights(orders, now), [orders, now]);
  return (
    <section aria-labelledby="analysis-insights" className={`${card} h-full`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 id="analysis-insights" className="text-base font-semibold">{t('insights.title')}</h3>
        <span className={chip}>{t('analysis.scope.all')}</span>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-muted">{t('insights.empty')}</p>
      ) : (
        <ul aria-label={t('insights.title')} className="divide-y divide-line text-sm">
          {insights.map(text => (
            <li key={text} className="py-2.5 first:pt-0 last:pb-0">{text}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
