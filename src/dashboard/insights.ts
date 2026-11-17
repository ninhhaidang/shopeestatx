// Auto-generated spending insights from order data
import type { Order } from '../types/index.js';
import { formatCurrency, formatDate } from '../i18n/format.js';
import { deliveryDateOf } from './delivery-date.js';
import { shopDisplayName, shopIdentity } from './shop.js';
import { localDateKey, monthOf } from './month.js';
import { isExcludedOrder } from './order-status.js';
import { monthChange } from './overview.js';

export function generateInsights(allOrders: Order[], now: Date = new Date()): string[] {
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const completed = (os: Order[]) => os.filter(o => !isExcludedOrder(o));
  const sum = (os: Order[]) => os.reduce((s, o) => s + o.subTotal, 0);

  const completedAll = completed(allOrders);
  const inMonth = (month: number, year: number) =>
    completedAll.filter(o => {
      const m = monthOf(o);
      return m?.month === month && m.year === year;
    });
  const thisMonth = inMonth(currentMonth, currentYear);

  const insights: string[] = [];

  // Month-over-month spending change, day for day while the month is still running (same rule as Tổng quan)
  const thisMonthTotal = sum(thisMonth);
  const month = monthChange(allOrders, now);
  const pct = month.previous > 0 ? Math.round((month.current - month.previous) / month.previous * 100) : 0;
  if (thisMonthTotal > 0 && pct !== 0) {
    const versus = month.through ? 'cùng kỳ tháng trước' : 'tháng trước';
    insights.push(`Tháng này bạn đã chi ${formatCurrency(thisMonthTotal)}, ${pct > 0 ? 'tăng' : 'giảm'} ${Math.abs(pct)}% so với ${versus}.`);
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
    const day = deliveryDateOf(o);
    if (!day) return;
    const key = localDateKey(day);
    daySpend[key] = (daySpend[key] || 0) + o.subTotal;
  });
  const topDay = Object.entries(daySpend).sort((a, b) => b[1] - a[1])[0];
  if (topDay) {
    insights.push(`Ngày ${formatDate(new Date(`${topDay[0]}T00:00:00`))} là ngày bạn chi nhiều nhất tháng này (${formatCurrency(topDay[1])}).`);
  }

  // The response gives original excluded value, not a verified refund or savings transaction.
  const cancelled = allOrders.filter(isExcludedOrder);
  const cancelledTotal = cancelled.reduce((s, o) => s + (o.refundAmount ?? 0), 0);
  if (cancelledTotal > 0) {
    insights.push(`Tổng giá trị các đơn bị hủy/trả hàng có dữ liệu là ${formatCurrency(cancelledTotal)}.`);
  }

  return insights.slice(0, 5);
}
