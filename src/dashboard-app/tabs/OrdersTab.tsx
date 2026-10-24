import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getOrderUrl } from '../../config.js';
import { matchesStatusAndSearch, sortOrders } from '../../dashboard/order-query.js';
import { exportToCSV, exportToExcel } from '../../dashboard/export.js';
import { isExcludedOrder } from '../../dashboard/order-status.js';
import { formatCurrency, formatDate, formatDateTime } from '../../i18n/format.js';
import { t } from '../../i18n/index.js';
import type { Order, SortDirection } from '../../types/index.js';
import { Button } from '../../ui/components/Button';
import { StateMessage } from '../../ui/components/StateMessage';
import { control } from '../../ui/styles/classes';
import { useDashboard } from '../context';

const money = (n: number) => formatCurrency(n);

const PAGE_SIZE = 20;

const STATUSES: { code: string; label: string }[] = [
  { code: '3', label: 'status.completed' },
  { code: '4', label: 'status.cancelled' },
  { code: '7', label: 'status.waitingShipment' },
  { code: '8', label: 'status.delivering' },
  { code: '9', label: 'status.waitingPayment' },
  { code: '12', label: 'status.returned' },
];

type SortField = 'deliveryDate' | 'status' | 'subTotal';
const SORT_COLUMNS: { field: SortField; label: string }[] = [
  { field: 'deliveryDate', label: 'table.col.date' },
  { field: 'status', label: 'table.col.status' },
  { field: 'subTotal', label: 'table.col.total' },
];
interface Sort {
  field: SortField | null;
  direction: SortDirection;
}

const cell = '@2xl:table-cell @2xl:px-3 @2xl:py-2';

/** Page numbers to show: all of them up to 7, else first, last and the neighbours of the current page (null = gap). */
function pageItems(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items: (number | null)[] = [1];
  if (page > 3) items.push(null);
  for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) items.push(i);
  if (page < pages - 2) items.push(null);
  items.push(pages);
  return items;
}

/**
 * Đơn hàng: the orders of the global date range with search, status and shop filters, sorting,
 * pagination and inline detail. A single table; below the container's 42rem its rows become cards.
 */
