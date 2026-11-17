import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { matchesStatusAndSearch, sortOrders } from '../../dashboard/order-query.js';
import { exportToCSV, exportToExcel } from '../../dashboard/export.js';
import { isExcludedOrder, ORDER_STATUSES } from '../../dashboard/order-status.js';
import { t } from '../../i18n/index.js';
import { shopIdentity } from '../../dashboard/shop.js';
import type { SortDirection } from '../../types/index.js';
import { Button } from '../../ui/components/Button';
import { StateMessage } from '../../ui/components/StateMessage';
import { control } from '../../ui/styles/classes';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { useDashboard } from '../context';
import { money } from '../format';
import { OrderRow, STATUS_TINT, STATUS_TONE } from './orders/OrderRow';
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
/** Header cells stay in view while the list scrolls; the inset shadow is their bottom rule (a border would not stick). */
const th = 'px-3 py-2.5 text-xs font-medium text-muted first:pl-5 @5xl:sticky @5xl:top-0 @5xl:z-[1] @5xl:bg-card @5xl:shadow-[inset_0_-1px_0_var(--line)]';
interface Sort {
  field: SortField | null;
  direction: SortDirection;
}

/**
 * Đơn hàng: the orders of the global date range with search, status and shop filters, sorting,
 * pagination and inline detail. A single table; on narrow containers its rows become cards.
 * The status filter is a row of counted chips, which also serves as the legend of the badge colours.
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

  const shops = useMemo(() => {
    const names = new Map<string, string>();
    for (const order of orders) if (!names.has(shopIdentity(order))) names.set(shopIdentity(order), order.shopName);
    return [...names].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  }, [orders]);
  // A seller that fell out of the date range no longer filters anything.
  const activeShop = shops.some(([id]) => id === shop) ? shop : '';
  const term = search.toLowerCase().trim();

  // Everything but the status filter: what the status chips count.
  const searched = useMemo(
    () => orders.filter(o => (!activeShop || shopIdentity(o) === activeShop) && matchesStatusAndSearch(o, null, term)),
    [orders, activeShop, term],
  );
  const results = useMemo(() => {
    const matching = status === null ? searched : searched.filter(o => o.statusCode === status);
    return sort.field ? sortOrders(matching, sort.field, sort.direction) : matching;
  }, [searched, status, sort]);
  const spend = useMemo(() => results.reduce((sum, o) => (isExcludedOrder(o) ? sum : sum + o.subTotal), 0), [results]);
  // A chip per status the date range holds, so they stay put while searching.
  const statuses = ORDER_STATUSES.filter(s => s.code === status || orders.some(o => o.statusCode === s.code));

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

  const statusChip = (code: number | null, label: string, count: number) => {
    const on = status === code;
    const tone = code === null ? 'text-fg' : (STATUS_TONE[code] ?? 'text-muted');
    return (
      <button
        key={code ?? 'all'}
        type="button"
        aria-pressed={on}
        onClick={() => changeFilter(() => setStatus(code))}
        className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-sm ${on ? `border-current font-semibold ${tone} ${STATUS_TINT}` : 'border-line bg-card text-fg hover:border-control-line'}`}
      >
        {code !== null && <span aria-hidden="true" className={`size-1.5 rounded-full bg-current ${tone}`} />}
        {label}{' '}
        <span className={`num text-xs ${on ? '' : 'text-muted'}`}>{count}</span>
      </button>
    );
  };

  const sortableHeader = (field: SortField, align = 'text-left') => {
    const column = SORT_COLUMNS.find(c => c.field === field)!;
    const active = sort.field === field;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`${th} ${align}`}
      >
        <span className="@5xl:hidden">{t(column.label)}</span>
        <button type="button" onClick={() => sortBy(field)} className="hidden cursor-pointer hover:text-fg @5xl:inline">
          {t(column.label)}
          <span aria-hidden="true" className={`ml-1 ${active ? '' : 'opacity-40'}`}>{active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
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
        <select aria-label={t('orders.filter.shop')} value={activeShop} onChange={e => changeFilter(() => setShop(e.target.value))} className={`${control} max-w-56`}>
          <option value="">{t('orders.allShops')}</option>
          {shops.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
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
        {/* One menu instead of three toolbar buttons. It closes when focus leaves it or a format is picked. */}
        <details className="relative" onBlur={e => !e.currentTarget.contains(e.relatedTarget) && (e.currentTarget.open = false)}>
          <summary className={`${control} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{t('orders.export')}</summary>
          <div
            role="group"
            aria-label={t('orders.export')}
            onClick={e => ((e.currentTarget.parentElement as HTMLDetailsElement).open = false)}
            className="absolute left-0 z-10 mt-1 flex min-w-40 flex-col gap-1 rounded-xl border border-line bg-card p-1.5 shadow-lg @5xl:left-auto @5xl:right-0"
          >
            <Button variant="outline" className="border-transparent text-left" disabled={results.length === 0} onClick={() => exportToExcel(results)}>{t('export.excel')}</Button>
            <Button variant="outline" className="border-transparent text-left" disabled={results.length === 0} onClick={() => exportToCSV(results)}>{t('export.csv')}</Button>
            <Button variant="outline" className="border-transparent text-left" disabled={results.length === 0} onClick={() => setPrinting(true)}>{t('export.pdf')}</Button>
          </div>
        </details>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div role="group" aria-label={t('orders.filter.status')} className="flex flex-wrap gap-1.5">
          {statusChip(null, t('orders.status.all'), searched.length)}
          {statuses.map(s => statusChip(s.code, t(s.label), searched.filter(o => o.statusCode === s.code).length))}
        </div>
        {results.length > 0 && <p className="text-sm text-muted">{t('orders.summary', { count: results.length, amount: money(spend) })}</p>}
      </div>
      {printing && createPortal(<PrintSheet orders={results} />, document.body)}

      {results.length === 0 ? (
        <StateMessage title={t('empty.title')} message={t('empty.message')} action={{ label: t('filter.reset'), onClick: reset }} />
      ) : (
        <>
          {/* overflow-clip rounds the corners without becoming the scroller, so the header can stick to <main>. */}
          <div className="@5xl:overflow-clip @5xl:rounded-2xl @5xl:border @5xl:border-line @5xl:bg-card">
            <table className="block w-full text-sm @5xl:table @5xl:table-fixed">
              <colgroup className="hidden @5xl:table-column-group">
                <col className="w-32" />
                <col />
                <col className="w-44" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-12" />
              </colgroup>
              <thead className="sr-only @5xl:not-sr-only @5xl:table-header-group">
                <tr className="@5xl:table-row">
                  {sortableHeader('deliveryDate')}
                  <th scope="col" className={`${th} text-left`}>{t('table.col.product')}</th>
                  {sortableHeader('status')}
                  <th scope="col" className={`${th} text-right`}>{t('table.col.quantity')}</th>
                  {sortableHeader('subTotal', 'text-right')}
                  <th scope="col" className={th}><span className="sr-only">{t('table.col.detail')}</span></th>
                </tr>
              </thead>
              <tbody className="block space-y-2 @5xl:table-row-group @5xl:space-y-0">
                {pageOrders.map(order => (
                  <OrderRow key={order.orderId} order={order} expanded={open.has(order.orderId)} onToggle={() => toggle(order.orderId)} />
                ))}
              </tbody>
            </table>
          </div>

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
