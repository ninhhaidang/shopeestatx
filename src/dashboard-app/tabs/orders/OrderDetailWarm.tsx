import { formatDateTime } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';

export function OrderDetailWarm({ order, id, excluded }: { order: Order; id: string; excluded: boolean }) {
  return (
    <div id={id} role="region" aria-label={t('orders.detail', { id: order.orderId })} className="rounded-xl border border-warm-line bg-warm-bg p-3 text-sm">
      {excluded && (
        <p className="mb-2 font-medium text-bad">
          {t('orders.excludedNote', { amount: money(order.refundAmount || order.subTotal) })}
        </p>
      )}
      <dl className="grid gap-x-6 gap-y-1 @2xl:grid-cols-2">
        <dt className="text-warm-muted">{t('table.detail.seller')}</dt>
        <dd>{order.shopName}</dd>
        {order.deliveryDate && (
          <>
            <dt className="text-warm-muted">{t('table.detail.deliveryDate')}</dt>
            <dd>{formatDateTime(new Date(order.deliveryDate))}</dd>
          </>
        )}
        <dt className="text-warm-muted">{t('table.detail.total')}</dt>
        <dd className="font-serif">{money(order.subTotal)}</dd>
      </dl>
      {order.items?.length ? (
        <ul className="mt-2 divide-y divide-warm-line">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 py-1">
              <span>{item.name}</span>
              <span className="shrink-0 font-serif text-warm-muted">
                {item.quantity} × {money(item.unitPrice)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">{order.productSummary || order.name}</p>
      )}
    </div>
  );
}
