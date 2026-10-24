import { Fragment } from 'react';
import { getOrderUrl } from '../../../config.js';
import { isExcludedOrder } from '../../../dashboard/order-status.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';
import { OrderDetail } from './OrderDetail';

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
            <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
          </button>
          <a href={getOrderUrl(order.orderId)} target="_blank" rel="noopener noreferrer" className="num text-accent-text underline underline-offset-2">
            {order.orderId}
          </a>
        </td>
        <td className={`${cell} whitespace-nowrap`}>{order.deliveryDate ? formatDate(new Date(order.deliveryDate)) : t('table.noDate')}</td>
        <td className={cell}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{order.status}</span>
            {excluded && <span className="inline-block whitespace-nowrap rounded border border-bad px-1.5 text-xs text-bad">{t('orders.excluded')}</span>}
          </div>
        </td>
        <td className={`col-span-2 min-w-0 [overflow-wrap:anywhere] ${cell}`}>{order.name}</td>
        <td className={`num whitespace-nowrap ${cell} @5xl:text-right`}>{order.productCount}</td>
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
