// Shop loyalty analysis — repeat purchase metrics per shop
import type { Order } from '../types/index.js';
import { formatVND } from './utils.js';
import { EVENTS } from '../config.js';

export interface ShopLoyalty {
  shopName: string;
  orderCount: number;
  totalSpent: number;
  firstOrder: string;   // YYYY-MM-DD
  lastOrder: string;    // YYYY-MM-DD
  avgOrderValue: number;
  repeatRate: number;   // orders per month (over past 12 months)
}

export function analyzeShopLoyalty(allOrders: Order[]): ShopLoyalty[] {
  const shopMap: Record<string, { orders: number; spent: number; dates: string[] }> = {};

  const completed = allOrders.filter(o => o.statusCode !== 4 && o.statusCode !== 12);
  completed.forEach(o => {
    const shop = o.shopName.split(' - ')[1] || o.shopName;
    if (!shopMap[shop]) shopMap[shop] = { orders: 0, spent: 0, dates: [] };
    shopMap[shop].orders += 1;
    shopMap[shop].spent += o.subTotal;
    if (o.deliveryDate) shopMap[shop].dates.push(o.deliveryDate.substring(0, 10));
  });

  return Object.entries(shopMap)
    .filter(([, v]) => v.orders >= 3) // only shops with 3+ orders
    .map(([shopName, v]) => {
      const sorted = [...v.dates].sort();
      const firstOrder = sorted[0] ?? '';
      const lastOrder = sorted[sorted.length - 1] ?? '';
      // ISSUE-7: use actual data span (capped at 12 months) instead of always dividing by 12
      let monthsSpan = 1;
      if (firstOrder && lastOrder && firstOrder !== lastOrder) {
        const f = new Date(firstOrder), l = new Date(lastOrder);
        monthsSpan = Math.min(
          Math.max((l.getFullYear() - f.getFullYear()) * 12 + (l.getMonth() - f.getMonth()) + 1, 1),
          12,
        );
      }
      return {
        shopName,
        orderCount: v.orders,
        totalSpent: v.spent,
        firstOrder,
        lastOrder,
        avgOrderValue: Math.round(v.spent / v.orders),
        repeatRate: parseFloat((v.orders / monthsSpan).toFixed(1)),
      };
    })
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10);
}

export function renderShopLoyalty(container: HTMLElement, data: ShopLoyalty[]): void {
  if (data.length === 0) {
    container.innerHTML = '<p class="loyalty-empty">Chưa đủ dữ liệu (cần ít nhất 3 đơn/shop).</p>';
    return;
  }

  const rows = data.map(s => `
    <tr>
      <td><button class="loyalty-shop-btn" data-shop="${s.shopName.substring(0, 25)}">${s.shopName.substring(0, 30)}</button></td>
      <td class="text-center">${s.orderCount}</td>
      <td>${formatVND(s.totalSpent)}</td>
      <td>${formatVND(s.avgOrderValue)}</td>
      <td class="text-center">${s.repeatRate}/tháng</td>
      <td class="text-center">${s.lastOrder}</td>
    </tr>`).join('');

  container.innerHTML = `
    <table class="loyalty-table">
      <thead>
        <tr>
          <th>Shop</th>
          <th class="text-center">Số đơn</th>
          <th>Tổng tiền</th>
          <th>TB/đơn</th>
          <th class="text-center">Tần suất</th>
          <th class="text-center">Mua cuối</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  // Dispatch event instead of importing applyFilters (avoids circular dep)
  container.querySelectorAll<HTMLButtonElement>('.loyalty-shop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent(EVENTS.FILTER_BY_SHOP, { detail: btn.dataset.shop }));
    });
  });
}
