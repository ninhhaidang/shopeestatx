// Time comparison calculations and summary card rendering
import type { Order } from '../types/index.js';
import { state } from './state.js';
import { formatVND } from './utils.js';
import { t } from '../i18n/index.js';

export function renderData(orders: Order[]): void {
  let totalProducts = 0;
  let totalAmount = 0;

  orders.forEach(order => {
    totalProducts += order.productCount;
    if (order.statusCode !== 4 && order.statusCode !== 12) {
      totalAmount += order.subTotal;
    }
  });

  document.getElementById('totalOrders')!.textContent = orders.length.toLocaleString('vi-VN');
  document.getElementById('totalProducts')!.textContent = totalProducts.toLocaleString('vi-VN');
  document.getElementById('totalAmount')!.textContent = formatVND(totalAmount);

  renderTimeComparison(state.allOrdersData!.orders);
}

export function renderTimeComparison(allOrders: Order[]): void {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastYear = currentYear - 1;

  const completedOrders = allOrders.filter(o => o.statusCode !== 4 && o.statusCode !== 12);

  const currentMonthTotal = completedOrders
    .filter(o => o.orderMonth === currentMonth && o.orderYear === currentYear)
    .reduce((sum, o) => sum + o.subTotal, 0);

  const lastMonthTotal = completedOrders
    .filter(o => o.orderMonth === lastMonth && o.orderYear === lastMonthYear)
    .reduce((sum, o) => sum + o.subTotal, 0);

  const currentYearTotal = completedOrders
    .filter(o => o.orderYear === currentYear)
    .reduce((sum, o) => sum + o.subTotal, 0);

  const lastYearTotal = completedOrders
    .filter(o => o.orderYear === lastYear)
    .reduce((sum, o) => sum + o.subTotal, 0);

  const avgOrderValue = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + o.subTotal, 0) / completedOrders.length
    : 0;

  const monthChange = lastMonthTotal > 0
    ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
    : null;

  const yearChange = lastYearTotal > 0
    ? ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1)
    : null;

  document.getElementById('currentMonthAmount')!.textContent = formatVND(currentMonthTotal);
  document.getElementById('currentYearAmount')!.textContent = formatVND(currentYearTotal);
  document.getElementById('avgOrderValue')!.textContent = formatVND(avgOrderValue);

  const monthCompEl = document.getElementById('monthComparison')!;
  if (monthChange !== null) {
    const isUp = Number(monthChange) >= 0;
    const color = isUp ? '#f44336' : '#4caf50';
    const key = isUp ? 'comparison.vsLastMonthUp' : 'comparison.vsLastMonthDown';
    monthCompEl.innerHTML = `<span style="color: ${color}">${t(key, { change: Math.abs(Number(monthChange)) })}</span>`;
  } else {
    monthCompEl.textContent = t('comparison.noLastMonth');
  }

  const yearCompEl = document.getElementById('yearComparison')!;
  if (yearChange !== null) {
    const isUp = Number(yearChange) >= 0;
    const color = isUp ? '#f44336' : '#4caf50';
    const key = isUp ? 'comparison.vsLastYearUp' : 'comparison.vsLastYearDown';
    yearCompEl.innerHTML = `<span style="color: ${color}">${t(key, { change: Math.abs(Number(yearChange)) })}</span>`;
  } else {
    yearCompEl.textContent = t('comparison.noLastYear');
  }

  document.getElementById('avgComparison')!.textContent = t('comparison.completedOrders', { count: completedOrders.length });
}
