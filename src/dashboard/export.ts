// Excel export using SheetJS (XLSX)
import { state } from './state.js';
import * as XLSX from 'xlsx';

export function exportToExcel(): void {
  if (!state.allOrdersData) return;

  const year = (document.getElementById('filterYear') as HTMLSelectElement).value;
  const month = (document.getElementById('filterMonth') as HTMLSelectElement).value;
  const status = (document.getElementById('filterStatus') as HTMLSelectElement).value;

  // NOTE: Intentionally does not filter by selectedDay or searchTerm — pre-existing behavior
  const filtered = state.allOrdersData.orders.filter(order => {
    if (year && order.orderYear != Number(year)) return false;
    if (month && order.orderMonth != Number(month)) return false;
    if (status && order.statusCode != Number(status)) return false;
    return true;
  });

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

  const fileName = `shopee-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
