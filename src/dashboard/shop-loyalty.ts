// Shop loyalty analysis — repeat purchase metrics per shop
import type { Order, LoyaltyTier } from '../types/index.js';
import { formatVND, escapeHtml } from './utils.js';
import { EVENTS } from '../config.js';
import { switchTab } from './tabs.js';
export type { LoyaltyTier };
export interface ShopLoyalty {
  shopName: string;
  orderCount: number;
  totalSpent: number;
  firstOrder: string;   // YYYY-MM-DD
  lastOrder: string;    // YYYY-MM-DD
  avgOrderValue: number;
  repeatRate: number;   // orders per month (over past 12 months)
  tier: LoyaltyTier;
}

/**
 * Calculates loyalty tier badge from order count and purchase frequency.
 */
export function computeLoyaltyBadge(orderCount: number, repeatRate: number): LoyaltyTier {
  if (orderCount >= 8 || (orderCount >= 6 && repeatRate >= 2.0)) {
    return 'VIP';
  }
  if (orderCount >= 4) {
    return 'Regular';
  }
  return 'New';
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
      const repeatRate = parseFloat((v.orders / monthsSpan).toFixed(1));
      const tier = computeLoyaltyBadge(v.orders, repeatRate);
      return {
        shopName,
        orderCount: v.orders,
        totalSpent: v.spent,
        firstOrder,
        lastOrder,
        avgOrderValue: Math.round(v.spent / v.orders),
        repeatRate,
        tier,
      };
    })
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10);
}

export function renderShopLoyalty(
  container: HTMLElement,
  data: ShopLoyalty[],
  onShopClick?: (shopName: string) => void
): void {
  if (data.length === 0) {
    container.innerHTML = '<p class="loyalty-empty">Chưa đủ dữ liệu (cần ít nhất 3 đơn/shop).</p>';
    return;
  }

  const rows = data.map(s => {
    const tierLower = s.tier.toLowerCase();
    return `
    <tr class="loyalty-row" data-shop="${escapeHtml(s.shopName)}" tabindex="0" role="button" aria-label="Lọc theo shop ${escapeHtml(s.shopName)}">
      <td>
        <div class="loyalty-shop-cell">
          <button type="button" class="loyalty-shop-btn" data-shop="${escapeHtml(s.shopName)}" title="Bấm để lọc theo shop ${escapeHtml(s.shopName)}">
            ${escapeHtml(s.shopName.substring(0, 30))}
          </button>
        </div>
      </td>
      <td class="text-center">
        <span class="loyalty-badge badge-${tierLower}">${escapeHtml(s.tier)}</span>
      </td>
      <td class="text-center">${s.orderCount}</td>
      <td>${formatVND(s.totalSpent)}</td>
      <td class="text-center">${s.repeatRate}/tháng</td>
      <td class="text-center">${escapeHtml(s.lastOrder)}</td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="loyalty-table">
      <thead>
        <tr>
          <th>Shop</th>
          <th class="text-center">Hạng</th>
          <th class="text-center">Số đơn</th>
          <th>Tổng tiền</th>
          <th class="text-center">Tần suất</th>
          <th class="text-center">Mua cuối</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  const handleSelectShop = (shopName: string) => {
    const searchBox = document.getElementById('searchBox') as HTMLInputElement | null;
    if (searchBox) {
      searchBox.value = shopName;
    }
    if (onShopClick) {
      onShopClick(shopName);
    } else {
      switchTab(3, { searchTerm: shopName });
      document.dispatchEvent(new CustomEvent(EVENTS.FILTER_BY_SHOP, { detail: shopName }));
    }
  };

  container.querySelectorAll<HTMLElement>('.loyalty-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.loyalty-shop-btn') as HTMLElement | null;
      const shop = btn?.dataset.shop || row.dataset.shop;
      if (shop) handleSelectShop(shop);
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const shop = row.dataset.shop;
        if (shop) handleSelectShop(shop);
      }
    });
  });
}
