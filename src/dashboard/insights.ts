// Auto-generated spending insights from order data
import type { Order } from '../types/index.js';
import { formatVND } from './utils.js';
import { categorizeOrder } from './categories.js';
import { t } from '../i18n/index.js';

export function generateInsights(orders: Order[], allOrders: Order[]): string[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const completed = (os: Order[]) => os.filter(o => o.statusCode !== 4 && o.statusCode !== 12);
  const sum = (os: Order[]) => os.reduce((s, o) => s + o.subTotal, 0);

  const completedAll = completed(allOrders);
  const thisMonth = completedAll.filter(o => o.orderMonth === currentMonth && o.orderYear === currentYear);
  const lastMonthOrders = completedAll.filter(o => o.orderMonth === lastMonth && o.orderYear === lastMonthYear);

  const insights: string[] = [];

  // Month-over-month spending change
  const thisMonthTotal = sum(thisMonth);
  const lastMonthTotal = sum(lastMonthOrders);
  if (thisMonthTotal > 0 && lastMonthTotal > 0) {
    const pct = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(0);
    const dir = Number(pct) > 0 ? 'tăng' : 'giảm';
    insights.push(`Tháng này bạn đã chi ${formatVND(thisMonthTotal)}, ${dir} ${Math.abs(Number(pct))}% so với tháng trước.`);
  } else if (thisMonthTotal > 0) {
    insights.push(`Tháng này bạn đã chi ${formatVND(thisMonthTotal)} trên Shopee.`);
  }

  // Top shop by order count
  const shopCount: Record<string, number> = {};
  completedAll.forEach(o => {
    const shop = o.shopName.split(' - ')[1] || o.shopName;
    shopCount[shop] = (shopCount[shop] || 0) + 1;
  });
  const topShop = Object.entries(shopCount).sort((a, b) => b[1] - a[1])[0];
  if (topShop) {
    insights.push(`Shop "${topShop[0].substring(0, 25)}" là nơi bạn mua nhiều nhất (${topShop[1]} đơn).`);
  }

  // Top spending category (from filtered orders)
  const catAmount: Record<string, number> = {};
  const totalSpent = sum(completed(orders));
  completed(orders).forEach(o => {
    const cat = categorizeOrder(o);
    catAmount[cat] = (catAmount[cat] || 0) + o.subTotal;
  });
  const topCat = Object.entries(catAmount).sort((a, b) => b[1] - a[1])[0];
  if (topCat && totalSpent > 0) {
    const pct = (topCat[1] / totalSpent * 100).toFixed(0);
    insights.push(`Danh mục "${topCat[0]}" chiếm ${pct}% tổng chi tiêu trong kết quả lọc.`);
  }

  // Average monthly order count
  const months = new Set(completedAll.map(o => `${o.orderMonth}/${o.orderYear}`)).size;
  if (months > 1) {
    const avg = (completedAll.length / months).toFixed(0);
    insights.push(`Bạn đặt trung bình ${avg} đơn/tháng trên Shopee.`);
  }

  // Highest spending day this month
  const daySpend: Record<string, number> = {};
  thisMonth.forEach(o => {
    if (!o.deliveryDate) return;
    const day = o.deliveryDate.substring(0, 10);
    daySpend[day] = (daySpend[day] || 0) + o.subTotal;
  });
  const topDay = Object.entries(daySpend).sort((a, b) => b[1] - a[1])[0];
  if (topDay) {
    insights.push(`Ngày ${topDay[0]} là ngày bạn chi nhiều nhất tháng này (${formatVND(topDay[1])}).`);
  }

  // Savings from cancelled/returned orders
  const cancelled = allOrders.filter(o => o.statusCode === 4 || o.statusCode === 12);
  const cancelledTotal = cancelled.reduce((s, o) => s + o.subTotal, 0);
  if (cancelledTotal > 0) {
    insights.push(`Bạn đã tiết kiệm ${formatVND(cancelledTotal)} nhờ các đơn bị hủy/trả hàng.`);
  }

  return insights.slice(0, 5);
}

export function renderInsights(container: HTMLElement, insights: string[]): void {
  if (insights.length === 0) {
    container.innerHTML = `<p class="insights-empty" data-i18n="insights.empty">${t('insights.empty')}</p>`;
    return;
  }
  container.innerHTML = insights
    .map(text => `<div class="insight-item"><span class="insight-icon">💡</span>${text}</div>`)
    .join('');
}
