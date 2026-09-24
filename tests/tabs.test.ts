/** ShopeeStatX/tests/tabs.test.ts — Unit and integration tests for tabbed shell navigation */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { state } from '../src/dashboard/state.js';
import {
  switchTab,
  initTabs,
  updateTabOrderBadge,
} from '../src/dashboard/tabs.js';
import { applyFilters } from '../src/dashboard/filters.js';
import type { FilterCriteria } from '../src/types/index.js';
describe('Tab Orchestration Module (src/dashboard/tabs.ts)', () => {
  beforeEach(() => {
    // Construct DOM representing the tabbed shell
    document.body.innerHTML = `
      <header class="header">
        <div id="dateRangePickerContainer"></div>
        <button id="btnRefresh"></button>
      </header>
      <nav class="tabs-nav" role="tablist">
        <button class="tab-item active" id="tabBtn1" data-tab="1" role="tab" aria-selected="true" aria-controls="tabOverview">
          <span>1. Tổng quan</span>
        </button>
        <button class="tab-item" id="tabBtn2" data-tab="2" role="tab" aria-selected="false" aria-controls="tabAnalytics">
          <span>2. Phân tích &amp; Thói quen</span>
        </button>
        <button class="tab-item" id="tabBtn3" data-tab="3" role="tab" aria-selected="false" aria-controls="tabOrders">
          <span>3. Lịch sử đơn hàng</span>
          <span class="tab-badge" id="tabOrderCount">0</span>
        </button>
      </nav>
      <section id="tabOverview" class="tab-panel active" data-tab="1">
        <div class="summary"></div>
        <canvas id="monthlyChart"></canvas>
      </section>
      <section id="tabAnalytics" class="tab-panel" data-tab="2">
        <div id="heatmapContainer"></div>
        <canvas id="shopChart"></canvas>
        <canvas id="categoryChart"></canvas>
      </section>
      <section id="tabOrders" class="tab-panel" data-tab="3">
        <input id="searchBox" value="" />
        <select id="filterStatus"><option value=""></option><option value="3">Completed</option></select>
        <select id="filterCategory"><option value=""></option></select>
        <div id="ordersTable"></div>
      </section>
    `;

    // Reset state
    state.activeTab = 1;
    state.criteria = {
      time: { kind: 'year', year: 2026 },
      status: null,
      category: null,
      searchTerm: null,
      sort: { field: null, direction: 'asc' },
    };
    state.allOrdersData = {
      orders: [
        {
          orderId: '1',
          name: 'Áo thun',
          productCount: 1,
          subTotal: 100000,
          subTotalFormatted: '100.000 ₫',
          status: 'Hoàn thành',
          statusCode: 3,
          shopName: 'Shop A',
          productSummary: 'Áo thun',
          deliveryDate: '2026-09-20T00:00:00.000Z',
          orderMonth: 9,
          orderYear: 2026,
        },
      ],
      totalCount: 1,
      totalAmount: 100000,
      totalAmountFormatted: '100.000 ₫',
      fetchedAt: '2026-09-24T10:00:00.000Z',
    };
    state.filteredOrders = [...state.allOrdersData.orders];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Seam 1: Tab Visibility and Navigation State', () => {
    it('switchTab updates state.activeTab and toggles active classes on buttons and panels', () => {
      expect(state.activeTab).toBe(1);

      switchTab(2);

      expect(state.activeTab).toBe(2);
      // Buttons
      expect(document.getElementById('tabBtn1')?.classList.contains('active')).toBe(false);
      expect(document.getElementById('tabBtn1')?.getAttribute('aria-selected')).toBe('false');

      expect(document.getElementById('tabBtn2')?.classList.contains('active')).toBe(true);
      expect(document.getElementById('tabBtn2')?.getAttribute('aria-selected')).toBe('true');

      expect(document.getElementById('tabBtn3')?.classList.contains('active')).toBe(false);
      expect(document.getElementById('tabBtn3')?.getAttribute('aria-selected')).toBe('false');

      // Panels
      expect(document.getElementById('tabOverview')?.classList.contains('active')).toBe(false);
      expect(document.getElementById('tabAnalytics')?.classList.contains('active')).toBe(true);
      expect(document.getElementById('tabOrders')?.classList.contains('active')).toBe(false);
    });

    it('switchTab(3) switches to Order History tab', () => {
      switchTab(3);

      expect(state.activeTab).toBe(3);
      expect(document.getElementById('tabBtn3')?.classList.contains('active')).toBe(true);
      expect(document.getElementById('tabOrders')?.classList.contains('active')).toBe(true);
      expect(document.getElementById('tabOverview')?.classList.contains('active')).toBe(false);
      expect(document.getElementById('tabAnalytics')?.classList.contains('active')).toBe(false);
    });

    it('supports alternate tabPanel1 / tabPanel2 / tabPanel3 ID naming', () => {
      // Setup alternate IDs as used in prototype.html
      document.getElementById('tabOverview')!.id = 'tabPanel1';
      document.getElementById('tabAnalytics')!.id = 'tabPanel2';
      document.getElementById('tabOrders')!.id = 'tabPanel3';

      switchTab(2);

      expect(document.getElementById('tabPanel1')?.classList.contains('active')).toBe(false);
      expect(document.getElementById('tabPanel2')?.classList.contains('active')).toBe(true);
      expect(document.getElementById('tabPanel3')?.classList.contains('active')).toBe(false);
    });
  });

  describe('Seam 2: Invariant: Tab Switching Preserves Active Temporal Criteria', () => {
    it('switching between tabs does not reset or alter state.criteria.time', () => {
      // Set active temporal criteria (e.g. range or month)
      const rangeTime: FilterCriteria['time'] = {
        kind: 'range',
        start: new Date(2026, 8, 1),
        end: new Date(2026, 8, 20),
      };
      state.criteria.time = rangeTime;

      switchTab(2);
      expect(state.criteria.time).toEqual(rangeTime);

      switchTab(3);
      expect(state.criteria.time).toEqual(rangeTime);

      switchTab(1);
      expect(state.criteria.time).toEqual(rangeTime);
    });
  });

  describe('Seam 3: Tab Switching with Filter Preset', () => {
    it('switchTab(3, filterPreset) merges preset into state.criteria and applies filters', () => {
      switchTab(3, { status: '3' });

      expect(state.activeTab).toBe(3);
      expect(state.criteria.status).toBe('3');
      // Preserved existing time filter
      expect(state.criteria.time).toEqual({ kind: 'year', year: 2026 });
    });
  });

  describe('Seam 4: Tab Badge Count Updating', () => {
    it('updateTabOrderBadge updates #tabOrderCount element with count', () => {
      const badge = document.getElementById('tabOrderCount');
      expect(badge?.textContent).toBe('0');

      updateTabOrderBadge(42);
      expect(badge?.textContent).toBe('42');
    });

    it('updateTabOrderBadge defaults to filteredOrders length if not specified', () => {
      const badge = document.getElementById('tabOrderCount');
      state.filteredOrders = [
        state.allOrdersData!.orders[0],
        state.allOrdersData!.orders[0],
      ];

      updateTabOrderBadge();
      expect(badge?.textContent).toBe('2');
    });
  });

  describe('Seam 5: initTabs Event Binding', () => {
    it('initTabs binds click listeners to tab buttons and switches tabs on click', () => {
      initTabs();

      const btnTab2 = document.getElementById('tabBtn2');
      btnTab2?.click();

      expect(state.activeTab).toBe(2);
      expect(document.getElementById('tabAnalytics')?.classList.contains('active')).toBe(true);

      const btnTab3 = document.getElementById('tabBtn3');
      btnTab3?.click();

      expect(state.activeTab).toBe(3);
      expect(document.getElementById('tabOrders')?.classList.contains('active')).toBe(true);
    });
  });
  describe('Seam 6: Global Header & Tab Mounting Layout Verification (results.html)', () => {
    it('verifies results.html header contains dateRangePickerContainer and btnRefresh', () => {
      const html = fs.readFileSync(path.resolve(__dirname, '../src/dashboard/results.html'), 'utf-8');
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Header global controls
      const header = doc.querySelector('.header');
      expect(header).not.toBeNull();
      expect(header?.querySelector('#dateRangePickerContainer')).not.toBeNull();
      expect(header?.querySelector('#btnRefresh')).not.toBeNull();

      // Tab navigation
      const tabsNav = doc.querySelector('.tabs-nav');
      expect(tabsNav).not.toBeNull();
      const tabButtons = tabsNav?.querySelectorAll('.tab-item');
      expect(tabButtons?.length).toBe(3);
      expect(tabsNav?.querySelector('#tabOrderCount')).not.toBeNull();

      // Tab 1 (Overview)
      const tab1 = doc.querySelector('#tabOverview');
      expect(tab1).not.toBeNull();
      expect(tab1?.querySelector('#kpiStrip')).not.toBeNull();
      expect(tab1?.querySelector('.tab1-hero')).not.toBeNull();
      expect(tab1?.querySelector('#financialHealthCard')).not.toBeNull();
      expect(tab1?.querySelector('#monthlyChart')).not.toBeNull();

      // Tab 2 (Analytics)
      const tab2 = doc.querySelector('#tabAnalytics');
      expect(tab2).not.toBeNull();
      expect(tab2?.querySelector('#heatmapContainer')).not.toBeNull();
      expect(tab2?.querySelector('#shopChart')).not.toBeNull();
      expect(tab2?.querySelector('#categoryChart')).not.toBeNull();
      expect(tab2?.querySelector('#insightsContainer')).not.toBeNull();

      // Tab 3 (Orders)
      const tab3 = doc.querySelector('#tabOrders');
      expect(tab3).not.toBeNull();
      expect(tab3?.querySelector('#searchBox')).not.toBeNull();
      expect(tab3?.querySelector('#filterStatus')).not.toBeNull();
      expect(tab3?.querySelector('#filterCategory')).not.toBeNull();
      expect(tab3?.querySelector('#ordersTable')).not.toBeNull();
    });
  });

  describe('Seam 7: Cross-Tab Reactivity & Temporal Synchronization', () => {
    it('switching temporal filter updates filteredOrders and tab badge while preserving activeTab', () => {

      // Start on Tab 2
      switchTab(2);
      expect(state.activeTab).toBe(2);

      // Filter by a time criteria that matches our 2026-09-20 order
      state.criteria = {
        ...state.criteria,
        time: { kind: 'month', year: 2026, month: 9 },
      };
      applyFilters({ syncFromDOM: false });

      // Active tab is still 2
      expect(state.activeTab).toBe(2);
      expect(state.filteredOrders.length).toBe(1);
      expect(document.getElementById('tabOrderCount')?.textContent).toBe('1');

      // Switch temporal filter to year 2024 (no matches)
      state.criteria = {
        ...state.criteria,
        time: { kind: 'year', year: 2024 },
      };
      applyFilters({ syncFromDOM: false });

      expect(state.activeTab).toBe(2);
      expect(state.filteredOrders.length).toBe(0);
      expect(document.getElementById('tabOrderCount')?.textContent).toBe('0');

      // Transitioning to Tab 3 still preserves 2024 time criteria and empty count
      switchTab(3);
      expect(state.activeTab).toBe(3);
      expect(state.criteria.time).toEqual({ kind: 'year', year: 2024 });
      expect(document.getElementById('tabOrderCount')?.textContent).toBe('0');
    });
  });
});
