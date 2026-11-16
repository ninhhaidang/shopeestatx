import { Fragment } from 'react';
import { getOrderUrl } from '../../../config.js';
import { formatDeliveryDate } from '../../../dashboard/delivery-date.js';
import { isExcludedOrder } from '../../../dashboard/order-status.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';
import { OrderDetail } from './OrderDetail';

/** Dot colour per status code: done, in transit, cancelled/returned; anything else is neutral. */
const STATUS_DOT: Record<number, string> = { 3: 'bg-good', 7: 'bg-warn-fg', 8: 'bg-warn-fg', 4: 'bg-bad', 12: 'bg-bad' };

const cell = '@5xl:table-cell @5xl:px-3 @5xl:py-2';

export function OrderRow({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const excluded = isExcludedOrder(order);
  const detailId = `order-detail-${order.orderId}`;
  return (
    <Fragment>
      <tr className="grid grid-cols-[1fr_auto] gap-x-3 rounded-xl border border-line bg-card p-3 @5xl:table-row @5xl:rounded-none @5xl:border-0 @5xl:border-b @5xl:bg-transparent @5xl:p-0">
        <td className={`${cell} whitespace-nowrap`}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={expanded ? detailId : undefined}
            aria-label={t('orders.viewDetail', { id: order.orderId })}
            onClick={onToggle}
            className="mr-2 inline-flex size-6 cursor-pointer items-center justify-center text-muted"
          >
            <span aria-hidden="true" className="text-lg leading-none">{expanded ? '▾' : '▸'}</span>
          </button>
          <a href={getOrderUrl(order.orderId)} target="_blank" rel="noopener noreferrer" className="num underline decoration-muted underline-offset-2 hover:decoration-fg">
            {order.orderId}
          </a>
        </td>
        <td className={`${cell} whitespace-nowrap`}>{formatDeliveryDate(order, t('table.noDate'))}</td>
        <td className={cell}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${STATUS_DOT[order.statusCode] ?? 'bg-muted'}`} />
            <span>{order.status}</span>
            {excluded && <span className="inline-block whitespace-nowrap rounded border border-bad px-1.5 text-xs text-bad">{t('orders.excluded')}</span>}
          </div>
        </td>
        <td className={`col-span-2 min-w-0 [overflow-wrap:anywhere] ${cell}`}>{order.name}</td>
        <td className={`num whitespace-nowrap ${cell} @5xl:text-right`}>
          <span className="text-muted @5xl:hidden">{t('table.col.quantity')}: </span>
          {order.productCount}
        </td>
        <td className={`num whitespace-nowrap ${cell} @5xl:text-right ${excluded ? 'text-muted line-through' : ''}`}>{money(order.subTotal)}</td>
      </tr>
      {expanded && (
        <tr className="block @5xl:table-row">
          <td colSpan={6} className="block @5xl:table-cell">
            <OrderDetail order={order} id={detailId} excluded={excluded} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
