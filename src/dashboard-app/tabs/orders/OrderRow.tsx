import { Fragment, type MouseEvent } from 'react';
import { getOrderUrl } from '../../../config.js';
import { formatDeliveryDate } from '../../../dashboard/delivery-date.js';
import { isExcludedOrder } from '../../../dashboard/order-status.js';
import { shopDisplayName } from '../../../dashboard/shop.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';
import { OrderDetail } from './OrderDetail';

/** Dot colour per status code: done, in transit, cancelled/returned; anything else is neutral. */
const STATUS_DOT: Record<number, string> = { 3: 'bg-good', 7: 'bg-warn-fg', 8: 'bg-warn-fg', 4: 'bg-bad', 12: 'bg-bad' };

const cell = '@5xl:table-cell @5xl:px-3 @5xl:py-2.5 @5xl:align-top';

/** One order: what was bought leads (that is what people recognise), the shop and order id sit under it. */
export function OrderRow({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const excluded = isExcludedOrder(order);
  const detailId = `order-detail-${order.orderId}`;
  // The whole row opens the detail; the button stays the keyboard and screen-reader control.
  const onRowClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button') || window.getSelection()?.toString()) return;
    onToggle();
  };
  return (
    <Fragment>
      <tr
        onClick={onRowClick}
        className="grid cursor-pointer grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-xl border border-line bg-card p-3 @5xl:table-row @5xl:rounded-none @5xl:border-0 @5xl:border-b @5xl:bg-transparent @5xl:p-0 @5xl:hover:bg-card"
      >
        <td className={`col-span-2 min-w-0 ${cell}`}>
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={expanded ? detailId : undefined}
              aria-label={t('orders.viewDetail', { id: order.orderId })}
              onClick={onToggle}
              className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted hover:text-fg"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-4 transition-transform ${expanded ? 'rotate-90' : ''}`}>
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="font-medium [overflow-wrap:anywhere]">{order.name}</p>
              <p className="flex flex-wrap gap-x-2 text-xs text-muted">
                <span className="[overflow-wrap:anywhere]">{shopDisplayName(order.shopName)}</span>
                <a href={getOrderUrl(order.orderId)} target="_blank" rel="noopener noreferrer" className="num underline decoration-muted underline-offset-2 hover:text-fg">
                  {order.orderId}
                </a>
              </p>
            </div>
          </div>
        </td>
        <td className={`${cell} whitespace-nowrap`}>{formatDeliveryDate(order, t('table.noDate'))}</td>
        <td className={cell}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${STATUS_DOT[order.statusCode] ?? 'bg-muted'}`} />
            <span>{order.status}</span>
            {excluded && <span className="inline-block whitespace-nowrap rounded border border-bad px-1.5 text-xs text-bad">{t('orders.excluded')}</span>}
          </div>
        </td>
        <td className={`num whitespace-nowrap ${cell} @5xl:text-right`}>
          <span className="text-muted @5xl:hidden">{t('table.col.quantity')}: </span>
          {order.productCount}
        </td>
        <td className={`num whitespace-nowrap ${cell} @5xl:text-right ${excluded ? 'text-muted line-through' : 'font-medium'}`}>{money(order.subTotal)}</td>
      </tr>
      {expanded && (
        <tr className="block @5xl:table-row">
          <td colSpan={5} className="block @5xl:table-cell">
            <OrderDetail order={order} id={detailId} excluded={excluded} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
