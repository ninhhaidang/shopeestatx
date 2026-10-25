// Auto-generated spending insights from order data
import type { Order } from '../types/index.js';
import { formatCurrency } from '../i18n/format.js';
import { shopDisplayName, shopIdentity } from './shop.js';
import { localDateKey, monthOf } from './month.js';
import { isExcludedOrder } from './order-status.js';

export function generateInsights(allOrders: Order[], now: Date = new Date()): string[] {
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const completed = (os: Order[]) => os.filter(o => !isExcludedOrder(o));
  const sum = (os: Order[]) => os.reduce((s, o) => s + o.subTotal, 0);

  const completedAll = completed(allOrders);
  const inMonth = (month: number, year: number) =>
    completedAll.filter(o => {
      const m = monthOf(o);
      return m?.month === month && m.year === year;
    });
  const thisMonth = inMonth(currentMonth, currentYear);
  const lastMonthOrders = inMonth(lastMonth, lastMonthYear);

  const insights: string[] = [];

  // Month-over-month spending change
  const thisMonthTotal = sum(thisMonth);
  const lastMonthTotal = sum(lastMonthOrders);
  if (thisMonthTotal > 0 && lastMonthTotal > 0) {
    const pct = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(0);
    const dir = Number(pct) > 0 ? 'tăng' : 'giảm';
    insights.push(`Tháng này bạn đã chi ${formatCurrency(thisMonthTotal)}, ${dir} ${Math.abs(Number(pct))}% so với tháng trước.`);
  } else if (thisMonthTotal > 0) {
    insights.push(`Tháng này bạn đã chi ${formatCurrency(thisMonthTotal)} trên Shopee.`);
  }

  // Top shop by order count
  const shopCount = new Map<string, { name: string; count: number }>();
  completedAll.forEach(o => {
    const key = shopIdentity(o);
    const shop = shopCount.get(key) ?? { name: shopDisplayName(o.shopName), count: 0 };
    shop.count += 1;
    shopCount.set(key, shop);
  });
  const topShop = [...shopCount.values()].sort((a, b) => b.count - a.count)[0];
  if (topShop) {
    insights.push(`Shop "${topShop.name}" là nơi bạn mua nhiều nhất (${topShop.count} đơn).`);
  }

  // Average monthly order count
  const datedMonths = completedAll.map(monthOf).filter(m => m !== null);
  const months = new Set(datedMonths.map(m => `${m.month}/${m.year}`)).size;
  if (months > 1) {
    const avg = (datedMonths.length / months).toFixed(0);
    insights.push(`Bạn đặt trung bình ${avg} đơn/tháng trên Shopee.`);
  }

  // Highest spending day this month
  const daySpend: Record<string, number> = {};
  thisMonth.forEach(o => {
    if (!o.deliveryDate) return;
    const day = localDateKey(new Date(o.deliveryDate));
    daySpend[day] = (daySpend[day] || 0) + o.subTotal;
  });
  const topDay = Object.entries(daySpend).sort((a, b) => b[1] - a[1])[0];
  if (topDay) {
    insights.push(`Ngày ${topDay[0]} là ngày bạn chi nhiều nhất tháng này (${formatCurrency(topDay[1])}).`);
  }

  // The response gives original excluded value, not a verified refund or savings transaction.
  const cancelled = allOrders.filter(isExcludedOrder);
  const cancelledTotal = cancelled.reduce((s, o) => s + (o.refundAmount ?? 0), 0);
  if (cancelledTotal > 0) {
    insights.push(`Tổng giá trị các đơn bị hủy/trả hàng có dữ liệu là ${formatCurrency(cancelledTotal)}.`);
  }

  return insights.slice(0, 5);
}
