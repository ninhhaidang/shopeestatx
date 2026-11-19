import { useMemo } from 'react';
import { analyzeShopLoyalty } from '../../../dashboard/shop-loyalty.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { card, chip } from '../../../ui/styles/classes';
import { money } from '../../format';

/** Narrow: one running line of figures under the shop name, dot-separated. Wide: a right-aligned cell. */
const detail = 'inline text-xs text-muted @3xl:table-cell @3xl:px-3 @3xl:py-1.5 @3xl:text-right @3xl:text-sm @3xl:text-fg';
const dot = "after:mx-1 after:content-['·'] @3xl:after:content-none";
const label = (key: 'orders' | 'average' | 'rate' | 'last') => <span className="@3xl:hidden">{t(`analysis.loyalty.${key}`)} </span>;

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
        // relative: keeps the absolute sr-only header inside the scroller, or it widens <main>.
        <div role="region" aria-label={title} tabIndex={0} className="relative rounded-lg @3xl:overflow-x-auto">
          {/* Narrow widths turn each row into a block with labelled figures; the header is for screen readers only. */}
          <table className="num block w-full text-left text-sm @3xl:table @3xl:min-w-max">
            <thead className="sr-only @3xl:not-sr-only @3xl:table-header-group">
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
            <tbody className="block @3xl:table-row-group">
              {shops.map(shop => (
                <tr
                  key={shop.shopKey}
                  onClick={() => onSelect(shop.shopKey)}
                  className="relative block cursor-pointer border-t border-line py-2 hover:bg-bg @3xl:table-row @3xl:py-0"
                >
                  <th scope="row" className="block pr-28 font-medium @3xl:table-cell @3xl:max-w-56 @3xl:py-1.5 @3xl:pr-3 @3xl:font-normal">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onSelect(shop.shopKey);
                      }}
                      title={shop.shopName}
                      aria-label={`${shop.shopName}, ${t('orders.open')}`}
                      className="block max-w-full cursor-pointer rounded text-left break-words hover:underline @3xl:truncate"
                    >
                      {shop.shopName}
                    </button>
                  </th>
                  <td className={`${detail} ${dot}`}>{label('orders')}{shop.orderCount}</td>
                  <td className="absolute top-2 right-0 text-right font-semibold @3xl:static @3xl:table-cell @3xl:px-3 @3xl:py-1.5 @3xl:font-normal">{money(shop.totalSpent)}</td>
                  <td className={`${detail} ${dot}`}>{label('average')}{money(shop.avgOrderValue)}</td>
                  <td className={`${detail} ${dot}`}>
                    {label('rate')}
                    {shop.repeatRate === null ? t('stats.none') : t('analysis.loyalty.rate.unit', { n: shop.repeatRate.toLocaleString('vi-VN') })}
                  </td>
                  <td className={`${detail} @3xl:pr-0 @3xl:pl-3`}>{label('last')}{dayOf(shop.lastOrder)}</td>
                  <td aria-hidden="true" className="hidden pl-2 text-right text-muted @3xl:table-cell">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
