import { deliveryDateOf } from '../../../dashboard/delivery-date.js';
import { formatDateTime } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';

export function OrderDetail({ order, id, excluded }: { order: Order; id: string; excluded: boolean }) {
  const delivered = deliveryDateOf(order);
  return (
    <div id={id} role="region" aria-label={t('orders.detail', { id: order.orderId })} className="rounded-xl border border-line bg-bg p-3">
      {excluded && (
        <p className="mb-2 text-sm font-medium text-bad">
          {t('orders.excludedNote', { amount: money(order.refundAmount || order.subTotal) })}
        </p>
      )}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 text-sm">
        <dt className="text-muted">{t('table.detail.seller')}</dt>
        <dd>{order.shopName}</dd>
        {delivered && (
          <>
            <dt className="text-muted">{t('table.detail.deliveryDate')}</dt>
            <dd>{formatDateTime(delivered)}</dd>
          </>
        )}
        <dt className="text-muted">{t('table.detail.total')}</dt>
        <dd className="num">{money(order.subTotal)}</dd>
      </dl>
      {order.items?.length ? (
        <ul className="mt-2 divide-y divide-line text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 py-1">
              <span>{item.name}</span>
              <span className="num shrink-0 text-muted">
                {item.quantity} × {money(item.unitPrice)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm">{order.productSummary || order.name}</p>
      )}
    </div>
  );
}
