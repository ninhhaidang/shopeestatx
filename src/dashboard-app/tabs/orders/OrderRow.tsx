import { Fragment } from 'react';
import { getOrderUrl } from '../../../config.js';
import { isExcludedOrder } from '../../../dashboard/order-status.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';
import { OrderDetail } from './OrderDetail';

const cell = '@2xl:table-cell @2xl:px-3 @2xl:py-2';

export function OrderRow({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const excluded = isExcludedOrder(order);
  const detailId = `order-detail-${order.orderId}`;
  return (
    <Fragment>
      <tr className="grid grid-cols-[1fr_auto] gap-x-3 rounded-xl border border-line bg-card p-3 @2xl:table-row @2xl:rounded-none @2xl:border-0 @2xl:border-b @2xl:bg-transparent @2xl:p-0">
        <td className={cell}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={expanded ? detailId : undefined}
            aria-label={t('orders.viewDetail', { id: order.orderId })}
            onClick={onToggle}
            className="mr-2 cursor-pointer text-muted"
          >
            <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
          </button>
          <a href={getOrderUrl(order.orderId)} target="_blank" rel="noopener noreferrer" className="num text-accent-text underline underline-offset-2">
            {order.orderId}
          </a>
        </td>
        <td className={cell}>{order.deliveryDate ? formatDate(new Date(order.deliveryDate)) : t('table.noDate')}</td>
        <td className={cell}>
          {order.status}
          {excluded && <span className="ml-2 rounded border border-bad px-1.5 text-xs text-bad">{t('orders.excluded')}</span>}
        </td>
        <td className={`col-span-2 ${cell}`}>{order.name}</td>
        <td className={`num ${cell} @2xl:text-right`}>{order.productCount}</td>
        <td className={`num ${cell} @2xl:text-right ${excluded ? 'text-muted line-through' : ''}`}>{money(order.subTotal)}</td>
      </tr>
      {expanded && (
        <tr className="block @2xl:table-row">
          <td colSpan={6} className="block @2xl:table-cell">
            <OrderDetail order={order} id={detailId} excluded={excluded} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
