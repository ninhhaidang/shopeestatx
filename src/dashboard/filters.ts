/** ShopeeStatX/filters.ts — Filter logic, sorting, active filter chips, and search */
import type { Order, FilterCriteria, TimeCriteria, SortDirection } from '../types/index.js';
import { FilterEngine, deriveFilterChips, sortOrders } from './filter-engine.js';
import { syncDateRangePickerToCriteria } from './date-range-picker.js';
export { sortOrders };
import { state } from './state.js';
import { renderData } from './comparison.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';
import { getCategoryBreakdown, renderCategoryChart } from './categories.js';
import { generateInsights, renderInsights } from './insights.js';
import { renderHeatmap } from './heatmap.js';
import { analyzeShopLoyalty, renderShopLoyalty } from './shop-loyalty.js';
import { EVENTS } from '../config.js';
import { escapeHtml } from './utils.js';

/** Filter orders by year/month/status/search (excludes selectedDay). Reused by charts. */
export function filterOrders(
  orders: Order[],
  opts: { year: string; month: string; status: string; searchTerm: string },
): Order[] {
  let time: TimeCriteria = { kind: 'all' };
  const { start, end } = state.dateRange;
  const useDateRange = !opts.year && !opts.month && (start !== null || end !== null);
  if (useDateRange && start && end) {
    time = { kind: 'range', start, end };
  } else if (opts.year && opts.month) {
    time = { kind: 'month', year: Number(opts.year), month: Number(opts.month) };
  } else if (opts.year) {
    time = { kind: 'year', year: Number(opts.year) };
  }

  return FilterEngine.evaluate(orders, {
    time,
    status: opts.status || null,
    searchTerm: opts.searchTerm || null,
  });
}

/**
 * Reads current toolbar DOM elements and synchronizes their values into state.criteria.
 */
export function syncToolbarToCriteria(): void {
  const yearEl = document.getElementById('filterYear') as HTMLSelectElement | null;
  const monthEl = document.getElementById('filterMonth') as HTMLSelectElement | null;
  const statusEl = document.getElementById('filterStatus') as HTMLSelectElement | null;
  const searchEl = document.getElementById('searchBox') as HTMLInputElement | null;
  const categoryEl = document.getElementById('filterCategory') as HTMLSelectElement | null;

  const yearVal = yearEl?.value ? parseInt(yearEl.value, 10) : null;
  const monthVal = monthEl?.value ? parseInt(monthEl.value, 10) : null;

  let time: TimeCriteria = state.criteria?.time ?? { kind: 'all' };

  if (state.selectedDay !== null && monthVal && yearVal) {
    time = { kind: 'day', year: yearVal, month: monthVal, day: state.selectedDay };
  } else if (monthVal && yearVal) {
    time = { kind: 'month', year: yearVal, month: monthVal };
  } else if (monthVal) {
    time = { kind: 'month', year: 0, month: monthVal };
  } else if (yearVal) {
    time = { kind: 'year', year: yearVal };
  } else if (state.dateRange.start || state.dateRange.end) {
    if (state.dateRange.start && state.dateRange.end) {
      time = { kind: 'range', start: state.dateRange.start, end: state.dateRange.end };
    }
  } else if (time.kind !== 'range' && time.kind !== 'day') {
    time = { kind: 'all' };
  }

  state.criteria = {
    time,
    status: statusEl?.value || null,
    category: categoryEl?.value || null,
    searchTerm: searchEl?.value?.trim() || null,
    sort: state.currentSort.field
      ? { field: state.currentSort.field, direction: state.currentSort.direction }
      : null,
  };
}

/**
 * Synchronizes state.criteria back into the toolbar DOM input elements and legacy state fields.
 */
export function syncCriteriaToToolbar(criteria: FilterCriteria): void {
  const yearEl = document.getElementById('filterYear') as HTMLSelectElement | null;
  const monthEl = document.getElementById('filterMonth') as HTMLSelectElement | null;
  const statusEl = document.getElementById('filterStatus') as HTMLSelectElement | null;
  const searchEl = document.getElementById('searchBox') as HTMLInputElement | null;
  const categoryEl = document.getElementById('filterCategory') as HTMLSelectElement | null;

  if (criteria.time.kind === 'year') {
    if (yearEl) yearEl.value = String(criteria.time.year);
    if (monthEl) monthEl.value = '';
    state.selectedDay = null;
    state.dateRange = { start: null, end: null };
  } else if (criteria.time.kind === 'month') {
    if (yearEl) yearEl.value = criteria.time.year ? String(criteria.time.year) : '';
    if (monthEl) monthEl.value = String(criteria.time.month);
    state.selectedDay = null;
    state.dateRange = { start: null, end: null };
  } else if (criteria.time.kind === 'day') {
    if (yearEl) yearEl.value = String(criteria.time.year);
    if (monthEl) monthEl.value = String(criteria.time.month);
    state.selectedDay = criteria.time.day;
    state.dateRange = { start: null, end: null };
  } else if (criteria.time.kind === 'range') {
    if (yearEl) yearEl.value = '';
    if (monthEl) monthEl.value = '';
    state.selectedDay = null;
    state.dateRange = { start: criteria.time.start, end: criteria.time.end };
  } else {
    if (yearEl) yearEl.value = '';
    if (monthEl) monthEl.value = '';
    state.selectedDay = null;
    state.dateRange = { start: null, end: null };
    document.dispatchEvent(new CustomEvent(EVENTS.DATE_RANGE_CLEARED));
  }

  if (statusEl) statusEl.value = criteria.status || '';
  if (categoryEl) categoryEl.value = criteria.category || '';
  if (searchEl) searchEl.value = criteria.searchTerm || '';

  if (criteria.sort && criteria.sort.field) {
    state.currentSort = { field: criteria.sort.field, direction: criteria.sort.direction };
  }

  const drpContainer = document.getElementById('dateRangePickerContainer');
  if (drpContainer) {
    syncDateRangePickerToCriteria(drpContainer);
  }
}
/**
 * Evaluates state.criteria against order data using FilterEngine and updates all UI views.
 * @param options Optional configuration controlling DOM synchronization
 */
