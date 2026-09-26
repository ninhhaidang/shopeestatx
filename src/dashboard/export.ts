/** ShopeeStatX/export.ts — Excel, CSV, and PDF export functions */
import type { Order } from '../types/index.js';
import { state } from './state.js';
import { t } from '../i18n/index.js';
import { hasActiveFilters } from './filter-engine.js';
import ExcelJS from 'exceljs';

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

/** Get currently evaluated filtered orders for export without legacy DOM scraping */
export function getExportOrders(): Order[] {
  // ponytail: reuse state.filteredOrders directly rather than re-evaluating FilterEngine.
  // upgrade path: re-evaluate full dataset if lazy table windowing/virtualization is introduced.
  if (hasActiveFilters(state.criteria)) {
    return state.filteredOrders ?? [];
  }
  if (state.filteredOrders && state.filteredOrders.length > 0) {
    return state.filteredOrders;
  }
  return state.allOrdersData?.orders ?? [];
}

/** Helper: escape string for CSV field */
function escapeCsv(val: string | null | undefined): string {
  return `"${(val || '').replace(/"/g, '""')}"`;
}

export function exportToExcel(orders?: Order[]): void {
  const filtered = orders !== undefined ? orders : getExportOrders();

  if (filtered.length === 0) {
    alert(t('export.noData') || 'No data to export');
    return;
  }

  const data = filtered.map((order, index) => ({
    [t('export.col.index')]: index + 1,
    [t('export.col.orderId')]: order.orderId,
    [t('export.col.date')]: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : t('table.noDate'),
    [t('export.col.status')]: order.status,
    [t('export.col.product')]: order.name,
    [t('export.col.quantity')]: order.productCount,
    [t('export.col.total')]: order.subTotal,
    [t('export.col.seller')]: order.shopName,
    [t('export.col.details')]: order.productSummary,
  }));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Shopee Orders');

  // Add headers
  const headers = Object.keys(data[0] || {});
  headers.forEach((header, colIndex) => {
    worksheet.getCell(1, colIndex + 1).value = header;
  });

  // Add data rows
  data.forEach((row, rowIndex) => {
    const values = Object.values(row);
    values.forEach((value, colIndex) => {
      worksheet.getCell(rowIndex + 2, colIndex + 1).value = value;
    });
  });

  // Download via buffer with error handling
  workbook.xlsx.writeBuffer()
    .then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopee-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error('Export failed:', err);
      alert(t('export.failed') || 'Failed to export Excel. Please try again.');
    });
}

export function exportToCSV(orders?: Order[]): void {
  const filtered = orders !== undefined ? orders : getExportOrders();
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const headers = [
    t('export.col.index'),
    t('export.col.orderId'),
    t('export.col.date'),
    t('export.col.status'),
    t('export.col.product'),
    t('export.col.quantity'),
    t('export.col.total'),
    t('export.col.seller'),
  ];
  const rows = filtered.map((o, i) => [
    i + 1,
    o.orderId,
    o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : '',
    escapeCsv(o.status),
    escapeCsv(o.name),
    o.productCount,
    o.subTotal,
    escapeCsv(o.shopName),
  ].join(','));

  const csv = BOM + [headers.join(','), ...rows].join('\n');
  downloadFile(csv, `shopee-stats-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
}

/** PDF export via browser print dialog — print CSS handles layout */
export function exportToPDF(): void {
  window.print();
}
