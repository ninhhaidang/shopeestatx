// PROTOTYPE — throwaway. Trả lời: Đơn hàng trông thế nào ở display-style "warm"?
// Bảng dày đặc (OrdersTab.tsx thật) đổi thành danh sách "hoá đơn" một cột, số serif —
// vẫn giữ nguyên chức năng: tìm kiếm, lọc trạng thái/shop, sắp xếp, phân trang.
import { useMemo, useState } from 'react';
import { matchesStatusAndSearch, sortOrders } from '../../dashboard/order-query.js';
import { ORDER_STATUSES } from '../../dashboard/order-status.js';
import type { SortDirection } from '../../types/index.js';
import type { Order } from '../../types/index.js';
import { formatDate } from '../../i18n/format.js';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { useDashboard } from '../context';
import { money } from '../format';

type SortField = 'deliveryDate' | 'status' | 'subTotal';
const PAGE_SIZE = 20;
const dayOf = (d: string | null) => (d ? formatDate(new Date(d)) : '—');

function Receipt({ order }: { order: Order }) {
  return (
    <li className="py-4" style={{ borderBottom: '1px solid var(--w-line)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate">{order.shopName}</span>
        <span className="w-num shrink-0 text-lg">{money(order.subTotal)}</span>
      </div>
      <p className="mt-1 truncate text-sm" style={{ color: 'var(--w-muted)' }} title={order.productSummary}>
        {order.productSummary || `${order.productCount} sản phẩm`}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--w-muted)' }}>
        {dayOf(order.deliveryDate)} · {order.status}
      </p>
    </li>
  );
}

export function OrdersTabWarm() {
  const { orders } = useDashboard();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [shop, setShop] = useState('');
  const [sort, setSort] = useState<{ field: SortField | null; direction: SortDirection }>({ field: 'deliveryDate', direction: 'desc' });
  const [page, setPage] = useState(1);

  const shops = useMemo(() => [...new Set(orders.map(o => o.shopName))].sort((a, b) => a.localeCompare(b, 'vi')), [orders]);
  const activeShop = shops.includes(shop) ? shop : '';
  const term = search.toLowerCase().trim();

  const results = useMemo(() => {
    const matching = orders.filter(o => (!activeShop || o.shopName === activeShop) && matchesStatusAndSearch(o, status, term));
    return sort.field ? sortOrders(matching, sort.field, sort.direction) : matching;
  }, [orders, activeShop, status, term, sort]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageOrders = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (orders.length === 0) return <NoOrdersInRange />;

  return (
    <div className="style-warm w-prose mx-auto py-2" style={{ color: 'var(--w-fg)' }}>
      <p className="mb-5 text-[15px]">
        Bạn có <b className="w-num">{results.length}</b> đơn hàng{activeShop ? <> từ <b>{activeShop}</b></> : ''}
        {term ? <> khớp "{term}"</> : ''}.
      </p>

      <div className="mb-5 flex flex-wrap gap-4 text-sm">
        <input
          type="search"
          placeholder="Tìm sản phẩm, mã đơn…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="min-w-40 flex-1"
        />
        <select value={status ?? ''} onChange={e => { setStatus(e.target.value === '' ? null : Number(e.target.value)); setPage(1); }}>
          <option value="">Mọi trạng thái</option>
          {ORDER_STATUSES.map(s => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
        <select value={activeShop} onChange={e => { setShop(e.target.value); setPage(1); }}>
          <option value="">Mọi shop</option>
          {shops.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={`${sort.field}:${sort.direction}`}
          onChange={e => {
            const [field, direction] = e.target.value.split(':') as [SortField, SortDirection];
            setSort({ field, direction });
          }}
        >
          <option value="deliveryDate:desc">Mới nhất trước</option>
          <option value="deliveryDate:asc">Cũ nhất trước</option>
          <option value="subTotal:desc">Giá trị cao nhất</option>
        </select>
      </div>

      {results.length === 0 ? (
        <p style={{ color: 'var(--w-muted)' }}>Không có đơn khớp bộ lọc.</p>
      ) : (
        <>
          <ul>
            {pageOrders.map(order => (
              <Receipt key={order.orderId} order={order} />
            ))}
          </ul>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--w-muted)' }}>
              <span>Trang {current}/{pages}</span>
              <div className="flex gap-3">
                <button type="button" disabled={current === 1} onClick={() => setPage(p => p - 1)} style={{ textDecoration: 'underline' }}>
                  ← Trước
                </button>
                <button type="button" disabled={current === pages} onClick={() => setPage(p => p + 1)} style={{ textDecoration: 'underline' }}>
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
