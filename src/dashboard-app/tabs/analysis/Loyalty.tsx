import { useMemo } from 'react';
import { analyzeShopLoyalty } from '../../../dashboard/shop-loyalty.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { card, chip } from '../../../ui/styles/classes';
import { money } from '../../format';

const dayOf = (key: string) => (key ? formatDate(new Date(`${key}T00:00:00`)) : t('stats.none'));

/**
 * Shops the user keeps coming back to, over the whole history (like insights, not cut by the date range).
 * A row opens that shop's orders: the name is the button, a click anywhere else on the row presses it.
 */
export function Loyalty({ orders, onSelect }: { orders: Order[]; onSelect: (shopKey: string) => void }) {
  const shops = useMemo(() => analyzeShopLoyalty(orders), [orders]);
  const title = t('analysis.loyalty.title');
  return (
    <section aria-labelledby="analysis-loyalty" className={`${card} min-w-0 @5xl:col-span-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="analysis-loyalty" className="text-base font-semibold">{title}</h3>
        <span className={chip}>{t('analysis.scope.all')}</span>
      </div>
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
                <th scope="col" className="w-5"><span className="sr-only">{t('orders.open')}</span></th>
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => (
                <tr key={shop.shopKey} onClick={() => onSelect(shop.shopKey)} className="cursor-pointer border-t border-line hover:bg-bg">
                  <th scope="row" className="max-w-56 py-1.5 pr-3 font-normal">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onSelect(shop.shopKey);
                      }}
                      title={shop.shopName}
                      aria-label={`${shop.shopName}, ${t('orders.open')}`}
                      className="block max-w-full cursor-pointer truncate rounded text-left hover:underline"
                    >
                      {shop.shopName}
                    </button>
                  </th>
                  <td className="px-3 py-1.5 text-right">{shop.orderCount}</td>
                  <td className="px-3 py-1.5 text-right">{money(shop.totalSpent)}</td>
                  <td className="px-3 py-1.5 text-right">{money(shop.avgOrderValue)}</td>
                  <td className="px-3 py-1.5 text-right">{shop.repeatRate === null ? t('stats.none') : t('analysis.loyalty.rate.unit', { n: shop.repeatRate.toLocaleString('vi-VN') })}</td>
                  <td className="py-1.5 pl-3 text-right">{dayOf(shop.lastOrder)}</td>
                  <td aria-hidden="true" className="pl-2 text-right text-muted">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
