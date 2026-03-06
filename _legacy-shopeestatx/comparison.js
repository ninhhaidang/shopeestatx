// ShopeeStatX/comparison.js
import { state } from './state.js';
import { formatVND } from './utils.js';

export function renderData(orders) {
  // Calculate totals for filtered data
  let totalProducts = 0;
  let totalAmount = 0;

  orders.forEach(order => {
    totalProducts += order.productCount;
    if (order.statusCode !== 4 && order.statusCode !== 12) {
      totalAmount += order.subTotal;
    }
  });

  document.getElementById('totalOrders').textContent = orders.length.toLocaleString('vi-VN');
  document.getElementById('totalProducts').textContent = totalProducts.toLocaleString('vi-VN');
  document.getElementById('totalAmount').textContent = formatVND(totalAmount);

  // Time comparison calculations
  renderTimeComparison(state.allOrdersData.orders);
}

export function renderTimeComparison(allOrders) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastYear = currentYear - 1;

  // Filter completed orders only
  const completedOrders = allOrders.filter(o => o.statusCode !== 4 && o.statusCode !== 12);

  // Current month
  const currentMonthOrders = completedOrders.filter(o =>
    o.orderMonth === currentMonth && o.orderYear === currentYear
  );
  const currentMonthTotal = currentMonthOrders.reduce((sum, o) => sum + o.subTotal, 0);

  // Last month
  const lastMonthOrders = completedOrders.filter(o =>
    o.orderMonth === lastMonth && o.orderYear === lastMonthYear
  );
  const lastMonthTotal = lastMonthOrders.reduce((sum, o) => sum + o.subTotal, 0);

  // Current year
  const currentYearOrders = completedOrders.filter(o => o.orderYear === currentYear);
  const currentYearTotal = currentYearOrders.reduce((sum, o) => sum + o.subTotal, 0);

  // Last year
  const lastYearOrders = completedOrders.filter(o => o.orderYear === lastYear);
  const lastYearTotal = lastYearOrders.reduce((sum, o) => sum + o.subTotal, 0);

  // Average order value
  const avgOrderValue = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + o.subTotal, 0) / completedOrders.length
    : 0;

  // Calculate changes
  const monthChange = lastMonthTotal > 0
    ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
    : null;

  const yearChange = lastYearTotal > 0
    ? ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1)
    : null;

  // Update UI
  document.getElementById('currentMonthAmount').textContent = formatVND(currentMonthTotal);
  document.getElementById('currentYearAmount').textContent = formatVND(currentYearTotal);
  document.getElementById('avgOrderValue').textContent = formatVND(avgOrderValue);

  // Month comparison
  const monthCompEl = document.getElementById('monthComparison');
  if (monthChange !== null) {
    const arrow = monthChange >= 0 ? '↑' : '↓';
    const color = monthChange >= 0 ? '#f44336' : '#4caf50';
    monthCompEl.innerHTML = `<span style="color: ${color}">${arrow} ${Math.abs(monthChange)}% so với tháng trước</span>`;
  } else {
    monthCompEl.textContent = 'Chưa có dữ liệu tháng trước';
  }

  // Year comparison
  const yearCompEl = document.getElementById('yearComparison');
  if (yearChange !== null) {
    const arrow = yearChange >= 0 ? '↑' : '↓';
    const color = yearChange >= 0 ? '#f44336' : '#4caf50';
    yearCompEl.innerHTML = `<span style="color: ${color}">${arrow} ${Math.abs(yearChange)}% so với năm ngoái</span>`;
  } else {
    yearCompEl.textContent = 'Chưa có dữ liệu năm ngoái';
  }

  // Average comparison (show count)
  const avgCompEl = document.getElementById('avgComparison');
  avgCompEl.textContent = `${completedOrders.length} đơn hàng hoàn thành`;
}
