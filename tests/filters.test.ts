import { describe, it, expect, beforeEach } from 'vitest';
import {
  sortOrders,
  filterOrders,
  syncToolbarToCriteria,
  syncCriteriaToToolbar,
  updateActiveFilters,
  clearAllFilters,
  removeFilter,
} from '../src/dashboard/filters.js';
import { state } from '../src/dashboard/state.js';
import type { Order, FilterCriteria } from '../src/types/index.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '123',
    name: 'Test Product',
    productCount: 1,
    subTotal: 100000,
    subTotalFormatted: '100.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'test - Test Shop',
    productSummary: 'Test Product (SL: 1)',
    deliveryDate: '2025-01-15T00:00:00.000Z',
    orderMonth: 1,
    orderYear: 2025,
    ...overrides,
  };
}

describe('sortOrders', () => {
  const orders: Order[] = [
    makeOrder({ subTotal: 300000, deliveryDate: '2025-03-01T00:00:00.000Z', statusCode: 3 }),
    makeOrder({ subTotal: 100000, deliveryDate: '2025-01-01T00:00:00.000Z', statusCode: 7 }),
    makeOrder({ subTotal: 200000, deliveryDate: '2025-02-01T00:00:00.000Z', statusCode: 4 }),
  ];

  it('sorts by subTotal ascending', () => {
    const sorted = sortOrders(orders, 'subTotal', 'asc');
    expect(sorted[0].subTotal).toBe(100000);
    expect(sorted[1].subTotal).toBe(200000);
    expect(sorted[2].subTotal).toBe(300000);
  });

  it('sorts by subTotal descending', () => {
    const sorted = sortOrders(orders, 'subTotal', 'desc');
    expect(sorted[0].subTotal).toBe(300000);
    expect(sorted[2].subTotal).toBe(100000);
  });

  it('sorts by deliveryDate ascending', () => {
    const sorted = sortOrders(orders, 'deliveryDate', 'asc');
    expect(sorted[0].deliveryDate).toContain('2025-01');
    expect(sorted[2].deliveryDate).toContain('2025-03');
  });

  it('sorts by deliveryDate descending', () => {
    const sorted = sortOrders(orders, 'deliveryDate', 'desc');
    expect(sorted[0].deliveryDate).toContain('2025-03');
    expect(sorted[2].deliveryDate).toContain('2025-01');
  });

  it('sorts by status (statusCode) ascending', () => {
    const sorted = sortOrders(orders, 'status', 'asc');
    expect(sorted[0].statusCode).toBe(3);
    expect(sorted[2].statusCode).toBe(7);
  });

  it('handles null deliveryDate in sort', () => {
    const withNull = [
      makeOrder({ deliveryDate: null }),
      makeOrder({ deliveryDate: '2025-06-01T00:00:00.000Z' }),
    ];
    const sorted = sortOrders(withNull, 'deliveryDate', 'asc');
    expect(sorted[0].deliveryDate).toBeNull();
    expect(sorted[1].deliveryDate).toContain('2025-06');
  });

  it('returns original order for unknown field', () => {
    const sorted = sortOrders(orders, 'unknown', 'asc');
    expect(sorted).toHaveLength(3);
  });

  it('does not mutate original array', () => {
    const original = [...orders];
    sortOrders(orders, 'subTotal', 'asc');
    expect(orders[0].subTotal).toBe(original[0].subTotal);
  });
});

