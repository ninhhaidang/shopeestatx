import { Fragment, type MouseEvent } from 'react';
import { getOrderUrl } from '../../../config.js';
import { formatDeliveryDate } from '../../../dashboard/delivery-date.js';
import { isExcludedOrder } from '../../../dashboard/order-status.js';
import { shopDisplayName } from '../../../dashboard/shop.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';
import { OrderDetail } from './OrderDetail';

/** Badge hue per status code, one each so they tell apart at a glance; the label always says the status too. */
export const STATUS_TONE: Record<number, string> = { 3: 'text-good', 8: 'text-info', 7: 'text-amber', 4: 'text-bad', 12: 'text-violet' };
/** Background of a status badge: a wash of its own text colour (stronger on the dark theme). */
export const STATUS_TINT = 'bg-[color-mix(in_srgb,currentColor_var(--tint),transparent)]';

const cell = '@5xl:table-cell @5xl:px-3 @5xl:py-3 @5xl:align-top @5xl:first:pl-5';

/**
 * One order. Wide: a table row reading date, what was bought (with shop, order id and, past one, the item
 * count under it), status, total. Narrow: a card that leads with the product; `order-*` and `col-span-*` only apply to
 * that card, which wraps: name and chevron, shop line, then date, status and total on one line when they fit.
 */
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
        className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-line bg-card p-3 @5xl:table-row @5xl:rounded-none @5xl:border-0 @5xl:border-t @5xl:p-0 @5xl:first:border-t-0 @5xl:hover:bg-bg"
      >
        {/* Two-digit day and month, so the dates line up down the column. */}
        <td className={`num order-3 whitespace-nowrap text-xs text-muted @5xl:text-sm ${cell}`}>
          {formatDeliveryDate(order, t('table.noDate')).replace(/\b(\d)\//g, '0$1/')}
        </td>
        <td className={`order-1 min-w-0 basis-[calc(100%-2rem)] self-start ${cell}`}>
          {/* Long names stop at two lines; the detail lists every item in full. */}
          <p className="line-clamp-2 font-medium [overflow-wrap:anywhere]">{order.name}</p>
          <p className="flex flex-wrap gap-x-2 text-xs text-muted">
            <span className="[overflow-wrap:anywhere]">{shopDisplayName(order.shopName)}</span>
            <a href={getOrderUrl(order.orderId)} target="_blank" rel="noopener noreferrer" className="num underline-offset-2 hover:text-fg hover:underline focus-visible:underline">
              {order.orderId}
            </a>
            {order.productCount > 1 && <span>{t('orders.products', { n: order.productCount })}</span>}
          </p>
        </td>
        <td className={`order-4 ${cell}`}>
          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TINT} ${STATUS_TONE[order.statusCode] ?? 'text-muted'}`}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {order.status}
          </span>
        </td>
        <td className={`num order-5 ml-auto whitespace-nowrap text-right ${cell}`}>
          <span className={excluded ? 'text-muted line-through' : 'font-medium'}>{money(order.subTotal)}</span>
          {excluded && <span className="ml-2 text-xs text-bad @5xl:ml-0 @5xl:block">{t('orders.excluded')}</span>}
        </td>
        <td className={`order-2 self-start ${cell} @5xl:pl-0 @5xl:pr-3`}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={expanded ? detailId : undefined}
            aria-label={t('orders.viewDetail', { id: order.orderId })}
            onClick={onToggle}
            className="inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted hover:text-fg"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <path d="M3 6l5 5 5-5" />
            </svg>
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="block @5xl:table-row">
          <td colSpan={5} className="block @5xl:table-cell @5xl:px-5 @5xl:pt-2 @5xl:pb-5">
            <OrderDetail order={order} id={detailId} excluded={excluded} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