export function OrdersTab() {
  const { orders, resetRange } = useDashboard();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [shop, setShop] = useState('');
  const [sort, setSort] = useState<Sort>({ field: null, direction: 'asc' });
  const [requestedPage, setRequestedPage] = useState(1);
  const [printing, setPrinting] = useState(false);

  // PDF is the browser's print dialog; the sheet it prints only exists for that moment.
  useEffect(() => {
    if (!printing) return;
    window.print();
    setPrinting(false);
  }, [printing]);

  const shops = useMemo(() => [...new Set(orders.map(o => o.shopName))].sort((a, b) => a.localeCompare(b, 'vi')), [orders]);
  // A shop that fell out of the date range no longer filters anything.
  const activeShop = shops.includes(shop) ? shop : '';
  const term = search.toLowerCase().trim();

  const results = useMemo(() => {
    const matching = orders.filter(o => (!activeShop || o.shopName === activeShop) && matchesStatusAndSearch(o, status, term));
    return sort.field ? sortOrders(matching, sort.field, sort.direction) : matching;
  }, [orders, activeShop, status, term, sort]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const from = (page - 1) * PAGE_SIZE;
  const pageOrders = results.slice(from, from + PAGE_SIZE);

  if (orders.length === 0) {
    return (
      <StateMessage
        title={t('dash.noOrdersInRange.title')}
        message={t('dash.noOrdersInRange.message')}
        action={{ label: t('dash.noOrdersInRange.action'), onClick: resetRange }}
      />
    );
  }

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const reset = () => {
    setSearch('');
    setStatus('');
    setShop('');
    setRequestedPage(1);
  };
  /** Any change to what is listed starts again from the first page. */
  const changeFilter = (apply: () => void) => {
    apply();
    setRequestedPage(1);
  };
  const sortBy = (field: SortField) =>
    changeFilter(() => setSort(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' })));

  const sortableHeader = (field: SortField, align = 'text-left') => {
    const column = SORT_COLUMNS.find(c => c.field === field)!;
    const active = sort.field === field;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`px-3 py-2 text-xs font-medium text-muted ${align}`}
      >
        <button type="button" onClick={() => sortBy(field)} className="cursor-pointer hover:text-fg">
          {t(column.label)}
          <span aria-hidden="true" className="ml-1">{active ? (sort.direction === 'asc' ? '▲' : '▼') : ''}</span>
        </button>
      </th>
    );
  };

  return (
    <section aria-label={t('dash.tab.orders')} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label={t('orders.search')}
          placeholder={t('filter.search.placeholder')}
          value={search}
          onChange={e => changeFilter(() => setSearch(e.target.value))}
          className={`${control} min-w-48 flex-1`}
        />
        <select aria-label={t('orders.filter.status')} value={status} onChange={e => changeFilter(() => setStatus(e.target.value))} className={control}>
          <option value="">{t('filter.allStatus')}</option>
          {STATUSES.map(s => (
            <option key={s.code} value={s.code}>{t(s.label)}</option>
          ))}
        </select>
        <select aria-label={t('orders.filter.shop')} value={activeShop} onChange={e => changeFilter(() => setShop(e.target.value))} className={`${control} max-w-56`}>
          <option value="">{t('orders.allShops')}</option>
          {shops.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {/* The header row is only for screen readers when rows are cards, so sorting moves here. */}
        <select
          aria-label={t('orders.sort')}
          value={sort.field ? `${sort.field}:${sort.direction}` : ''}
          onChange={e => {
            const [field, direction] = e.target.value.split(':') as [SortField | '', SortDirection | undefined];
            changeFilter(() => setSort({ field: field || null, direction: direction ?? 'asc' }));
          }}
          className={`${control} @2xl:hidden`}
        >
          <option value="">{t('orders.sort.default')}</option>
          {SORT_COLUMNS.flatMap(c => [
            <option key={`${c.field}:asc`} value={`${c.field}:asc`}>{t('orders.sort.asc', { column: t(c.label) })}</option>,
            <option key={`${c.field}:desc`} value={`${c.field}:desc`}>{t('orders.sort.desc', { column: t(c.label) })}</option>,
          ])}
        </select>
        <div role="group" aria-label={t('orders.export')} className="flex gap-2">
          <Button variant="outline" disabled={results.length === 0} onClick={() => exportToExcel(results)}>{t('export.excel')}</Button>
          <Button variant="outline" disabled={results.length === 0} onClick={() => exportToCSV(results)}>{t('export.csv')}</Button>
          <Button variant="outline" disabled={results.length === 0} onClick={() => setPrinting(true)}>{t('export.pdf')}</Button>
        </div>
      </div>
      {printing && createPortal(<PrintSheet orders={results} />, document.body)}

      {results.length === 0 ? (
        <StateMessage title={t('empty.title')} message={t('empty.message')} action={{ label: t('filter.reset'), onClick: reset }} />
      ) : (
        <>
          <table className="block w-full text-sm @2xl:table">
            <thead className="sr-only @2xl:not-sr-only @2xl:table-header-group">
              <tr className="@2xl:table-row">
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">{t('table.col.orderId')}</th>
                {sortableHeader('deliveryDate')}
                {sortableHeader('status')}
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">{t('table.col.product')}</th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted">{t('table.col.quantity')}</th>
                {sortableHeader('subTotal', 'text-right')}
              </tr>
            </thead>
            <tbody className="block space-y-2 @2xl:table-row-group @2xl:space-y-0">
              {pageOrders.map(order => (
                <OrderRow key={order.orderId} order={order} expanded={open.has(order.orderId)} onToggle={() => toggle(order.orderId)} />
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <p>{t('orders.showing', { from: from + 1, to: from + pageOrders.length, total: results.length })}</p>
            {pages > 1 && (
              <nav aria-label={t('orders.pagination')} className="flex flex-wrap items-center gap-1">
                <PageButton label={t('orders.prevPage')} disabled={page === 1} onClick={() => setRequestedPage(page - 1)}>‹</PageButton>
                {pageItems(page, pages).map((item, i) =>
                  item === null ? (
                    <span key={`gap-${i}`} aria-hidden="true">…</span>
                  ) : (
                    <PageButton key={item} label={t('orders.page', { n: item })} current={item === page} onClick={() => setRequestedPage(item)}>
                      {item}
                    </PageButton>
                  ),
                )}
                <PageButton label={t('orders.nextPage')} disabled={page === pages} onClick={() => setRequestedPage(page + 1)}>›</PageButton>
              </nav>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/** Every filtered order as a plain table, shown only on paper (app.css hides the dashboard while it exists). */
function PrintSheet({ orders }: { orders: Order[] }) {
  return (
    <div id="orders-print" className="hidden text-black print:block">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {['table.col.index', 'table.col.orderId', 'table.col.date', 'table.col.status', 'table.col.product', 'table.col.quantity', 'table.col.total'].map(key => (
              <th key={key} className="border border-black px-1 py-0.5 text-left">{t(key)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o.orderId}>
              <td className="border border-black px-1 py-0.5">{i + 1}</td>
              <td className="border border-black px-1 py-0.5">{o.orderId}</td>
              <td className="border border-black px-1 py-0.5">{o.deliveryDate ? formatDate(new Date(o.deliveryDate)) : t('table.noDate')}</td>
              <td className="border border-black px-1 py-0.5">{o.status}</td>
              <td className="border border-black px-1 py-0.5">{o.name}</td>
              <td className="border border-black px-1 py-0.5">{o.productCount}</td>
              <td className="border border-black px-1 py-0.5">{money(o.subTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageButton({
  label, current, disabled, onClick, children,
}: { label: string; current?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`num min-w-8 cursor-pointer rounded-md border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 ${
        current ? 'border-accent-text bg-accent-solid font-semibold text-on-accent' : 'border-line bg-card text-fg'
      }`}
    >
      {children}
    </button>
  );
}

function OrderRow({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
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

function OrderDetail({ order, id, excluded }: { order: Order; id: string; excluded: boolean }) {
  return (
    <div id={id} role="region" aria-label={t('orders.detail', { id: order.orderId })} className="rounded-xl border border-line bg-bg p-3">
      {excluded && (
        <p className="mb-2 text-sm font-medium text-bad">
          {t('orders.excludedNote', { amount: money(order.refundAmount || order.subTotal) })}
        </p>
      )}
      <dl className="grid gap-x-6 gap-y-1 text-sm @2xl:grid-cols-2">
        <dt className="text-muted">{t('table.detail.seller')}</dt>
        <dd>{order.shopName}</dd>
        {order.deliveryDate && (
          <>
            <dt className="text-muted">{t('table.detail.deliveryDate')}</dt>
            <dd>{formatDateTime(new Date(order.deliveryDate))}</dd>
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