describe('Unified Filter Toolbar & Derived Active Chips Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="filterYear">
        <option value=""></option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>
      <select id="filterMonth">
        <option value=""></option>
        <option value="1">1</option>
        <option value="5">5</option>
        <option value="11">11</option>
      </select>
      <select id="filterStatus">
        <option value="">Tất cả trạng thái</option>
        <option value="3">Hoàn thành</option>
        <option value="4">Đã hủy</option>
      </select>
      <select id="filterCategory">
        <option value="">Tất cả danh mục</option>
        <option value="Điện tử">Điện tử</option>
        <option value="Thời trang">Thời trang</option>
      </select>
      <input id="searchBox" value="" />
      <div id="activeFiltersContainer" class="hidden">
        <div id="activeFilters"></div>
      </div>
      <div id="emptyState" class="hidden"></div>
      <div id="ordersTable"></div>
      <div id="paginationContainer"></div>
    `;

    // Reset state
    state.selectedDay = null;
    state.dateRange = { start: null, end: null };
    state.currentSort = { field: null, direction: 'asc' };
    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: null,
    };
    state.allOrdersData = {
      count: 0,
      totalSpent: 0,
      orders: [],
    };
  });

  it('filterOrders evaluates against FilterEngine correctly', () => {
    const sampleOrders: Order[] = [
      makeOrder({ orderId: '1', deliveryDate: '2024-05-15T00:00:00.000Z', orderYear: 2024, orderMonth: 5, statusCode: 3, name: 'Áo polo' }),
      makeOrder({ orderId: '2', deliveryDate: '2024-06-15T00:00:00.000Z', orderYear: 2024, orderMonth: 6, statusCode: 4, name: 'Tai nghe' }),
      makeOrder({ orderId: '3', deliveryDate: '2025-01-15T00:00:00.000Z', orderYear: 2025, orderMonth: 1, statusCode: 3, name: 'Áo khoác' }),
    ];

    const result = filterOrders(sampleOrders, {
      year: '2024',
      month: '5',
      status: '3',
      searchTerm: 'polo',
    });

    expect(result).toHaveLength(1);
    expect(result[0].orderId).toBe('1');
  });

  it('syncToolbarToCriteria reads DOM inputs into state.criteria', () => {
    (document.getElementById('filterYear') as HTMLSelectElement).value = '2024';
    (document.getElementById('filterMonth') as HTMLSelectElement).value = '5';
    (document.getElementById('filterStatus') as HTMLSelectElement).value = '3';
    (document.getElementById('filterCategory') as HTMLSelectElement).value = 'Thời trang';
    (document.getElementById('searchBox') as HTMLInputElement).value = ' polo ';

    syncToolbarToCriteria();

    expect(state.criteria.time).toEqual({ kind: 'month', year: 2024, month: 5 });
    expect(state.criteria.status).toBe('3');
    expect(state.criteria.category).toBe('Thời trang');
    expect(state.criteria.searchTerm).toBe('polo');
  });

  it('syncToolbarToCriteria supports standalone month selection without year', () => {
    (document.getElementById('filterYear') as HTMLSelectElement).value = '';
    (document.getElementById('filterMonth') as HTMLSelectElement).value = '5';

    syncToolbarToCriteria();

    expect(state.criteria.time).toEqual({ kind: 'month', year: 0, month: 5 });
  });

  it('syncCriteriaToToolbar updates DOM inputs from state.criteria', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'month', year: 2025, month: 1 },
      status: '4',
      category: 'Điện tử',
      searchTerm: 'chuột không dây',
    };

    syncCriteriaToToolbar(criteria);

    expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('2025');
    expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('1');
    expect((document.getElementById('filterStatus') as HTMLSelectElement).value).toBe('4');
    expect((document.getElementById('filterCategory') as HTMLSelectElement).value).toBe('Điện tử');
    expect((document.getElementById('searchBox') as HTMLInputElement).value).toBe('chuột không dây');
  });

  it('renders active filter chips and handles individual chip removal without ghost date reactivation', () => {
    state.criteria = {
      time: { kind: 'month', year: 2024, month: 5 },
      status: '3',
      category: 'Thời trang',
      searchTerm: 'áo',
    };

    updateActiveFilters();

    const container = document.getElementById('activeFiltersContainer')!;
    const chipsEl = document.getElementById('activeFilters')!;

    expect(container.classList.contains('hidden')).toBe(false);
    const chipElements = chipsEl.querySelectorAll('.filter-chip');
    expect(chipElements.length).toBe(5); // year, month, status, category, search

    // Find status remove button and click it
    const statusRemoveBtn = chipsEl.querySelector('.chip-remove[data-filter-type="status"]') as HTMLElement;
    expect(statusRemoveBtn).not.toBeNull();
    statusRemoveBtn.click();

    // Status is cleared, others remain intact
    expect(state.criteria.status).toBeNull();
    expect(state.criteria.time).toEqual({ kind: 'month', year: 2024, month: 5 });
    expect((document.getElementById('filterStatus') as HTMLSelectElement).value).toBe('');

    // Now remove month chip — should fall back to year 2024, not resurrect prior ranges
    const monthRemoveBtn = chipsEl.querySelector('.chip-remove[data-filter-type="month"]') as HTMLElement;
    expect(monthRemoveBtn).not.toBeNull();
    monthRemoveBtn.click();

    expect(state.criteria.time).toEqual({ kind: 'year', year: 2024 });
    expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('2024');
  });

  it('clearAllFilters resets all active criteria and synchronizes toolbar', () => {
    state.criteria = {
      time: { kind: 'month', year: 2024, month: 5 },
      status: '3',
      category: 'Thời trang',
      searchTerm: 'polo',
    };
    syncCriteriaToToolbar(state.criteria);

    clearAllFilters();

    expect(state.criteria.time).toEqual({ kind: 'all' });
    expect(state.criteria.status).toBeNull();
    expect(state.criteria.category).toBeNull();
    expect(state.criteria.searchTerm).toBeNull();

    expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('filterStatus') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('filterCategory') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('searchBox') as HTMLInputElement).value).toBe('');

    const container = document.getElementById('activeFiltersContainer')!;
    expect(container.classList.contains('hidden')).toBe(true);
  });

  it('removeFilter cleans up specific filter types cleanly', () => {
    state.criteria = {
      time: { kind: 'year', year: 2024 },
      status: '3',
      category: null,
      searchTerm: null,
    };
    syncCriteriaToToolbar(state.criteria);

    removeFilter('year');

    expect(state.criteria.time).toEqual({ kind: 'all' });
    expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('');
    expect(state.criteria.status).toBe('3');
    expect((document.getElementById('filterStatus') as HTMLSelectElement).value).toBe('3');
  });

  it('removeFilter cleanly clears dateRange constraint without leaving ghost state', () => {
    state.criteria = {
      time: { kind: 'range', start: new Date(2024, 0, 1), end: new Date(2024, 0, 15) },
      status: null,
      category: null,
      searchTerm: null,
    };
    syncCriteriaToToolbar(state.criteria);

    removeFilter('dateRange');

    expect(state.criteria.time).toEqual({ kind: 'all' });
    expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('');
    expect(state.dateRange).toEqual({ start: null, end: null });
  });
});
