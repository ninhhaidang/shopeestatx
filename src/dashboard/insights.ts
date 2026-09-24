// Auto-generated spending insights from order data
import type { Order, InsightCard, InsightPattern } from '../types/index.js';
import { formatVND, escapeHtml } from './utils.js';
import { categorizeOrder } from './categories.js';
import { t } from '../i18n/index.js';

export type { InsightCard, InsightPattern };

const ICON_CALENDAR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
const ICON_STORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
const ICON_TAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
const ICON_TREND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
const ICON_PACKAGE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>';
const ICON_SHIELD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

/**
 * Generates structured spending insight cards highlighting peak day,
 * merchant share, category trends, and monthly cadence.
 */
export function generateStructuredInsights(
  orders: Order[],
  allOrders: Order[],
  now = new Date()
): InsightCard[] {
  const completed = (os: Order[]) => os.filter(o => o.statusCode !== 4 && o.statusCode !== 12);
  const sum = (os: Order[]) => os.reduce((s, o) => s + o.subTotal, 0);

  const completedFiltered = completed(orders);
  const completedAll = completed(allOrders);
  const totalFilteredSpent = sum(completedFiltered);
  const totalAllSpent = sum(completedAll);
  const cards: InsightCard[] = [];

  // 1. Peak Day (highest spending day)
  const targetOrdersForPeak = completedFiltered.length > 0 ? completedFiltered : completedAll;
  const dayStats: Record<string, { spend: number; count: number }> = {};
  targetOrdersForPeak.forEach(o => {
    if (!o.deliveryDate) return;
    const day = o.deliveryDate.substring(0, 10);
    if (!dayStats[day]) dayStats[day] = { spend: 0, count: 0 };
    dayStats[day].spend += o.subTotal;
    dayStats[day].count += 1;
  });
  const topDayEntry = Object.entries(dayStats).sort((a, b) => b[1].spend - a[1].spend)[0];
  if (topDayEntry && topDayEntry[1].spend > 0) {
    cards.push({
      id: 'card-peak-day',
      pattern: 'peak-day',
      icon: ICON_CALENDAR,
      title: 'Ngày chi nhiều nhất',
      value: formatVND(topDayEntry[1].spend),
      description: `Ngày ${topDayEntry[0]} (${topDayEntry[1].count} đơn) - ngày có mức chi tiêu cao nhất.`,
    });
  }

  // 2. Merchant Share (dominant merchant)
  const shopStats: Record<string, { count: number; spend: number }> = {};
  const targetOrdersForShop = completedFiltered.length > 0 ? completedFiltered : completedAll;
  targetOrdersForShop.forEach(o => {
    const shop = o.shopName.split(' - ')[1] || o.shopName;
    if (!shopStats[shop]) shopStats[shop] = { count: 0, spend: 0 };
    shopStats[shop].count += 1;
    shopStats[shop].spend += o.subTotal;
  });
  const topShopEntry = Object.entries(shopStats).sort((a, b) => b[1].count - a[1].count)[0];
  if (topShopEntry && targetOrdersForShop.length > 0) {
    const sharePct = Math.round((topShopEntry[1].count / targetOrdersForShop.length) * 100);
    cards.push({
      id: 'card-merchant-share',
      pattern: 'merchant-share',
      icon: ICON_STORE,
      title: 'Shop chiếm thị phần lớn nhất',
      value: topShopEntry[0].substring(0, 24),
      description: `${topShopEntry[1].count} đơn (${sharePct}% tổng đơn), chi tiêu ${formatVND(topShopEntry[1].spend)}.`,
    });
  }

  // 3. Category Trends (dominant category)
  const targetOrdersForCategory = completedFiltered.length > 0 ? completedFiltered : completedAll;
  const catAmount: Record<string, { amount: number; count: number }> = {};
  targetOrdersForCategory.forEach(o => {
    const cat = categorizeOrder(o);
    if (!catAmount[cat]) catAmount[cat] = { amount: 0, count: 0 };
    catAmount[cat].amount += o.subTotal;
    catAmount[cat].count += 1;
  });
  const topCatEntry = Object.entries(catAmount).sort((a, b) => b[1].amount - a[1].amount)[0];
  const catTotalSpent = completedFiltered.length > 0 ? totalFilteredSpent : totalAllSpent;
  if (topCatEntry && catTotalSpent > 0) {
    const pct = Math.round((topCatEntry[1].amount / catTotalSpent) * 100);
    cards.push({
      id: 'card-category-trends',
      pattern: 'category-trends',
      icon: ICON_TAG,
      title: 'Danh mục chi tiêu hàng đầu',
      value: topCatEntry[0],
      description: `Chiếm ${pct}% tổng chi tiêu (${formatVND(topCatEntry[1].amount)} với ${topCatEntry[1].count} đơn).`,
    });
  }

  // 4. Month-over-Month Spending Trend
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const thisMonthOrders = completedAll.filter(o => o.orderMonth === currentMonth && o.orderYear === currentYear);
  const lastMonthOrders = completedAll.filter(o => o.orderMonth === lastMonth && o.orderYear === lastMonthYear);
  const thisMonthSpend = sum(thisMonthOrders);
  const lastMonthSpend = sum(lastMonthOrders);

  if (thisMonthSpend > 0 && lastMonthSpend > 0) {
    const pct = Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100);
    const dir = pct >= 0 ? 'tăng' : 'giảm';
    cards.push({
      id: 'card-spending-trend',
      pattern: 'spending-trend',
      icon: ICON_TREND,
      title: 'Xu hướng chi tiêu tháng này',
      value: `${dir === 'tăng' ? '+' : ''}${pct}%`,
      description: `Tháng này chi ${formatVND(thisMonthSpend)}, ${dir} ${Math.abs(pct)}% so với tháng trước.`,
    });
  }

  // 5. Order Frequency
  const months = new Set(completedAll.map(o => `${o.orderMonth}/${o.orderYear}`)).size;
  if (months > 1) {
    const avgOrders = (completedAll.length / months).toFixed(1);
    cards.push({
      id: 'card-frequency',
      pattern: 'frequency',
      icon: ICON_PACKAGE,
      title: 'Tần suất mua sắm',
      value: `${avgOrders} đơn / tháng`,
      description: `Trung bình đặt ${avgOrders} đơn/tháng trên tổng số ${months} tháng hoạt động.`,
    });
  }

  // 6. Savings from Cancelled/Returned
  const cancelledOrders = allOrders.filter(o => o.statusCode === 4 || o.statusCode === 12);
  const cancelledTotal = sum(cancelledOrders);
  if (cancelledTotal > 0) {
    cards.push({
      id: 'card-savings',
      pattern: 'savings',
      icon: ICON_SHIELD,
      title: 'Khoản tiết kiệm từ hủy/trả',
      value: formatVND(cancelledTotal),
      description: `Bạn đã tránh chi tiêu ${formatVND(cancelledTotal)} từ ${cancelledOrders.length} đơn đã hủy hoặc trả hàng.`,
    });
  }

  return cards.slice(0, 6);
}

