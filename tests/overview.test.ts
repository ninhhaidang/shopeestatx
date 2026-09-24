/** ShopeeStatX/tests/overview.test.ts — Unit and integration tests for Tab 1 Executive KPI Strip and Split-View Hero */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Order, FilterCriteria } from '../src/types/index.js';
import type { BudgetConfig } from '../src/dashboard/budget.js';
import {
  computeOverviewMetrics,
  renderKPIStrip,
  renderFinancialHealthCard,
  renderOverview,
  openBudgetModal,
} from '../src/dashboard/overview.js';
import { renderCharts } from '../src/dashboard/charts.js';
import { setCachedBudgetConfig } from '../src/dashboard/budget.js';
import { state } from '../src/dashboard/state.js';
import { switchTab } from '../src/dashboard/tabs.js';
import { applyFilters } from '../src/dashboard/filters.js';

describe('Tab 1 Financial Overview Module (src/dashboard/overview.ts)', () => {
  const fixedNow = new Date(2026, 8, 24, 12, 0, 0); // Sep 24, 2026 (month index 8 = September)
  const defaultBudget: BudgetConfig = {
    monthlyLimit: 5_000_000,
    enabled: true,
    alertThreshold: 0.8,
  };

  const sampleOrders: Order[] = [
    {
      orderId: 'ORD-1',
      name: 'Áo thun phong cách',
      productSummary: 'Áo thun phong cách',
      productCount: 2,
      subTotal: 500_000,
      paymentMethod: 'ShopeePay',
      deliveryDate: '2026-09-10T10:00:00.000Z',
      orderDate: '2026-09-08T09:00:00.000Z',
      shopName: 'Shop A',
      status: 'Đã giao',
      statusCode: 3,
      orderMonth: 9,
      orderYear: 2026,
    },
    {
      orderId: 'ORD-2',
      name: 'Tai nghe Bluetooth',
      productSummary: 'Tai nghe Bluetooth',
      productCount: 1,
      subTotal: 1_500_000,
      paymentMethod: 'COD',
      deliveryDate: '2026-09-20T10:00:00.000Z',
      orderDate: '2026-09-18T09:00:00.000Z',
      shopName: 'Shop B',
      status: 'Đã giao',
      statusCode: 3,
      orderMonth: 9,
      orderYear: 2026,
    },
    {
      orderId: 'ORD-3',
      name: 'Cáp sạc Type-C (Đã huỷ)',
      productSummary: 'Cáp sạc Type-C',
      productCount: 1,
      subTotal: 100_000,
      paymentMethod: 'ShopeePay',
      deliveryDate: '2026-09-15T10:00:00.000Z',
      orderDate: '2026-09-14T09:00:00.000Z',
      shopName: 'Shop C',
      status: 'Đã huỷ',
      statusCode: 4, // Cancelled order: must not be counted in total spend
      orderMonth: 9,
      orderYear: 2026,
    },
    {
      orderId: 'ORD-4',
      name: 'Bàn phím cơ',
      productSummary: 'Bàn phím cơ',
      productCount: 1,
      subTotal: 2_000_000,
      paymentMethod: 'ShopeePay',
      deliveryDate: '2026-08-15T10:00:00.000Z',
      orderDate: '2026-08-14T09:00:00.000Z',
      shopName: 'Shop D',
      status: 'Đã giao',
      statusCode: 3,
      orderMonth: 8,
      orderYear: 2026,
    },
    {
      orderId: 'ORD-5',
      name: 'Nồi chiên không dầu',
      productSummary: 'Nồi chiên không dầu',
      productCount: 1,
      subTotal: 3_000_000,
      paymentMethod: 'ShopeePay',
      deliveryDate: '2025-09-15T10:00:00.000Z',
      orderDate: '2025-09-14T09:00:00.000Z',
      shopName: 'Shop E',
      status: 'Đã giao',
      statusCode: 3,
      orderMonth: 9,
      orderYear: 2025,
    },
  ];

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="tabOverview" class="tab-panel active" data-tab="1">
        <div id="kpiStrip" class="kpi-strip"></div>
        <div class="tab1-hero">
          <div class="chart-container-card">
            <canvas id="monthlyChart"></canvas>
          </div>
          <div id="financialHealthCard" class="health-card"></div>
        </div>
      </section>
      <section id="tabOrders" class="tab-panel" data-tab="3">
        <div id="ordersTable"></div>
        <tbody id="tableBody"></tbody>
      </section>
      <dialog id="budgetDialog">
        <input type="number" id="budgetLimit" />
        <input type="range" id="budgetThreshold" />
        <span id="budgetThresholdValue"></span>
        <input type="checkbox" id="budgetEnabled" />
        <button id="btnBudgetSave"></button>
        <button id="btnBudgetClose"></button>
      </dialog>
    `;

    state.activeTab = 1;
    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: { field: null, direction: 'asc' },
    };
    state.allOrdersData = {
      orders: [...sampleOrders],
      totalCount: sampleOrders.length,
      totalAmount: 7_100_000,
      totalAmountFormatted: '7.100.000 ₫',
      fetchedAt: '2026-09-24T10:00:00.000Z',
    };
    state.filteredOrders = [...sampleOrders];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Seam 1: KPI Metric Calculations (computeOverviewMetrics)', () => {
    it('correctly calculates total spend ignoring cancelled and returned orders', () => {
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);

      // ORD-1 (500k) + ORD-2 (1.5M) + ORD-4 (2M) + ORD-5 (3M) = 7M (ORD-3 cancelled is excluded)
      expect(metrics.totalSpend).toBe(7_000_000);
      expect(metrics.totalOrders).toBe(5);
      expect(metrics.completedOrdersCount).toBe(4);
    });

    it('calculates current month spend, burn rate, and budget pacing', () => {
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);

      // Current month is Sep 2026: ORD-1 (500k) + ORD-2 (1.5M) = 2.000.000
      expect(metrics.thisMonthSpend).toBe(2_000_000);

      // Budget is 5M -> 2M is 40%
      expect(metrics.budgetPct).toBe(40);
      expect(metrics.budgetRemaining).toBe(3_000_000);

      // Burn rate on day 24: 2M / 24 ≈ 83333 VND/day
      expect(metrics.burnRate).toBe(Math.round(2_000_000 / 24));

      // Month has 30 days (September). Forecast: burnRate * 30 ≈ 2.5M
      expect(metrics.monthEndForecast).toBe(Math.round(metrics.burnRate * 30));
      expect(metrics.daysRemaining).toBe(6); // 30 - 24
    });

    it('calculates average order value and comparative deltas', () => {
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);

      // 4 completed orders with sum 7M -> average 1.750.000
      expect(metrics.avgOrderValue).toBe(1_750_000);

      // Sep 2026 (2M) vs Aug 2026 (2M) -> 0% change
      expect(metrics.monthChange).toBe(0);

      // 2026 completed (500k + 1.5M + 2M = 4M) vs 2025 completed (3M) -> +33.3%
      expect(metrics.yearChange).toBeCloseTo(33.3, 1);
    });

    it('handles empty orders without division by zero', () => {
      const metrics = computeOverviewMetrics([], [], defaultBudget, fixedNow);

      expect(metrics.totalSpend).toBe(0);
      expect(metrics.thisMonthSpend).toBe(0);
      expect(metrics.totalOrders).toBe(0);
      expect(metrics.completedOrdersCount).toBe(0);
      expect(metrics.avgOrderValue).toBe(0);
      expect(metrics.burnRate).toBe(0);
      expect(metrics.monthEndForecast).toBe(0);
      expect(metrics.budgetPct).toBe(0);
      expect(metrics.monthChange).toBeNull();
      expect(metrics.yearChange).toBeNull();
    });
  });

  describe('Seam 2: Executive KPI Strip Rendering & Card Structure', () => {
    it('renders 4 distinct KPI cards with labels, values, and comparative delta badges', () => {
      const container = document.getElementById('kpiStrip')!;
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);
      const drillDownMock = vi.fn();

      renderKPIStrip(container, metrics, defaultBudget, drillDownMock);

      const cards = container.querySelectorAll('.kpi-card');
      expect(cards.length).toBe(4);

      // Card 1: Total Spend
      const cardTotal = document.getElementById('kpiTotalSpend');
      expect(cardTotal).not.toBeNull();
      expect(cardTotal?.textContent).toContain('7.000.000');
      expect(cardTotal?.textContent).toContain('Tổng chi tiêu');

      // Card 2: This Month Spend
      const cardMonth = document.getElementById('kpiThisMonth');
      expect(cardMonth).not.toBeNull();
      expect(cardMonth?.textContent).toContain('2.000.000');
      expect(cardMonth?.textContent).toContain('40%'); // budget % badge

      // Card 3: Total Orders
      const cardOrders = document.getElementById('kpiTotalOrders');
      expect(cardOrders).not.toBeNull();
      expect(cardOrders?.textContent).toContain('5');
      expect(cardOrders?.textContent).toContain('đơn');

      // Card 4: Average Order Value
      const cardAvg = document.getElementById('kpiAvgOrder');
      expect(cardAvg).not.toBeNull();
      expect(cardAvg?.textContent).toContain('1.750.000');
    });

    it('shows comparative month-over-month delta badge when budget is disabled', () => {
      const container = document.getElementById('kpiStrip')!;
      const disabledBudget: BudgetConfig = { monthlyLimit: 0, enabled: false, alertThreshold: 0.8 };
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, disabledBudget, fixedNow);

      renderKPIStrip(container, metrics, disabledBudget, vi.fn());

      const cardMonth = document.getElementById('kpiThisMonth');
      expect(cardMonth?.textContent).toContain('so với tháng trước');
    });
  });

  describe('Seam 3: KPI Card Click Drill-Down & Navigation', () => {
    it('clicking KPI Total Spend card switches to Tab 3 with all-time filter', () => {
      const container = document.getElementById('kpiStrip')!;
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);
      const drillDownMock = vi.fn();

      renderKPIStrip(container, metrics, defaultBudget, drillDownMock);

      const cardTotal = document.getElementById('kpiTotalSpend')!;
      cardTotal.click();

      expect(drillDownMock).toHaveBeenCalledWith({ time: { kind: 'all' } });
    });

    it('clicking KPI This Month Spend card switches to Tab 3 with thisMonth filter', () => {
      const container = document.getElementById('kpiStrip')!;
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);
      const drillDownMock = vi.fn();

      renderKPIStrip(container, metrics, defaultBudget, drillDownMock);

      const cardMonth = document.getElementById('kpiThisMonth')!;
      cardMonth.click();

      expect(drillDownMock).toHaveBeenCalledWith({
        time: { kind: 'month', year: 2026, month: 9 },
      });
    });

    it('clicking KPI Total Orders card switches to Tab 3', () => {
      const container = document.getElementById('kpiStrip')!;
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);
      const drillDownMock = vi.fn();

      renderKPIStrip(container, metrics, defaultBudget, drillDownMock);

      const cardOrders = document.getElementById('kpiTotalOrders')!;
      cardOrders.click();

      expect(drillDownMock).toHaveBeenCalledWith({ time: { kind: 'all' } });
    });
  });

  describe('Seam 4: Financial Health Card Rendering & Budget Ring', () => {
    it('renders animated circular SVG budget ring with offset when budget is enabled', () => {
      const container = document.getElementById('financialHealthCard')!;
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, defaultBudget, fixedNow);
      const openModalMock = vi.fn();

      renderFinancialHealthCard(container, metrics, defaultBudget, openModalMock);

      const ringCircle = container.querySelector('#budgetRingCircle') as SVGCircleElement | null;
      expect(ringCircle).not.toBeNull();

      // Circumference is 226. 40% spent -> dashoffset = 226 - (226 * 0.40) ≈ 135.6
      const offset = parseFloat(ringCircle?.style.strokeDashoffset || '0');
      expect(offset).toBeCloseTo(135.6, 0);

      const percentText = container.querySelector('#ringPercentText');
      expect(percentText?.textContent).toBe('40%');

      // Burn rate and forecast text
      const statList = container.querySelector('.stat-list');
      expect(statList?.textContent).toContain('Tốc độ chi tiêu:');
      expect(statList?.textContent).toContain('Dự báo cuối tháng:');
      expect(statList?.textContent).toContain('Số ngày còn lại:');

      // Edit budget button triggers callback
      const editBtn = container.querySelector('#btnEditBudget') as HTMLButtonElement | null;
      expect(editBtn).not.toBeNull();
      editBtn?.click();
      expect(openModalMock).toHaveBeenCalledTimes(1);
    });

    it('renders proactive setup callout when budget is disabled', () => {
      const container = document.getElementById('financialHealthCard')!;
      const disabledBudget: BudgetConfig = { monthlyLimit: 5_000_000, enabled: false, alertThreshold: 0.8 };
      const metrics = computeOverviewMetrics(sampleOrders, sampleOrders, disabledBudget, fixedNow);
      const openModalMock = vi.fn();

      renderFinancialHealthCard(container, metrics, disabledBudget, openModalMock);

      // Gauge should not be present
      expect(container.querySelector('#budgetRingCircle')).toBeNull();

      // Proactive setup callout should be present
      const callout = container.querySelector('.budget-setup-callout');
      expect(callout).not.toBeNull();
      expect(callout?.textContent).toContain('Chưa thiết lập ngân sách');

      // Setup button triggers modal callback
      const setupBtn = container.querySelector('#btnSetupBudget') as HTMLButtonElement | null;
      expect(setupBtn).not.toBeNull();
      setupBtn?.click();
      expect(openModalMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Seam 5: Orchestration via renderOverview and switchTab Integration', () => {
    it('renderOverview orchestrates both KPI strip and Financial Health Card and wires click to switchTab', () => {
      const switchTabSpy = vi.fn();

      renderOverview({
        filteredOrders: sampleOrders,
        allOrders: sampleOrders,
        budgetConfig: defaultBudget,
        now: fixedNow,
        onDrillDown: (preset) => {
          switchTabSpy(3, preset);
        },
      });

      expect(document.querySelectorAll('.kpi-card').length).toBe(4);
      expect(document.getElementById('financialHealthCard')?.querySelector('.budget-ring-svg')).not.toBeNull();

      // Click card to verify integration
      const thisMonthCard = document.getElementById('kpiThisMonth')!;
      thisMonthCard.click();

      expect(switchTabSpy).toHaveBeenCalledWith(3, {
        time: { kind: 'month', year: 2026, month: 9 },
      });
    });
  });

  describe('Seam 6: Budget Modal State and Lifecycle (openBudgetModal)', () => {
    it('populates dialog inputs with current budget configuration and opens dialog', () => {
      const dialog = document.getElementById('budgetDialog') as HTMLDialogElement;
      const showModalSpy = vi.fn();
      dialog.showModal = showModalSpy;

      openBudgetModal({
        monthlyLimit: 7_500_000,
        enabled: true,
        alertThreshold: 0.85,
      });

      const limitInput = document.getElementById('budgetLimit') as HTMLInputElement;
      const thresholdInput = document.getElementById('budgetThreshold') as HTMLInputElement;
      const thresholdVal = document.getElementById('budgetThresholdValue');
      const enabledInput = document.getElementById('budgetEnabled') as HTMLInputElement;

      expect(limitInput.value).toBe('7500000');
      expect(thresholdInput.value).toBe('85');
      expect(thresholdVal?.textContent).toBe('85%');
      expect(enabledInput.checked).toBe(true);
      expect(showModalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Seam 7: Monthly Spending Chart Budget Guideline & Subtitle', () => {
    it('updates chart subtitle with monthly budget limit when budget is enabled', () => {
      const subtitle = document.createElement('small');
      subtitle.id = 'monthlyChartSub';
      document.body.appendChild(subtitle);

      setCachedBudgetConfig({
        monthlyLimit: 5_000_000,
        enabled: true,
        alertThreshold: 0.8,
      });

      renderCharts(sampleOrders);

      expect(subtitle.textContent).toContain('Hạn mức ngân sách');
      expect(subtitle.textContent).toContain('5.000.000');
    });

    it('resets chart subtitle when budget is disabled', () => {
      const subtitle = document.getElementById('monthlyChartSub') || document.createElement('small');
      subtitle.id = 'monthlyChartSub';
      document.body.appendChild(subtitle);

      setCachedBudgetConfig({
        monthlyLimit: 5_000_000,
        enabled: false,
        alertThreshold: 0.8,
      });

      renderCharts(sampleOrders);

      expect(subtitle.textContent).toBe('Biến động chi tiêu 12 tháng qua');
    });
  });

  describe('Seam 8: End-to-End KPI Click Drill-Down Updating Criteria and Transitioning to Tab 3', () => {
    it('clicking KPI This Month card updates state.criteria to month and transitions activeTab to 3', () => {
      setCachedBudgetConfig(defaultBudget);

      // Render Tab 1 overview with default drill-down wiring
      renderOverview({
        filteredOrders: sampleOrders,
        allOrders: sampleOrders,
        budgetConfig: defaultBudget,
        now: fixedNow,
      });

      expect(state.activeTab).toBe(1);

      // Click This Month card
      const thisMonthCard = document.getElementById('kpiThisMonth')!;
      thisMonthCard.click();

      // Invariant: activeTab is transitioned to 3
      expect(state.activeTab).toBe(3);

      // Invariant: criteria.time is updated to month 9, year 2026
      expect(state.criteria.time).toEqual({
        kind: 'month',
        year: 2026,
        month: 9,
      });

      // Invariant: filteredOrders contains only orders for Sep 2026
      expect(state.filteredOrders.length).toBe(3); // ORD-1, ORD-2, ORD-3
    });
  });
});
