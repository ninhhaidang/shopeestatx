import { useMemo } from 'react';
import { analyzeShopLoyalty } from '../../../dashboard/shop-loyalty.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';

const dayOf = (key: string) => (key ? formatDate(new Date(`${key}T00:00:00`)) : t('stats.none'));

/**
 * Shop thân thiết, warm variant: same analyzeShopLoyalty figures as Loyalty, read as a flowing
 * receipt list (name + amount lead, the rest in a muted meta line) instead of a table.
 */
export function LoyaltyWarm({ orders }: { orders: Order[] }) {
  const shops = useMemo(() => analyzeShopLoyalty(orders), [orders]);
  const title = t('analysis.loyalty.title');
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{title}</h2>
      <p className="mb-3 text-xs text-warm-muted">{t('analysis.loyalty.scope')}</p>
      {shops.length === 0 ? (
        <p className="text-warm-muted">{t('analysis.loyalty.empty')}</p>
      ) : (
        <ul aria-label={title} className="grid gap-3">
          {shops.map((shop) => (
            <li key={shop.shopName} className="border-b border-warm-line pb-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate">{shop.shopName}</span>
                <span className="shrink-0 font-serif">{money(shop.totalSpent)}</span>
              </div>
              <p className="mt-1 text-xs text-warm-muted">
                {t('analysis.loyalty.warmMeta', {
                  orders: shop.orderCount,
                  average: money(shop.avgOrderValue),
                  rate: t('analysis.loyalty.rate.unit', { n: shop.repeatRate.toLocaleString('vi-VN') }),
                  last: dayOf(shop.lastOrder),
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
