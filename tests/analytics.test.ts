import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import type { Order } from '../src/types/index.js';
import { state } from '../src/dashboard/state.js';
import { renderHeatmap } from '../src/dashboard/heatmap.js';
import { switchTab, initTabs } from '../src/dashboard/tabs.js';
import { formatVND } from '../src/dashboard/utils.js';
import { analyzeShopLoyalty, renderShopLoyalty, computeLoyaltyBadge } from '../src/dashboard/shop-loyalty.js';
import { renderCategoryChart, computeCategoryPercentages, renderCategoryLegend, type CategoryBreakdown } from '../src/dashboard/categories.js';
import { generateStructuredInsights, renderInsights, type InsightCard } from '../src/dashboard/insights.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '1001',
    name: 'Test Product',
    productCount: 1,
    subTotal: 250000,
    subTotalFormatted: '250.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Shop A - Official',
    productSummary: 'Test Product x1',
    deliveryDate: '2024-05-15T10:00:00.000Z',
    orderMonth: 5,
    orderYear: 2024,
    ...overrides,
  };
}

describe('Tab 2 Analytics & Habits: Analytical Storytelling Flow', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="tabs-nav">
        <button id="tabBtn1" data-tab="1" class="tab-btn active" role="tab" aria-selected="true">Tổng quan</button>
        <button id="tabBtn2" data-tab="2" class="tab-btn" role="tab" aria-selected="false">Phân tích</button>
        <button id="tabBtn3" data-tab="3" class="tab-btn" role="tab" aria-selected="false">Đơn hàng <span id="tabOrderCount" class="tab-badge">0</span></button>
      </div>

      <section id="tabOverview" class="tab-panel active" data-tab="1" role="tabpanel"></section>

      <section id="tabAnalytics" class="tab-panel" data-tab="2" role="tabpanel">
        <div class="section-card heatmap-hero-section">
          <div id="heatmapContainer"></div>
        </div>
        <div class="analytics-comparison-grid">
          <div class="chart-box category-breakdown-card">
            <canvas id="categoryChart"></canvas>
            <div id="categoryLegend"></div>
          </div>
          <div class="chart-box shop-loyalty-card">
            <div id="loyaltyContainer"></div>
          </div>
        </div>
        <div class="section-card">
          <div id="insightsContainer" class="insights-grid"></div>
        </div>
      </section>

      <section id="tabOrders" class="tab-panel" data-tab="3" role="tabpanel">
        <div class="toolbar-container">
          <input type="text" id="searchBox" />
          <select id="filterYear"><option value="">Tất cả</option><option value="2024" selected>2024</option></select>
          <select id="filterMonth"><option value="">Tất cả</option></select>
          <select id="filterStatus"><option value="">Tất cả</option></select>
          <select id="filterCategory"><option value="">Tất cả</option><option value="Thời trang">Thời trang</option></select>
        </div>
        <div id="activeFiltersContainer" class="hidden"><div id="activeFilters"></div></div>
        <div id="ordersTable"></div>
      </section>
    `;

    container = document.getElementById('heatmapContainer') as HTMLDivElement;

    // Reset state
    state.activeTab = 2;
    state.currentPage = 1;
    state.itemsPerPage = 20;
    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: { field: null, direction: 'asc' },
    };

    const orders: Order[] = [
      makeOrder({ orderId: '1', deliveryDate: '2024-05-15T10:00:00.000Z', subTotal: 250000 }),
      makeOrder({ orderId: '2', deliveryDate: '2024-05-15T12:00:00.000Z', subTotal: 150000 }),
      makeOrder({ orderId: '3', deliveryDate: '2024-06-20T10:00:00.000Z', subTotal: 500000 }),
      makeOrder({ orderId: '4', deliveryDate: '2024-06-20T15:00:00.000Z', subTotal: 700000 }),
      makeOrder({ orderId: '5', deliveryDate: '2024-06-20T18:00:00.000Z', subTotal: 100000 }),
      makeOrder({ orderId: '6', deliveryDate: '2024-06-20T20:00:00.000Z', subTotal: 300000 }),
    ];

    state.allOrdersData = {
      user: null,
      orders,
      totalCount: orders.length,
      totalAmount: orders.reduce((s, o) => s + o.subTotal, 0),
      totalAmountFormatted: formatVND(orders.reduce((s, o) => s + o.subTotal, 0)),
      fetchedAt: new Date().toISOString(),
    };
    state.filteredOrders = [...orders];

    initTabs();
    switchTab(2);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Seam 1: Heatmap Hero Rendering & Spend Details in Tooltip', () => {
    it('renders 52-week activity heatmap SVG with level-0 to level-4 theme-aware color classes', () => {
      renderHeatmap(container, state.allOrdersData!.orders);

      const svg = container.querySelector('svg.heatmap-svg');
      expect(svg).not.toBeNull();

      const cells = container.querySelectorAll('.heatmap-cell');
      expect(cells.length).toBeGreaterThan(50); // multiple weeks * 7 days

      // Cell on 2024-05-15 has orders -> level > 0
      const activeCell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      expect(activeCell).not.toBeNull();
      const hasIntensityClass = [1, 2, 3, 4].some(lvl => activeCell.classList.contains(`heatmap-${lvl}`));
      expect(hasIntensityClass).toBe(true);

      // Cell without orders -> level-0
      const emptyCell = container.querySelector('.heatmap-cell[data-date="2024-01-02"]') as SVGElement;
      if (emptyCell) {
        expect(emptyCell.classList.contains('heatmap-0')).toBe(true);
      }
    });

    it('displays spend details (order count and spend amount) in data-tip tooltip for day cells', () => {
      renderHeatmap(container, state.allOrdersData!.orders);

      const cell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      expect(cell).not.toBeNull();
      const tip = cell.getAttribute('data-tip');
      expect(tip).toBeDefined();

      // On 2024-05-15: 2 orders, total spend = 250,000 + 150,000 = 400,000 VND
      expect(tip).toContain('2024-05-15');
      expect(tip).toContain('2'); // 2 orders
      expect(tip).toContain('400.000'); // Spend formatted in VND
    });
  });

  describe('Seam 2: Heatmap Date Click Drill-Down to Tab 3', () => {
    it('clicking a date cell navigates to Tab 3 with TimeCriteria set to that specific day', () => {
      // By default without external onDrillDown, renderHeatmap navigates to Tab 3
      renderHeatmap(container, state.allOrdersData!.orders);

      const cell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      expect(cell).not.toBeNull();

      cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Acceptance criteria: clicking a date cell navigates to Tab 3 with TimeCriteria set to that specific day
      expect(state.activeTab).toBe(3);
      expect(state.criteria.time).toEqual({
        kind: 'day',
        year: 2024,
        month: 5,
        day: 15,
      });

      // Verify DOM tab panel active class switched
      const tabAnalytics = document.getElementById('tabAnalytics');
      const tabOrders = document.getElementById('tabOrders');
      expect(tabAnalytics?.classList.contains('active')).toBe(false);
      expect(tabOrders?.classList.contains('active')).toBe(true);
    });

    it('invokes custom onDrillDown callback if provided and allows caller to control navigation', () => {
      const onDrillDown = vi.fn((preset) => {
        switchTab(3, preset);
      });

      renderHeatmap(container, state.allOrdersData!.orders, onDrillDown);

      const cell = container.querySelector('.heatmap-cell[data-date="2024-06-20"]') as SVGElement;
      cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'day', year: 2024, month: 6, day: 20 },
      });
      expect(state.activeTab).toBe(3);
      expect(state.criteria.time).toEqual({
        kind: 'day',
        year: 2024,
        month: 6,
        day: 20,
      });
    });
  });
  describe('Seam 3: Shop Loyalty Ranking & Badges (VIP / Regular / New)', () => {
    it('computeLoyaltyBadge assigns VIP for >= 8 orders or high repeat rate with >= 6 orders', () => {
      expect(computeLoyaltyBadge(10, 2.5)).toBe('VIP');
      expect(computeLoyaltyBadge(8, 0.8)).toBe('VIP');
      expect(computeLoyaltyBadge(6, 2.5)).toBe('VIP');
    });

    it('computeLoyaltyBadge assigns Regular for 4-7 orders', () => {
      expect(computeLoyaltyBadge(5, 0.9)).toBe('Regular');
      expect(computeLoyaltyBadge(4, 1.2)).toBe('Regular');
    });

    it('computeLoyaltyBadge assigns New for low order counts (< 4)', () => {
      expect(computeLoyaltyBadge(3, 3.0)).toBe('New');
      expect(computeLoyaltyBadge(3, 0.5)).toBe('New');
      expect(computeLoyaltyBadge(1, 0.2)).toBe('New');
    });
    it('analyzeShopLoyalty calculates purchase frequency, repeat rate, and attaches loyalty badges', () => {
      const mockOrders: Order[] = [
        // Shop VIP (8 orders)
        ...Array.from({ length: 8 }, (_, i) =>
          makeOrder({
            orderId: `vip-${i}`,
            shopName: 'Shop VIP Store',
            subTotal: 100000,
            deliveryDate: `2024-0${Math.min(i + 1, 9)}-15T10:00:00.000Z`,
          })
        ),
        // Shop Regular (4 orders)
        ...Array.from({ length: 4 }, (_, i) =>
          makeOrder({
            orderId: `reg-${i}`,
            shopName: 'Shop Regular Fashion',
            subTotal: 200000,
            deliveryDate: `2024-0${Math.min(i + 2, 9)}-10T10:00:00.000Z`,
          })
        ),
        // Shop New (3 orders)
        ...Array.from({ length: 3 }, (_, i) =>
          makeOrder({
            orderId: `new-${i}`,
            shopName: 'Shop New Books',
            subTotal: 50000,
            deliveryDate: `2024-08-0${i + 1}T10:00:00.000Z`,
          })
        ),
      ];

      const loyaltyData = analyzeShopLoyalty(mockOrders);
      expect(loyaltyData.length).toBe(3);

      const vipShop = loyaltyData.find(s => s.shopName.includes('Shop VIP'));
      expect(vipShop).toBeDefined();
      expect(vipShop?.orderCount).toBe(8);
      expect(vipShop?.tier).toBe('VIP');

      const regShop = loyaltyData.find(s => s.shopName.includes('Shop Regular'));
      expect(regShop).toBeDefined();
      expect(regShop?.orderCount).toBe(4);
      expect(regShop?.tier).toBe('Regular');

      const newShop = loyaltyData.find(s => s.shopName.includes('Shop New'));
      expect(newShop).toBeDefined();
      expect(newShop?.orderCount).toBe(3);
      expect(newShop?.tier).toBe('New');
    });
  });

  describe('Seam 4: Shop Loyalty Table Click-to-Filter Navigates to Tab 3', () => {
    it('renders loyalty ranking table with loyalty badges and merchant data', () => {
      const loyaltyContainer = document.getElementById('loyaltyContainer') as HTMLElement;
      const data = [
        {
          shopName: 'Anker Official Store',
          orderCount: 12,
          totalSpent: 4500000,
          firstOrder: '2024-01-10',
          lastOrder: '2024-09-01',
          avgOrderValue: 375000,
          repeatRate: 1.5,
          tier: 'VIP' as const,
        },
      ];

      renderShopLoyalty(loyaltyContainer, data);

      const badge = loyaltyContainer.querySelector('.loyalty-badge.badge-vip');
      expect(badge).not.toBeNull();
      expect(badge?.textContent?.trim()).toBe('VIP');

      const shopNameEl = loyaltyContainer.querySelector('[data-shop="Anker Official Store"]');
      expect(shopNameEl).not.toBeNull();
    });

    it('clicking a shop row in the loyalty table navigates to Tab 3 filtered by that merchant', () => {
      const loyaltyContainer = document.getElementById('loyaltyContainer') as HTMLElement;
      const data = [
        {
          shopName: 'Uniqlo Official',
          orderCount: 6,
          totalSpent: 2100000,
          firstOrder: '2024-02-14',
          lastOrder: '2024-08-20',
          avgOrderValue: 350000,
          repeatRate: 1.0,
          tier: 'Regular' as const,
        },
      ];

      renderShopLoyalty(loyaltyContainer, data);

      const shopRow = loyaltyContainer.querySelector('tr[data-shop="Uniqlo Official"]') ||
                      loyaltyContainer.querySelector('[data-shop="Uniqlo Official"]');
      expect(shopRow).not.toBeNull();

      // Click merchant
      shopRow!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Acceptance criteria: clicking a shop row in the loyalty table navigates to Tab 3 filtered by that merchant
      expect(state.activeTab).toBe(3);
      expect(state.criteria.searchTerm).toBe('Uniqlo Official');

      // Search input should be synced
      const searchInput = document.getElementById('searchBox') as HTMLInputElement;
      expect(searchInput.value).toBe('Uniqlo Official');

      // Verify Tab 3 panel is active
      const tabAnalytics = document.getElementById('tabAnalytics');
      const tabOrders = document.getElementById('tabOrders');
      expect(tabAnalytics?.classList.contains('active')).toBe(false);
      expect(tabOrders?.classList.contains('active')).toBe(true);
    });
  });
  describe('Seam 5: Category Breakdown Doughnut Chart & Percentage Legend', () => {
    const sampleBreakdown: CategoryBreakdown = {
      'Thời trang': { amount: 600000, count: 3 },
      'Điện tử': { amount: 300000, count: 1 },
      'Sách & Văn phòng': { amount: 100000, count: 2 },
    };

    it('computeCategoryPercentages calculates correct percentage breakdown for each category', () => {
      const items = computeCategoryPercentages(sampleBreakdown);
      expect(items.length).toBe(3);

      const fashion = items.find(i => i.category === 'Thời trang');
      expect(fashion).toBeDefined();
      expect(fashion?.percentage).toBe(60.0);

      const electronics = items.find(i => i.category === 'Điện tử');
      expect(electronics).toBeDefined();
      expect(electronics?.percentage).toBe(30.0);

      const books = items.find(i => i.category === 'Sách & Văn phòng');
      expect(books).toBeDefined();
      expect(books?.percentage).toBe(10.0);
    });

    it('renderCategoryLegend renders interactive percentage legend buttons', () => {
      const legendEl = document.getElementById('categoryLegend') as HTMLElement;
      const items = computeCategoryPercentages(sampleBreakdown);

      renderCategoryLegend(legendEl, items);

      const buttons = legendEl.querySelectorAll('.category-legend-item');
      expect(buttons.length).toBe(3);

      const fashionBtn = legendEl.querySelector('.category-legend-item[data-category="Thời trang"]');
      expect(fashionBtn).not.toBeNull();
      expect(fashionBtn?.textContent).toContain('Thời trang');
      expect(fashionBtn?.textContent).toContain('60%');
    });

    it('clicking a category item in the percentage legend navigates to Tab 3 filtered by category', () => {
      const legendEl = document.getElementById('categoryLegend') as HTMLElement;
      const items = computeCategoryPercentages(sampleBreakdown);
      renderCategoryLegend(legendEl, items);

      const fashionBtn = legendEl.querySelector('.category-legend-item[data-category="Thời trang"]') as HTMLElement;
      expect(fashionBtn).not.toBeNull();

      fashionBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(state.activeTab).toBe(3);
      expect(state.criteria.category).toBe('Thời trang');

      const categorySelect = document.getElementById('filterCategory') as HTMLSelectElement;
      expect(categorySelect.value).toBe('Thời trang');

      const tabAnalytics = document.getElementById('tabAnalytics');
      const tabOrders = document.getElementById('tabOrders');
      expect(tabAnalytics?.classList.contains('active')).toBe(false);
      expect(tabOrders?.classList.contains('active')).toBe(true);
    });
  });
  describe('Seam 6: Auto-Generated Insights 3-Column Responsive Grid', () => {
    const ordersForInsights: Order[] = [
      // Shop A (Fashion, 3 orders)
      makeOrder({ orderId: '1', shopName: 'Shop A', subTotal: 300000, name: 'Áo thun nam', deliveryDate: '2024-05-10T10:00:00.000Z', orderMonth: 5, orderYear: 2024 }),
      makeOrder({ orderId: '2', shopName: 'Shop A', subTotal: 200000, name: 'Quần jean', deliveryDate: '2024-05-10T14:00:00.000Z', orderMonth: 5, orderYear: 2024 }),
      makeOrder({ orderId: '3', shopName: 'Shop A', subTotal: 500000, name: 'Váy đầm nữ', deliveryDate: '2024-05-20T10:00:00.000Z', orderMonth: 5, orderYear: 2024 }),
      // Shop B (Electronics, 1 order - peak day with 1,200,000)
      makeOrder({ orderId: '4', shopName: 'Shop B', subTotal: 1200000, name: 'Tai nghe bluetooth', deliveryDate: '2024-05-25T10:00:00.000Z', orderMonth: 5, orderYear: 2024 }),
    ];

    it('generateStructuredInsights produces cards highlighting peak day, merchant share, and category trends', () => {
      const cards = generateStructuredInsights(ordersForInsights, ordersForInsights, new Date('2024-05-31T12:00:00.000Z'));

      expect(cards.length).toBeGreaterThanOrEqual(3);

      // 1. Peak day
      const peakDayCard = cards.find(c => c.pattern === 'peak-day');
      expect(peakDayCard).toBeDefined();
      expect(peakDayCard?.title).toContain('Ngày');
      expect(peakDayCard?.value).toContain('1.200.000');
      expect(peakDayCard?.description).toContain('2024-05-25');

      // 2. Merchant share
      const merchantCard = cards.find(c => c.pattern === 'merchant-share');
      expect(merchantCard).toBeDefined();
      expect(merchantCard?.value).toContain('Shop A');
      expect(merchantCard?.description).toContain('3 đơn');

      // 3. Category trends
      const categoryCard = cards.find(c => c.pattern === 'category-trends');
      expect(categoryCard).toBeDefined();
      expect(categoryCard?.title).toContain('Danh mục');
      expect(categoryCard?.description).toBeDefined();
    });

    it('renderInsights mounts a 3-column responsive grid with insight cards', () => {
      const containerEl = document.getElementById('insightsContainer') as HTMLElement;
      const cards: InsightCard[] = [
        {
          id: 'card-peak-day',
          pattern: 'peak-day',
          icon: '📅',
          title: 'Ngày chi nhiều nhất',
          value: '1.200.000 ₫',
          description: 'Ngày 2024-05-25 là ngày chi nhiều nhất',
        },
        {
          id: 'card-merchant-share',
          pattern: 'merchant-share',
          icon: '🏪',
          title: 'Shop ưa chuộng',
          value: 'Shop A',
          description: 'Chiếm 75% số lượng đơn hàng',
        },
        {
          id: 'card-category-trends',
          pattern: 'category-trends',
          icon: '🏷️',
          title: 'Xu hướng danh mục',
          value: 'Điện tử',
          description: 'Chiếm 55% tổng chi tiêu',
        },
      ];

      renderInsights(containerEl, cards);

      // Container has .insights-grid or contains .insights-grid
      const grid = containerEl.classList.contains('insights-grid')
        ? containerEl
        : containerEl.querySelector('.insights-grid');
      expect(grid).not.toBeNull();

      const cardEls = containerEl.querySelectorAll('.insight-card');
      expect(cardEls.length).toBe(3);

      const firstCard = cardEls[0];
      expect(firstCard.querySelector('.insight-card-title')?.textContent).toBe('Ngày chi nhiều nhất');
      expect(firstCard.querySelector('.insight-card-value')?.textContent).toBe('1.200.000 ₫');
      expect(firstCard.querySelector('.insight-card-desc')?.textContent).toContain('2024-05-25');
    });
  });
  describe('Seam 7: results.html Tab 2 Storytelling Hierarchy Layout', () => {
    it('verifies Tab 2 DOM hierarchy in results.html has hero heatmap, 50/50 comparison grid, and 3-column insights', () => {
      const html = fs.readFileSync(path.resolve(__dirname, '../src/dashboard/results.html'), 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const tab2 = doc.querySelector('#tabAnalytics');
      expect(tab2).not.toBeNull();

      // 1. Hero heatmap section
      const heroHeatmap = tab2?.querySelector('.heatmap-hero-section');
      expect(heroHeatmap).not.toBeNull();
      expect(heroHeatmap?.querySelector('#heatmapContainer')).not.toBeNull();

      // 2. 50% / 50% comparison grid
      const compGrid = tab2?.querySelector('.analytics-comparison-grid');
      expect(compGrid).not.toBeNull();
      expect(compGrid?.querySelector('#categoryChart')).not.toBeNull();
      expect(compGrid?.querySelector('#categoryLegend')).not.toBeNull();
      expect(compGrid?.querySelector('#loyaltyContainer')).not.toBeNull();

      // 3. Auto-generated insights grid
      const insightsSection = tab2?.querySelector('.insights-hero-section');
      expect(insightsSection).not.toBeNull();
      const insightsGrid = insightsSection?.querySelector('#insightsContainer.insights-grid');
      expect(insightsGrid).not.toBeNull();
    });
  });
});