/**
 * Legacy string-based insights generator for backward compatibility.
 */
export function generateInsights(orders: Order[], allOrders: Order[]): string[] {
  const cards = generateStructuredInsights(orders, allOrders);
  return cards.map(c => c.description);
}

/**
 * Renders insight cards into a 3-column responsive card grid.
 */
export function renderInsights(container: HTMLElement, insights: (InsightCard | string)[]): void {
  if (insights.length === 0) {
    container.innerHTML = `<p class="insights-empty" data-i18n="insights.empty">${t('insights.empty')}</p>`;
    return;
  }

  const cardsHtml = insights.map((item, idx) => {
    if (typeof item === 'string') {
      return `
        <div class="insight-card" data-pattern="custom">
          <div class="insight-card-header">
            <div class="insight-card-icon">💡</div>
            <span class="insight-card-title">Gợi ý chi tiêu</span>
          </div>
          <div class="insight-card-value">Thông tin chi tiêu</div>
          <div class="insight-card-desc">${escapeHtml(item)}</div>
        </div>
      `;
    }
    return `
      <div class="insight-card" data-pattern="${escapeHtml(item.pattern)}" id="${escapeHtml(item.id || `insight-${idx}`)}">
        <div class="insight-card-header">
          <div class="insight-card-icon">${item.icon}</div>
          <span class="insight-card-title">${escapeHtml(item.title)}</span>
        </div>
        <div class="insight-card-value">${escapeHtml(item.value)}</div>
        <div class="insight-card-desc">${escapeHtml(item.description)}</div>
      </div>
    `;
  }).join('');

  if (container.classList.contains('insights-grid')) {
    container.innerHTML = cardsHtml;
  } else {
    container.innerHTML = `<div class="insights-grid">${cardsHtml}</div>`;
  }
}
