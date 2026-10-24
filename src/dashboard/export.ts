// Excel, CSV, and PDF export functions
import { state } from './state.js';
import { t } from '../i18n/index.js';

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

/** Quote CSV text and prevent merchant-supplied text from becoming formulas. */
function csvCell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  const text = /^\s*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportToExcel(): void {
  const filtered = state.allOrdersData ? state.filteredOrders : [];

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
    'Seller': order.shopName,
    'Details': order.productSummary,
  }));

  // Load the spreadsheet bundle only when an Excel download is requested.
  import('exceljs')
    .then(({ default: ExcelJS }) => {
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

      return workbook.xlsx.writeBuffer();
    })
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
      alert('Failed to export Excel. Please try again.');
    });
}

export function exportToCSV(): void {
  const filtered = state.allOrdersData ? state.filteredOrders : [];
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
    o.status,
    o.name,
    o.productCount,
    o.subTotal,
    o.shopName,
  ].map(csvCell).join(','));

  const csv = BOM + [headers.map(csvCell).join(','), ...rows].join('\n');
  downloadFile(csv, `shopee-stats-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
}

/** PDF export via browser print dialog — print CSS handles layout */
export function exportToPDF(): void {
  window.print();
}
