import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Order } from '../src/types/index.js';
import { state } from '../src/dashboard/state.js';
import { renderHeatmap, hideHeatmapTooltip } from '../src/dashboard/heatmap.js';
import { switchTab, initTabs, dismissAllTooltips } from '../src/dashboard/tabs.js';
import { applyFilters } from '../src/dashboard/filters.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'ORD-12345',
    orderTotal: 250000,
    subTotal: 250000,
    shippingFee: 0,
    itemCount: 1,
    status: 'Hoàn thành',
    statusCode: 3,
    orderDate: '2024-05-15T10:00:00.000Z',
    shopName: 'Shopee Shop A',
    shopId: 'SHOP-A',
    productSummary: 'Sản phẩm Test',
    deliveryDate: '2024-05-15T10:00:00.000Z',
    orderMonth: 5,
    orderYear: 2024,
    ...overrides,
  };
}

describe('Heatmap Transient Tooltip Lifecycle & Navigation Isolation (Ticket #18)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = `
      <div class="tabs-nav">
        <button id="tabBtn1" data-tab="1" class="tab-btn" role="tab" aria-selected="false">Tổng quan</button>
        <button id="tabBtn2" data-tab="2" class="tab-btn active" role="tab" aria-selected="true">Phân tích</button>
        <button id="tabBtn3" data-tab="3" class="tab-btn" role="tab" aria-selected="false">Đơn hàng <span id="tabOrderCount" class="tab-badge">0</span></button>
      </div>
      <section id="tabOverview" class="tab-panel" data-tab="1" role="tabpanel"></section>

      <section id="tabAnalytics" class="tab-panel active" data-tab="2" role="tabpanel">
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

      <section id="tabOrders" class="tab-panel" data-tab="3" role="tabpanel" hidden>
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
      makeOrder({ orderId: 'ORD-1', deliveryDate: '2024-05-15T10:00:00.000Z', subTotal: 250000 }),
      makeOrder({ orderId: 'ORD-2', deliveryDate: '2024-05-15T12:00:00.000Z', subTotal: 150000 }),
      makeOrder({ orderId: 'ORD-3', deliveryDate: '2024-06-20T10:00:00.000Z', subTotal: 500000 }),
    ];

    state.allOrdersData = {
      orders,
      totalOrders: orders.length,
      totalSpent: orders.reduce((s, o) => s + o.subTotal, 0),
      totalProducts: orders.length,
      crawlTime: new Date().toISOString(),
      username: 'test_user',
    };
    state.filteredOrders = [...orders];

    initTabs();
    switchTab(2);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up any lingering tooltips appended to body
    const tip = document.querySelector('.heatmap-tooltip');
    if (tip) tip.remove();
  });

  describe('Seam 1: Heatmap Day Cell Click Tooltip Dismissal', () => {
    it('clicking any day cell in the 52-week calendar heatmap immediately dismisses the floating tooltip (display: none)', () => {
      renderHeatmap(container, state.allOrdersData!.orders);

      const svg = container.querySelector('.heatmap-svg') as SVGElement;
      const cell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      expect(cell).not.toBeNull();

      // Trigger hover over active day cell
      const moveEvent = new MouseEvent('mousemove', { bubbles: true, clientX: 150, clientY: 200 });
      Object.defineProperty(moveEvent, 'target', { value: cell });
      svg.dispatchEvent(moveEvent);

      const tip = document.querySelector<HTMLDivElement>('.heatmap-tooltip')!;
      expect(tip).not.toBeNull();
      expect(tip.style.display).toBe('block');
      expect(tip.textContent).toContain('2024-05-15');

      // Click cell
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: cell });
      svg.dispatchEvent(clickEvent);

      // Tooltip must be immediately dismissed
      expect(tip.style.display).toBe('none');
    });

    it('clicking an empty day cell without orders immediately dismisses floating tooltip', () => {
      renderHeatmap(container, state.allOrdersData!.orders);

      const svg = container.querySelector('.heatmap-svg') as SVGElement;
      const emptyCell = container.querySelector('.heatmap-cell[data-date="2024-01-02"]') as SVGElement;
      expect(emptyCell).not.toBeNull();

      // Hover to show tooltip
      const moveEvent = new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 60 });
      Object.defineProperty(moveEvent, 'target', { value: emptyCell });
      svg.dispatchEvent(moveEvent);

      const tip = document.querySelector<HTMLDivElement>('.heatmap-tooltip')!;
      expect(tip.style.display).toBe('block');

      // Click empty cell
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: emptyCell });
      svg.dispatchEvent(clickEvent);

      expect(tip.style.display).toBe('none');
    });

    it('hideHeatmapTooltip synchronously sets display: none on .heatmap-tooltip', () => {
      renderHeatmap(container, state.allOrdersData!.orders);

      const tip = document.querySelector<HTMLDivElement>('.heatmap-tooltip')!;
      tip.style.display = 'block';

      hideHeatmapTooltip();

      expect(tip.style.display).toBe('none');
    });
  });

  describe('Seam 2: Drill-down to Tab 3 with Unencumbered Order History View', () => {
    it('navigating to Tab 3 via heatmap day drill-down lands on unencumbered order history view with visible FilterChips and no floating tooltip artifact', () => {
      renderHeatmap(container, state.allOrdersData!.orders, (preset) => {
        switchTab(3, preset);
      });

      const svg = container.querySelector('.heatmap-svg') as SVGElement;
      const cell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;

      // Simulate mouseover showing tooltip
      const moveEvent = new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 250 });
      Object.defineProperty(moveEvent, 'target', { value: cell });
      svg.dispatchEvent(moveEvent);

      const tip = document.querySelector<HTMLDivElement>('.heatmap-tooltip')!;
      expect(tip.style.display).toBe('block');

      // Drill down by clicking day cell
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: cell });
      svg.dispatchEvent(clickEvent);

      // Verify Tab 3 is active
      expect(state.activeTab).toBe(3);
      expect(state.criteria.time).toEqual({ kind: 'day', year: 2024, month: 5, day: 15 });

      // Tab panel visibility
      const tabOrders = document.getElementById('tabOrders');
      expect(tabOrders?.classList.contains('active')).toBe(true);
      expect(tabOrders?.hidden).toBe(false);

      // FilterChips rendered
      const chipsContainer = document.getElementById('activeFilters');
      expect(chipsContainer).not.toBeNull();

      // Tooltip MUST be hidden, leaving view completely unencumbered
      expect(tip.style.display).toBe('none');
    });
  });

  describe('Seam 3: Synchronous Tooltip Dismissal on Any Dashboard Tab Switch', () => {
    it('switching between any dashboard tabs synchronously closes active heatmap floating tooltip', () => {
      renderHeatmap(container, state.allOrdersData!.orders);

      const tip = document.querySelector<HTMLDivElement>('.heatmap-tooltip')!;
      tip.style.display = 'block';

      // Switch to Tab 1 (Overview)
      switchTab(1);
      expect(tip.style.display).toBe('none');

      // Re-open tooltip and switch to Tab 3 (Orders)
      tip.style.display = 'block';
      switchTab(3);
      expect(tip.style.display).toBe('none');

      // Re-open tooltip and switch to Tab 2 (Analytics)
      tip.style.display = 'block';
      switchTab(2);
      expect(tip.style.display).toBe('none');
    });

    it('dismissAllTooltips dismisses .chartjs-tooltip and any generic tooltip elements', () => {
      const extraTip1 = document.createElement('div');
      extraTip1.className = 'chartjs-tooltip';
      extraTip1.style.display = 'block';
      document.body.appendChild(extraTip1);

      const extraTip2 = document.createElement('div');
      extraTip2.setAttribute('role', 'tooltip');
      extraTip2.style.display = 'block';
      document.body.appendChild(extraTip2);

      const heatmapTip = document.createElement('div');
      heatmapTip.className = 'heatmap-tooltip';
      heatmapTip.style.display = 'block';
      document.body.appendChild(heatmapTip);

      dismissAllTooltips();

      expect(extraTip1.style.display).toBe('none');
      expect(extraTip2.style.display).toBe('none');
      expect(heatmapTip.style.display).toBe('none');

      extraTip1.remove();
      extraTip2.remove();
      heatmapTip.remove();
    });
  });

  describe('Seam 4: Tab 2 Re-entry and Accurate Mouse-Coordinate Tooltip Display', () => {
    it('re-entering Tab 2 and hovering over day cells continues to display tooltips accurately at current mouse coordinates', () => {
      renderHeatmap(container, state.allOrdersData!.orders, (preset) => {
        switchTab(3, preset);
      });

      const svg = container.querySelector('.heatmap-svg') as SVGElement;
      const cell1 = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      const cell2 = container.querySelector('.heatmap-cell[data-date="2024-06-20"]') as SVGElement;
      const tip = document.querySelector<HTMLDivElement>('.heatmap-tooltip')!;

      // 1. Click cell to navigate to Tab 3
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: cell1 });
      svg.dispatchEvent(clickEvent);

      expect(state.activeTab).toBe(3);
      expect(tip.style.display).toBe('none');

      // 2. Re-enter Tab 2
      switchTab(2);
      expect(state.activeTab).toBe(2);
      expect(tip.style.display).toBe('none');

      // 3. Hover over cell2 at coordinates (320, 180)
      const hoverEvent1 = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 320,
        clientY: 180,
      });
      Object.defineProperty(hoverEvent1, 'target', { value: cell2 });
      svg.dispatchEvent(hoverEvent1);

      expect(tip.style.display).toBe('block');
      expect(tip.style.left).toBe(`${320 + 12}px`);
      expect(tip.style.top).toBe(`${180 - 34}px`);
      expect(tip.textContent).toContain('2024-06-20');

      // 4. Hover away (mouseleave)
      svg.dispatchEvent(new MouseEvent('mouseleave'));
      expect(tip.style.display).toBe('none');

      // 5. Hover over cell1 at coordinates (110, 95)
      const hoverEvent2 = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 110,
        clientY: 95,
      });
      Object.defineProperty(hoverEvent2, 'target', { value: cell1 });
      svg.dispatchEvent(hoverEvent2);

      expect(tip.style.display).toBe('block');
      expect(tip.style.left).toBe(`${110 + 12}px`);
      expect(tip.style.top).toBe(`${95 - 34}px`);
      expect(tip.textContent).toContain('2024-05-15');
    });
  });
});
