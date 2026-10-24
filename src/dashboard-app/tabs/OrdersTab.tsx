import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { matchesStatusAndSearch, sortOrders } from '../../dashboard/order-query.js';
import { exportToCSV, exportToExcel } from '../../dashboard/export.js';
import { ORDER_STATUSES } from '../../dashboard/order-status.js';
import { t } from '../../i18n/index.js';
import type { SortDirection } from '../../types/index.js';
import { Button } from '../../ui/components/Button';
import { StateMessage } from '../../ui/components/StateMessage';
import { control } from '../../ui/styles/classes';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { useDashboard } from '../context';
import { OrderRow } from './orders/OrderRow';
import { Pagination } from './orders/Pagination';
import { PrintSheet } from './orders/PrintSheet';

/** Orders per page the reader can pick; null is "all". */
const PAGE_SIZES: (number | null)[] = [20, 50, 100, null];
const sizeLabel = (size: number | null) => (size === null ? t('orders.pageSize.all') : t('orders.pageSize.n', { n: size }));

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

/**
 * Đơn hàng: the orders of the global date range with search, status and shop filters, sorting,
 * pagination and inline detail. A single table; below the container's 42rem its rows become cards.
 */
export function OrdersTab() {
  const { orders } = useDashboard();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [shop, setShop] = useState('');
  const [sort, setSort] = useState<Sort>({ field: null, direction: 'asc' });
  const [pageSize, setPageSize] = useState<number | null>(PAGE_SIZES[0]);
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

  const pages = pageSize === null ? 1 : Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.min(requestedPage, pages);
  const from = pageSize === null ? 0 : (page - 1) * pageSize;
  const pageOrders = pageSize === null ? results : results.slice(from, from + pageSize);

  if (orders.length === 0) return <NoOrdersInRange />;

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const reset = () => {
    setSearch('');
    setStatus(null);
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
        <span className="@5xl:hidden">{t(column.label)}</span>
        <button type="button" onClick={() => sortBy(field)} className="hidden cursor-pointer hover:text-fg @5xl:inline">
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
          className={`${control} min-w-48 flex-1 placeholder:text-muted`}
        />
        <select
          aria-label={t('orders.filter.status')}
          value={status ?? ''}
          onChange={e => changeFilter(() => setStatus(e.target.value === '' ? null : Number(e.target.value)))}
          className={control}
        >
          <option value="">{t('filter.allStatus')}</option>
          {ORDER_STATUSES.map(s => (
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
          className={`${control} @5xl:hidden`}
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
          <table className="block w-full text-sm @5xl:table">
            <thead className="sr-only @5xl:not-sr-only @5xl:table-header-group">
              <tr className="@5xl:table-row">
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">{t('table.col.orderId')}</th>
                {sortableHeader('deliveryDate')}
                {sortableHeader('status')}
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">{t('table.col.product')}</th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted">{t('table.col.quantity')}</th>
                {sortableHeader('subTotal', 'text-right')}
              </tr>
            </thead>
            <tbody className="block space-y-2 @5xl:table-row-group @5xl:space-y-0">
              {pageOrders.map(order => (
                <OrderRow key={order.orderId} order={order} expanded={open.has(order.orderId)} onToggle={() => toggle(order.orderId)} />
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <p>{t('orders.showing', { from: from + 1, to: from + pageOrders.length, total: results.length })}</p>
            {pages > 1 && <Pagination page={page} pages={pages} onPage={setRequestedPage} />}
            <select
              aria-label={t('orders.pageSize')}
              value={pageSize ?? 'all'}
              onChange={e => {
                setPageSize(e.target.value === 'all' ? null : Number(e.target.value));
                setRequestedPage(1);
              }}
              className={control}
            >
              {PAGE_SIZES.map(size => (
                <option key={size ?? 'all'} value={size ?? 'all'}>{sizeLabel(size)}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </section>
  );
}