export function applyFilters(options?: { syncFromDOM?: boolean }): void {
  if (!state.allOrdersData) return;

  if (options?.syncFromDOM !== false) {
    syncToolbarToCriteria();
  }

  const filtered = FilterEngine.evaluate(state.allOrdersData.orders, state.criteria);

  state.filteredOrders = filtered;
  state.currentPage = 1;

  updateActiveFilters();

  const emptyState = document.getElementById('emptyState');
  const ordersTable = document.getElementById('ordersTable');
  const paginationContainer = document.getElementById('paginationContainer');

  if (emptyState && ordersTable && paginationContainer) {
    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      ordersTable.classList.add('hidden');
      paginationContainer.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      ordersTable.classList.remove('hidden');
      paginationContainer.classList.remove('hidden');
    }
  }
  if (document.getElementById('totalOrders')) {
    renderData(filtered);
  }
  if (document.getElementById('monthlyChart')) {
    renderCharts(filtered);
  }
  if (document.getElementById('tableBody')) {
    renderCurrentPage();
  }
  // Category chart — filtered orders breakdown
  const catCanvas = document.getElementById('categoryChart') as HTMLCanvasElement | null;
  if (catCanvas) renderCategoryChart(catCanvas, getCategoryBreakdown(filtered));

  // Insights panel — updates on every filter change
  const insightsEl = document.getElementById('insightsContainer');
  if (insightsEl) renderInsights(insightsEl, generateInsights(filtered, state.allOrdersData!.orders));

  // Heatmap — always uses all orders (past year), re-renders on filter changes
  const heatmapEl = document.getElementById('heatmapContainer');
  if (heatmapEl) renderHeatmap(heatmapEl, state.allOrdersData!.orders);

  // Shop loyalty — always uses all orders
  const loyaltyEl = document.getElementById('loyaltyContainer');
  if (loyaltyEl) renderShopLoyalty(loyaltyEl, analyzeShopLoyalty(state.allOrdersData!.orders));

  // Notify UI components to update (e.g., filter count badge)
  document.dispatchEvent(new CustomEvent(EVENTS.APPLY_FILTERS));
}
/**
 * Renders active filter chips derived purely from state.criteria and binds removal handlers.
 */
export function updateActiveFilters(): void {
  const activeFiltersContainer = document.getElementById('activeFiltersContainer');
  const activeFiltersDiv = document.getElementById('activeFilters');
  if (!activeFiltersContainer || !activeFiltersDiv) return;

  const chips = deriveFilterChips(state.criteria);

  if (chips.length > 0) {
    activeFiltersContainer.classList.remove('hidden');
    activeFiltersDiv.innerHTML = chips
      .map(
        (chip, index) =>
          `<span class="filter-chip" data-type="${escapeHtml(chip.type)}" data-index="${index}">
            ${escapeHtml(chip.label)}
            <span class="chip-remove" data-index="${index}" data-filter-type="${escapeHtml(chip.type)}">&times;</span>
          </span>`
      )
      .join('');

    activeFiltersDiv.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLElement, e: Event) {
        e.stopPropagation();
        const indexStr = this.getAttribute('data-index');
        if (indexStr !== null) {
          const index = parseInt(indexStr, 10);
          const chip = chips[index];
          if (chip) {
            state.criteria = chip.remove(state.criteria);
            state.currentPage = 1;
            syncCriteriaToToolbar(state.criteria);
            applyFilters({ syncFromDOM: false });
            return;
          }
        }
        const type = this.getAttribute('data-filter-type')!;
        removeFilter(type);
      });
    });
  } else {
    activeFiltersContainer.classList.add('hidden');
    activeFiltersDiv.innerHTML = '';
  }
}

/**
 * Resets all active filter criteria, clears toolbar inputs, and re-evaluates all historical orders.
 */
export function clearAllFilters(): void {
  state.criteria = {
    time: { kind: 'all' },
    status: null,
    category: null,
    searchTerm: null,
    sort: state.criteria?.sort ?? { field: null, direction: 'asc' },
  };
  state.currentPage = 1;
  syncCriteriaToToolbar(state.criteria);
  applyFilters({ syncFromDOM: false });
}

/**
 * Removes an active filter by chip type and updates the view.
 */
export function removeFilter(type: string): void {
  const chips = deriveFilterChips(state.criteria);
  const matchingChip = chips.find(c => c.type === type);
  if (matchingChip) {
    state.criteria = matchingChip.remove(state.criteria);
    state.currentPage = 1;
    syncCriteriaToToolbar(state.criteria);
    applyFilters({ syncFromDOM: false });
  }
}

/**
 * Updates sort field and direction in criteria and state, updating table headers and view.
 */
export function handleSort(field: string): void {
  const currentDirection = state.criteria?.sort?.field === field
    ? state.criteria.sort.direction
    : (state.currentSort.field === field ? state.currentSort.direction : null);

  const direction: SortDirection = currentDirection === 'asc' ? 'desc' : 'asc';

  state.currentSort = { field, direction };
  state.criteria = {
    ...state.criteria,
    sort: { field, direction },
  };

  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
  });

  const activeHeader = document.querySelector(`th[data-sort="${field}"]`);
  if (activeHeader) {
    activeHeader.classList.add(direction);
  }

  applyFilters();
}
