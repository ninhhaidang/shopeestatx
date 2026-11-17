import { deliveryDateOf } from '../../../dashboard/delivery-date.js';
import { formatDateTime } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';

/**
 * What the row cannot show: delivery time, each item with its line total and, when items cost more than
 * was paid, the Tiết kiệm ước tính (glossary). Shop and total are already on the row above.
 */
export function OrderDetail({ order, id, excluded }: { order: Order; id: string; excluded: boolean }) {
  const delivered = deliveryDateOf(order);
  // Same rule as the overview figure: only kept orders with a known items total.
  const saved = !excluded && order.itemsTotal !== undefined ? order.itemsTotal - order.subTotal : 0;
  return (
    <div id={id} role="region" aria-label={t('orders.detail', { id: order.orderId })} className="rounded-xl border border-line bg-bg p-3 @5xl:px-4">
      {excluded && (
        <p className="mb-2 text-sm font-medium text-bad">
          {t('orders.excludedNote', { amount: money(order.refundAmount || order.subTotal) })}
        </p>
      )}
      {delivered && (
        <dl className="mb-2 flex gap-x-6 text-sm">
          <dt className="text-muted">{t('table.detail.deliveryDate')}</dt>
          <dd>{formatDateTime(delivered)}</dd>
        </dl>
      )}
      {order.items?.length ? (
        <ul className="divide-y divide-line border-y border-line text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-x-6 py-1.5">
              <span className="min-w-0 flex-1">{item.name}</span>
              <span className="num flex shrink-0 gap-6">
                <span className="text-muted">{item.quantity} × {money(item.unitPrice)}</span>
                <span className="w-28 text-right">{money(item.quantity * item.unitPrice)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">{order.productSummary || order.name}</p>
      )}
      {saved > 0 && (
        <dl className="num mt-2 grid grid-cols-[1fr_auto] gap-x-6 gap-y-0.5 text-right text-sm">
          <dt className="text-muted">{t('orders.detail.itemsTotal')}</dt>
          <dd className="w-28">{money(order.itemsTotal!)}</dd>
          <dt className="text-muted">{t('table.detail.total')}</dt>
          <dd className="font-semibold">{money(order.subTotal)}</dd>
          <dt className="text-muted">{t('stats.savings')}</dt>
          <dd className="font-semibold text-good">
            {money(saved)} ({Math.round((saved / order.itemsTotal!) * 100)}%)
          </dd>
        </dl>
      )}
    </div>
  );
}
