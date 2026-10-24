import { formatDate } from '../../../i18n/format.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { money } from '../../format';

const COLUMNS = ['table.col.index', 'table.col.orderId', 'table.col.date', 'table.col.status', 'table.col.product', 'table.col.quantity', 'table.col.total'];

/** Every filtered order as a plain table, shown only on paper (app.css hides the dashboard while it exists). */
export function PrintSheet({ orders }: { orders: Order[] }) {
  return (
    <div id="orders-print" className="hidden text-black print:block">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {COLUMNS.map(key => (
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
