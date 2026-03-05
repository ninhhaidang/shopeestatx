// Excel, CSV, and PDF export functions
import { state } from './state.js';
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
    'STT': index + 1,
    'Mã đơn hàng': order.orderId,
    'Ngày giao hàng': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'Chưa có',
    'Trạng thái': order.status,
    'Tên sản phẩm': order.name,
    'Số lượng': order.productCount,
    'Tổng tiền': order.subTotal,
    'Người bán': order.shopName,
    'Chi tiết': order.productSummary,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng Shopee');
  XLSX.writeFile(wb, `shopee-stats-${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportToCSV(): void {
  const filtered = getExportOrders();
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const headers = ['STT', 'Mã đơn', 'Ngày giao', 'Trạng thái', 'Tên sản phẩm', 'Số lượng', 'Tổng tiền (VNĐ)', 'Người bán'];
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
