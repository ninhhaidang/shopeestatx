/** ShopeeStatX/tests/state-cleanup.test.ts — Verification of State Cleanup & Legacy Code Deletion (Issue #6) */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { state } from '../src/dashboard/state.js';
import {
  handleSort,
  syncToolbarToCriteria,
  syncCriteriaToToolbar,
  applyFilters,
} from '../src/dashboard/filters.js';
import { getDateRangeSummary } from '../src/dashboard/date-range-picker.js';
import { renderTimeComparison } from '../src/dashboard/comparison.js';
import { predictMonthEnd } from '../src/dashboard/predictions.js';
import { renderCurrentPage } from '../src/dashboard/table.js';
import type { Order } from '../src/types/index.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'ORD001',
    name: 'Áo thun nam',
    productCount: 1,
    subTotal: 150000,
    subTotalFormatted: '150.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Shop Thời Trang',
    productSummary: 'Áo thun nam (SL: 1)',
    deliveryDate: '2024-05-15T10:00:00.000Z',
    orderMonth: 5,
    orderYear: 2024,
    ...overrides,
  };
}

describe('Issue #6: State Cleanup and Legacy Code Deletion', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="filterYear">
        <option value="">Tất cả năm</option>
        <option value="2024">2024</option>
      </select>
      <select id="filterMonth">
        <option value="">Tất cả tháng</option>
        <option value="5">Tháng 5</option>
      </select>
      <select id="filterStatus">
        <option value="">Tất cả trạng thái</option>
        <option value="3">Hoàn thành</option>
      </select>
      <select id="filterCategory">
        <option value="">Tất cả danh mục</option>
        <option value="Thời trang">Thời trang</option>
      </select>
      <input id="searchBox" value="" />
      <div id="activeFiltersContainer" class="hidden">
        <div id="activeFilters"></div>
      </div>
      <div id="emptyState" class="hidden"></div>
      <div id="ordersTable">
        <table>
          <thead>
            <tr>
              <th data-sort="subTotal" class="sortable">Tổng tiền</th>
              <th data-sort="deliveryDate" class="sortable">Ngày</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
      <div id="paginationContainer"></div>
      <div id="pageStart"></div>
      <div id="pageEnd"></div>
      <div id="pageTotal"></div>
      <button id="btnFirstPage"></button>
      <button id="btnPrevPage"></button>
      <button id="btnNextPage"></button>
      <button id="btnLastPage"></button>
      <div id="totalOrders"></div>
      <div id="totalProducts"></div>
      <div id="totalAmount"></div>
      <div id="currentMonthAmount"></div>
      <div id="currentYearAmount"></div>
      <div id="avgOrderValue"></div>
      <div id="monthComparison"></div>
      <div id="yearComparison"></div>
      <div id="avgComparison"></div>
      <div id="predictionInfo" class="prediction-info"></div>
      <div id="pageNumbers"></div>
    `;

    state.currentPage = 1;
    state.itemsPerPage = 20;
    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: { field: null, direction: 'asc' },
    };
    state.allOrdersData = {
      orders: [
        makeOrder({ orderId: '1', subTotal: 200000, deliveryDate: '2024-05-15T00:00:00.000Z' }),
        makeOrder({ orderId: '2', subTotal: 100000, deliveryDate: '2024-05-20T00:00:00.000Z' }),
      ],
      totalCount: 2,
      totalAmount: 300000,
      totalAmountFormatted: '300.000 ₫',
      fetchedAt: new Date().toISOString(),
    };
  });

  describe('Seam 1: Obsolete state properties deletion', () => {
    it('state object does not contain selectedDay, dateRange, or currentSort', () => {
      expect('selectedDay' in state).toBe(false);
      expect('dateRange' in state).toBe(false);
      expect('currentSort' in state).toBe(false);
    });
  });

  describe('Seam 2: Table sorting via state.criteria.sort', () => {
    it('handleSort updates state.criteria.sort directly and updates table header classes', () => {
      handleSort('subTotal');
      expect(state.criteria.sort).toEqual({ field: 'subTotal', direction: 'asc' });

      const header = document.querySelector('th[data-sort="subTotal"]');
      expect(header?.classList.contains('asc')).toBe(true);

      // Toggling sort direction
      handleSort('subTotal');
      expect(state.criteria.sort).toEqual({ field: 'subTotal', direction: 'desc' });
      expect(header?.classList.contains('desc')).toBe(true);
    });
  });

  describe('Seam 3: Date range summary derived purely from criteria.time', () => {
    it('getDateRangeSummary formats range from criteria.time without depending on state.dateRange', () => {
      state.criteria = {
        ...state.criteria,
        time: {
          kind: 'range',
          start: new Date(2024, 4, 1),
          end: new Date(2024, 4, 31),
        },
      };

      const summary = getDateRangeSummary();
      expect(summary).toContain('1/5/2024');
      expect(summary).toContain('31/5/2024');
    });

    it('getDateRangeSummary returns empty string when criteria.time is not range', () => {
      state.criteria = { ...state.criteria, time: { kind: 'all' } };
      expect(getDateRangeSummary()).toBe('');
    });
  });

  describe('Seam 4: Toolbar synchronization operates purely through criteria.time', () => {
    it('syncToolbarToCriteria retains day criteria when year and month selects match', () => {
      state.criteria = {
        ...state.criteria,
        time: { kind: 'day', year: 2024, month: 5, day: 15 },
      };
      (document.getElementById('filterYear') as HTMLSelectElement).value = '2024';
      (document.getElementById('filterMonth') as HTMLSelectElement).value = '5';

      syncToolbarToCriteria();

      expect(state.criteria.time).toEqual({ kind: 'day', year: 2024, month: 5, day: 15 });
    });

    it('syncToolbarToCriteria transitions from day to month when month select changes', () => {
      state.criteria = {
        ...state.criteria,
        time: { kind: 'day', year: 2024, month: 5, day: 15 },
      };
      (document.getElementById('filterYear') as HTMLSelectElement).value = '2024';
      (document.getElementById('filterMonth') as HTMLSelectElement).value = '';

      syncToolbarToCriteria();

      expect(state.criteria.time).toEqual({ kind: 'year', year: 2024 });
    });

    it('syncToolbarToCriteria retains range criteria when year and month selects are empty', () => {
      const start = new Date(2024, 4, 1);
      const end = new Date(2024, 4, 15);
      state.criteria = {
        ...state.criteria,
        time: { kind: 'range', start, end },
      };
      (document.getElementById('filterYear') as HTMLSelectElement).value = '';
      (document.getElementById('filterMonth') as HTMLSelectElement).value = '';

      syncToolbarToCriteria();

      expect(state.criteria.time).toEqual({ kind: 'range', start, end });
    });

    it('syncCriteriaToToolbar updates inputs without setting obsolete state fields', () => {
      syncCriteriaToToolbar({
        time: { kind: 'day', year: 2024, month: 5, day: 15 },
        status: '3',
        category: 'Thời trang',
        searchTerm: 'áo',
        sort: { field: 'subTotal', direction: 'desc' },
      });

      expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('2024');
      expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('5');
      expect((document.getElementById('filterStatus') as HTMLSelectElement).value).toBe('3');
      expect((document.getElementById('filterCategory') as HTMLSelectElement).value).toBe('Thời trang');
      expect((document.getElementById('searchBox') as HTMLInputElement).value).toBe('áo');
      expect((state as Record<string, unknown>).selectedDay).toBeUndefined();
      expect((state as Record<string, unknown>).dateRange).toBeUndefined();
      expect((state as Record<string, unknown>).currentSort).toBeUndefined();
    });
  });

  describe('Seam 5: Table detail row date click triggers handleDrillDown', () => {
    it('clicking on date in detail row updates state.criteria.time to day without mutating obsolete state fields', () => {
      state.filteredOrders = state.allOrdersData!.orders;
      renderCurrentPage();

      const dateClickable = document.querySelector('.detail-value-clickable[data-filter="date"]') as HTMLElement;
      expect(dateClickable).not.toBeNull();

      dateClickable.click();

      expect(state.criteria.time).toEqual({
        kind: 'day',
        year: 2024,
        month: 5,
        day: 15,
      });
      expect(state.filteredOrders).toHaveLength(1);
      expect(state.filteredOrders[0].orderId).toBe('1');
    });
  });

  describe('Seam 6: Predictions synchronization in applyFilters', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-05-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    it('applyFilters synchronously renders month-end predictions into #predictionInfo', () => {
      applyFilters();

      const totalOrdersEl = document.getElementById('totalOrders');
      expect(totalOrdersEl?.textContent).toBe('2');

      const predictionEl = document.getElementById('predictionInfo');
      expect(predictionEl?.innerHTML).toContain('Dự kiến cuối tháng:');
    });
  });
});
