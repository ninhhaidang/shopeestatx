import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getOrderUrl } from '../../../config.js';
import { exportToCSV, exportToExcel } from '../../../dashboard/export.js';
import { matchesStatusAndSearch, sortOrders } from '../../../dashboard/order-query.js';
import { isExcludedOrder, ORDER_STATUSES } from '../../../dashboard/order-status.js';
import { shopIdentity } from '../../../dashboard/shop.js';
import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order, SortDirection } from '../../../types/index.js';
import { Button } from '../../../ui/components/Button';
import { StateMessage } from '../../../ui/components/StateMessage';
import { NoOrdersInRange } from '../../components/NoOrdersInRange';
import { useDashboard } from '../../context';
import { money } from '../../format';
import { OrderDetailWarm } from './OrderDetailWarm';
import { PrintSheet } from './PrintSheet';

type SortField = 'deliveryDate' | 'status' | 'subTotal';
const SORT_COLUMNS: { field: SortField; label: string }[] = [
  { field: 'deliveryDate', label: 'table.col.date' },
  { field: 'status', label: 'table.col.status' },
  { field: 'subTotal', label: 'table.col.total' },
];
const PAGE_SIZES: (number | null)[] = [20, 50, 100, null];
const sizeLabel = (size: number | null) => (size === null ? t('orders.pageSize.all') : t('orders.pageSize.n', { n: size }));
const dayOf = (d: string | null) => (d ? formatDate(new Date(d)) : t('table.noDate'));

const control = 'border-b border-warm-line bg-transparent px-1 py-1 font-serif text-warm-fg focus:border-warm-accent focus:outline-none';

function Receipt({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const excluded = isExcludedOrder(order);
  const detailId = `order-detail-${order.orderId}`;
  return (
    <li className="border-b border-warm-line py-4">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? detailId : undefined}
        aria-label={t('orders.viewDetail', { id: order.orderId })}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-baseline justify-between gap-3 text-left"
      >
        <span className="truncate">
          {order.shopName}
          {excluded && <span className="ml-2 rounded border border-bad px-1.5 text-xs text-bad">{t('orders.excluded')}</span>}
        </span>
        <span className="shrink-0 text-lg font-serif">{money(order.subTotal)}</span>
      </button>
      <p className="mt-1 truncate text-sm text-warm-muted" title={order.productSummary}>
        {order.productSummary || t('table.col.product')}
      </p>
      <p className="mt-1 text-xs text-warm-muted">
        {dayOf(order.deliveryDate)} · {order.status} ·{' '}
        <a href={getOrderUrl(order.orderId)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {order.orderId}
        </a>
      </p>
      {expanded && (
        <div className="mt-2">
          <OrderDetailWarm order={order} id={detailId} excluded={excluded} />
        </div>
      )}
    </li>
  );
}

/**
 * Đơn hàng, warm variant: a single-column receipt list instead of a dense table, with the same
 * search/filter/sort/pagination/detail/export/print capabilities as OrdersTab.
 */
export function OrdersTabWarm() {
  const { orders } = useDashboard();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [shop, setShop] = useState('');
  const [sort, setSort] = useState<{ field: SortField | null; direction: SortDirection }>({ field: 'deliveryDate', direction: 'desc' });
  const [pageSize, setPageSize] = useState<number | null>(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    window.print();
    setPrinting(false);
  }, [printing]);

  const shops = useMemo(() => {
    const labels = new Map<string, string>();
    for (const order of orders) {
      const key = shopIdentity(order);
      if (!labels.has(key)) labels.set(key, order.shopName);
    }
    return [...labels].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  }, [orders]);
  const activeShop = shops.some(([key]) => key === shop) ? shop : '';
  const term = search.toLowerCase().trim();

  const results = useMemo(() => {
    const matching = orders.filter((o) => (!activeShop || shopIdentity(o) === activeShop) && matchesStatusAndSearch(o, status, term));
    return sort.field ? sortOrders(matching, sort.field, sort.direction) : matching;
  }, [orders, activeShop, status, term, sort]);

  const pages = pageSize === null ? 1 : Math.max(1, Math.ceil(results.length / pageSize));
  const current = Math.min(page, pages);
  const from = pageSize === null ? 0 : (current - 1) * pageSize;
  const pageOrders = pageSize === null ? results : results.slice(from, from + pageSize);

  if (orders.length === 0) return <NoOrdersInRange />;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const changeFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const reset = () => {
    setSearch('');
    setStatus(null);
    setShop('');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-prose py-2 font-serif text-warm-fg">
      <p className="mb-5 text-[15px]">{t('ordersWarm.summary', { count: results.length })}</p>

      <div className="mb-5 flex flex-wrap gap-4 text-sm">
        <input
          type="search"
          aria-label={t('orders.search')}
          placeholder={t('filter.search.placeholder')}
          value={search}
          onChange={(e) => changeFilter(() => setSearch(e.target.value))}
          className={`min-w-40 flex-1 ${control}`}
        />
        <select
          aria-label={t('orders.filter.status')}
          value={status ?? ''}
          onChange={(e) => changeFilter(() => setStatus(e.target.value === '' ? null : Number(e.target.value)))}
          className={control}
        >
          <option value="">{t('filter.allStatus')}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.code} value={s.code}>
              {t(s.label)}
            </option>
          ))}
        </select>
        <select aria-label={t('orders.filter.shop')} value={activeShop} onChange={(e) => changeFilter(() => setShop(e.target.value))} className={control}>
          <option value="">{t('orders.allShops')}</option>
          {shops.map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('orders.sort')}
          value={sort.field ? `${sort.field}:${sort.direction}` : ''}
          onChange={(e) => {
            const [field, direction] = e.target.value.split(':') as [SortField | '', SortDirection | undefined];
            changeFilter(() => setSort({ field: field || null, direction: direction ?? 'asc' }));
          }}
          className={control}
        >
          <option value="">{t('orders.sort.default')}</option>
          {SORT_COLUMNS.flatMap((c) => [
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
          <ul>
            {pageOrders.map((order) => (
              <Receipt key={order.orderId} order={order} expanded={open.has(order.orderId)} onToggle={() => toggle(order.orderId)} />
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-warm-muted">
            <p>{t('orders.showing', { from: from + 1, to: from + pageOrders.length, total: results.length })}</p>
            {pages > 1 && (
              <div className="flex gap-3">
                <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-40">
                  {t('orders.prevPage')}
                </button>
                <span>{t('orders.page', { n: current })} / {pages}</span>
                <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-40">
                  {t('orders.nextPage')}
                </button>
              </div>
            )}
            <select
              aria-label={t('orders.pageSize')}
              value={pageSize ?? 'all'}
              onChange={(e) => {
                setPageSize(e.target.value === 'all' ? null : Number(e.target.value));
                setPage(1);
              }}
              className={control}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size ?? 'all'} value={size ?? 'all'}>{sizeLabel(size)}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
