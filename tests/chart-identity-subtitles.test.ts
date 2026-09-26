import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import type { Order, TimeCriteria } from '../src/types/index.js';
import { state } from '../src/dashboard/state.js';
import { renderCharts, formatSpendingSubtitle } from '../src/dashboard/charts.js';
import { setCachedBudgetConfig } from '../src/dashboard/budget.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '1001',
    name: 'Test Product',
    productCount: 1,
    subTotal: 250000,
    subTotalFormatted: '250.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Shop A',
    productSummary: 'Test Product x1',
    deliveryDate: '2024-05-15T10:00:00.000Z',
    orderMonth: 5,
    orderYear: 2024,
    ...overrides,
  };
}

describe('Ticket #19: Scoped Chart Header Identity & Accurate Temporal Subtitles', () => {
  const multiYearOrders: Order[] = [
    makeOrder({ orderId: '1', orderYear: 2022, orderMonth: 3, subTotal: 100000 }),
    makeOrder({ orderId: '2', orderYear: 2023, orderMonth: 7, subTotal: 200000 }),
    makeOrder({ orderId: '3', orderYear: 2024, orderMonth: 5, subTotal: 300000 }),
  ];

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="tabOverview" class="tab-panel active" data-tab="1">
        <div class="chart-container-card">
          <div class="card-title-row">
            <div>
              <h3 class="card-heading" id="monthlyChartTitle" data-i18n="chart.spendingByMonth">Chi tiêu theo tháng</h3>
              <small class="chart-subtitle" id="monthlyChartSub"></small>
            </div>
          </div>
          <canvas id="monthlyChart"></canvas>
        </div>
      </section>

      <section id="tabAnalytics" class="tab-panel" data-tab="2">
        <div class="analytics-comparison-grid">
          <div class="chart-box category-breakdown-card">
            <div class="chart-header">
              <div>
                <h3 id="categoryChartTitle" data-i18n="chart.categories">Danh mục chi tiêu</h3>
                <span class="chart-subtitle">Phân bổ chi tiêu theo ngành hàng sản phẩm</span>
              </div>
            </div>
            <canvas id="categoryChart"></canvas>
            <div id="categoryLegend"></div>
          </div>
        </div>
      </section>
    `;

    state.activeTab = 1;
    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: null,
    };
    state.allOrdersData = {
      orders: [...multiYearOrders],
      totalCount: multiYearOrders.length,
      totalAmount: 600000,
      totalAmountFormatted: '600.000 ₫',
      fetchedAt: '2026-09-26T00:00:00.000Z',
    };

    setCachedBudgetConfig({
      monthlyLimit: 0,
      enabled: false,
      alertThreshold: 0.8,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Seam 1: results.html Contract & Structure Verification', () => {
    it('results.html Category Breakdown card displays heading "Danh mục chi tiêu" and subtitle "Phân bổ chi tiêu theo ngành hàng sản phẩm"', () => {
      const html = fs.readFileSync(path.resolve(__dirname, '../src/dashboard/results.html'), 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const catCard = doc.querySelector('.category-breakdown-card');
      expect(catCard).not.toBeNull();

      const heading = catCard?.querySelector('h3');
      expect(heading).not.toBeNull();
      expect(heading?.getAttribute('data-i18n')).toBe('chart.categories');
      expect(heading?.textContent?.trim()).toBe('Danh mục chi tiêu');

      const subtitle = catCard?.querySelector('.chart-subtitle');
      expect(subtitle).not.toBeNull();
      expect(subtitle?.textContent?.trim()).toBe('Phân bổ chi tiêu theo ngành hàng sản phẩm');
    });

    it('results.html Monthly Spending card heading has unique identifier monthlyChartTitle', () => {
      const html = fs.readFileSync(path.resolve(__dirname, '../src/dashboard/results.html'), 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const titleEl = doc.getElementById('monthlyChartTitle');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.tagName.toLowerCase()).toBe('h3');
      expect(titleEl?.getAttribute('data-i18n')).toBe('chart.spendingByMonth');
    });
  });

  describe('Seam 2: Heading Scoping & Preservation During renderCharts', () => {
    it('rendering spending chart does not overwrite Tab 2 Category Breakdown heading', () => {
      const catHeading = document.getElementById('categoryChartTitle');
      expect(catHeading?.textContent).toBe('Danh mục chi tiêu');

      // Initial render on Tab 1
      renderCharts(multiYearOrders);

      // Must remain "Danh mục chi tiêu", NOT clobbered with "Chi tiêu theo tháng"
      expect(catHeading?.textContent).toBe('Danh mục chi tiêu');

      const catSub = document.querySelector('.category-breakdown-card .chart-subtitle');
      expect(catSub?.textContent).toBe('Phân bổ chi tiêu theo ngành hàng sản phẩm');
    });

    it('re-rendering spending chart on filter changes does not mutate headings on Tab 2', () => {
      const catHeading = document.getElementById('categoryChartTitle');

      // Multiple successive renders with different time scopes
      state.criteria = { ...state.criteria, time: { kind: 'year', year: 2023 } };
      renderCharts(multiYearOrders);
      expect(catHeading?.textContent).toBe('Danh mục chi tiêu');

      state.criteria = { ...state.criteria, time: { kind: 'month', year: 2024, month: 5 } };
      renderCharts(multiYearOrders);
      expect(catHeading?.textContent).toBe('Danh mục chi tiêu');

      state.criteria = { ...state.criteria, time: { kind: 'all' } };
      renderCharts(multiYearOrders);
      expect(catHeading?.textContent).toBe('Danh mục chi tiêu');
    });

    it('updates Tab 1 monthlyChartTitle textContent without touching .chart-box h3', () => {
      const monthlyTitle = document.getElementById('monthlyChartTitle');
      expect(monthlyTitle).not.toBeNull();

      renderCharts(multiYearOrders);

      expect(monthlyTitle?.textContent).toBe('Chi tiêu theo tháng');
    });
  });

  describe('Seam 3: Dynamic Temporal Spending Subtitle (formatSpendingSubtitle & monthlyChartSub)', () => {
    it('displays "Toàn bộ lịch sử" when viewing all orders (all-time duration)', () => {
      state.criteria = { ...state.criteria, time: { kind: 'all' } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toBe('Toàn bộ lịch sử');
      expect(sub?.textContent).not.toBe('Biến động chi tiêu 12 tháng qua');
    });
    it('displays "Toàn bộ lịch sử" even if #filterYear has a residual value when time criteria is all', () => {
      const select = document.createElement('select');
      select.id = 'filterYear';
      select.innerHTML = '<option value="2023" selected>2023</option>';
      document.body.appendChild(select);

      state.criteria = { ...state.criteria, time: { kind: 'all' } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toBe('Toàn bộ lịch sử');
      select.remove();
    });

    it('accurately reflects calendar year boundary when filtered by year', () => {
      state.criteria = { ...state.criteria, time: { kind: 'year', year: 2023 } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toBe('Năm 2023');
    });

    it('accurately reflects month/year boundary when filtered by month', () => {
      state.criteria = { ...state.criteria, time: { kind: 'month', year: 2024, month: 5 } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toBe('Tháng 5/2024');
    });

    it('accurately reflects day boundary when filtered by day', () => {
      state.criteria = { ...state.criteria, time: { kind: 'day', year: 2024, month: 5, day: 15 } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toBe('Ngày 15/5/2024');
    });

    it('accurately reflects custom date range boundaries when filtered by range', () => {
      const start = new Date(2023, 0, 1);
      const end = new Date(2023, 5, 30);
      state.criteria = { ...state.criteria, time: { kind: 'range', start, end } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toContain('1/1/2023');
      expect(sub?.textContent).toContain('30/6/2023');
    });
  });

  describe('Seam 4: Budget Guideline Subtitle Integration', () => {
    it('clearly indicates configured budget limit value when budget guideline is active', () => {
      setCachedBudgetConfig({
        monthlyLimit: 7_500_000,
        enabled: true,
        alertThreshold: 0.8,
      });

      state.criteria = { ...state.criteria, time: { kind: 'all' } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toContain('Hạn mức ngân sách');
      expect(sub?.textContent).toContain('7.500.000');
      expect(sub?.textContent).toContain('Toàn bộ lịch sử');
    });

    it('includes both filtered temporal boundary and budget limit when filtered with active budget', () => {
      setCachedBudgetConfig({
        monthlyLimit: 10_000_000,
        enabled: true,
        alertThreshold: 0.8,
      });

      state.criteria = { ...state.criteria, time: { kind: 'year', year: 2024 } };
      renderCharts(multiYearOrders);

      const sub = document.getElementById('monthlyChartSub');
      expect(sub?.textContent).toContain('Năm 2024');
      expect(sub?.textContent).toContain('Hạn mức ngân sách');
      expect(sub?.textContent).toContain('10.000.000');
    });
  });
});
