// Excel, CSV, and PDF export functions
import { state } from './state.js';
import { t } from '../i18n/index.js';
import * as XLSX from 'xlsx';

/** Helper: trigger browser file download */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Get currently-filtered orders for export (respects year/month/status filters) */
function getExportOrders() {
  if (!state.allOrdersData) return [];
  const year = (document.getElementById('filterYear') as HTMLSelectElement).value;
  const month = (document.getElementById('filterMonth') as HTMLSelectElement).value;
  const status = (document.getElementById('filterStatus') as HTMLSelectElement).value;

  // NOTE: Intentionally does not filter by selectedDay or searchTerm — pre-existing behavior
  return state.allOrdersData.orders.filter(order => {
    if (year && order.orderYear !== Number(year)) return false;
    if (month && order.orderMonth !== Number(month)) return false;
    if (status && order.statusCode !== Number(status)) return false;
    return true;
  });
}

export function exportToExcel(): void {
  const filtered = getExportOrders();
  const data = filtered.map((order, index) => ({
    [t('export.col.index')]: index + 1,
    [t('export.col.orderId')]: order.orderId,
    [t('export.col.date')]: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : t('table.noDate'),
    [t('export.col.status')]: order.status,
    [t('export.col.product')]: order.name,
    [t('export.col.quantity')]: order.productCount,
    [t('export.col.total')]: order.subTotal,
    'Seller': order.shopName,
    'Details': order.productSummary,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Shopee Orders');
  XLSX.writeFile(wb, `shopee-stats-${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportToCSV(): void {
  const filtered = getExportOrders();
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const headers = [
    t('export.col.index'),
    t('export.col.orderId'),
    t('export.col.date'),
    t('export.col.status'),
    t('export.col.product'),
    t('export.col.quantity'),
    t('export.col.total'),
    'Seller'
  ];
  const rows = filtered.map((o, i) => [
    i + 1,
    o.orderId,
    o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : '',
    `"${o.status.replace(/"/g, '""')}"`,
    `"${o.name.replace(/"/g, '""')}"`,
    o.productCount,
    o.subTotal,
    `"${o.shopName.replace(/"/g, '""')}"`,
  ].join(','));

  const csv = BOM + [headers.join(','), ...rows].join('\n');
  downloadFile(csv, `shopee-stats-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
}

/** PDF export via browser print dialog — print CSS handles layout */
export function exportToPDF(): void {
  window.print();
}
