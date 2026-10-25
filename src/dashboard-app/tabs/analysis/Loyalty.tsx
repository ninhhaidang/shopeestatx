import { useMemo } from 'react';
import { analyzeShopLoyalty } from '../../../dashboard/shop-loyalty.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { card } from '../../../ui/styles/classes';
import { money } from '../../format';

const dayOf = (key: string) => (key ? formatDate(new Date(`${key}T00:00:00`)) : t('stats.none'));

/** Shops the user keeps coming back to, over the whole history (like insights, not cut by the date range). */
export function Loyalty({ orders }: { orders: Order[] }) {
  const shops = useMemo(() => analyzeShopLoyalty(orders), [orders]);
  const title = t('analysis.loyalty.title');
  return (
    <section aria-labelledby="analysis-loyalty" className={`${card} min-w-0 @5xl:col-span-6`}>
      <h2 id="analysis-loyalty" className="text-sm font-semibold">{title}</h2>
      <p className="mb-3 text-xs text-muted">{t('analysis.loyalty.scope')}</p>
      {shops.length === 0 ? (
        <p className="text-sm text-muted">{t('analysis.loyalty.empty')}</p>
      ) : (
        <div role="region" aria-label={title} tabIndex={0} className="overflow-x-auto rounded-lg">
          <table className="num w-full min-w-max text-left text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th scope="col" className="py-1 pr-3 font-medium">{t('analysis.loyalty.shop')}</th>
                <th scope="col" className="px-3 py-1 text-right font-medium">{t('analysis.loyalty.orders')}</th>
                <th scope="col" className="px-3 py-1 text-right font-medium">{t('analysis.loyalty.spent')}</th>
                <th scope="col" className="px-3 py-1 text-right font-medium">{t('analysis.loyalty.average')}</th>
                <th scope="col" className="px-3 py-1 text-right font-medium">{t('analysis.loyalty.rate')}</th>
                <th scope="col" className="py-1 pl-3 text-right font-medium">{t('analysis.loyalty.last')}</th>
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => (
                <tr key={shop.shopKey} className="border-t border-line">
                  <th scope="row" className="max-w-56 truncate py-1.5 pr-3 font-normal" title={shop.shopName}>{shop.shopName}</th>
                  <td className="px-3 py-1.5 text-right">{shop.orderCount}</td>
                  <td className="px-3 py-1.5 text-right">{money(shop.totalSpent)}</td>
                  <td className="px-3 py-1.5 text-right">{money(shop.avgOrderValue)}</td>
                  <td className="px-3 py-1.5 text-right">{t('analysis.loyalty.rate.unit', { n: shop.repeatRate.toLocaleString('vi-VN') })}</td>
                  <td className="py-1.5 pl-3 text-right">{dayOf(shop.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
