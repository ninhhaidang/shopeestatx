/** ShopeeStatX/filters.ts — Filter logic, sorting, active filter chips, and search */
import type { FilterCriteria, TimeCriteria, SortDirection } from '../types/index.js';
import { FilterEngine, deriveFilterChips, sortOrders } from './filter-engine.js';
import { syncDateRangePickerToCriteria } from './date-range-picker.js';
export { sortOrders };
import { state } from './state.js';
import { renderData } from './comparison.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';
import { getCategoryBreakdown, renderCategoryChart } from './categories.js';
import { generateStructuredInsights, renderInsights } from './insights.js';
import { renderHeatmap } from './heatmap.js';
import { analyzeShopLoyalty, renderShopLoyalty } from './shop-loyalty.js';
import { predictMonthEnd, renderPrediction } from './predictions.js';
import { getCachedBudgetConfig } from './budget.js';
import { EVENTS } from '../config.js';
import { escapeHtml } from './utils.js';
import { updateTabOrderBadge, switchTab } from './tabs.js';
import { renderOverview } from './overview.js';

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

  const currentCriteriaTime = state.criteria?.time;
  let time: TimeCriteria = { kind: 'all' };

  if (yearVal && monthVal) {
    if (
      currentCriteriaTime?.kind === 'day' &&
      currentCriteriaTime.year === yearVal &&
      currentCriteriaTime.month === monthVal
    ) {
      time = currentCriteriaTime;
    } else {
      time = { kind: 'month', year: yearVal, month: monthVal };
    }
  } else if (monthVal) {
    time = { kind: 'month', year: 0, month: monthVal };
  } else if (yearVal) {
    time = { kind: 'year', year: yearVal };
  } else if (currentCriteriaTime?.kind === 'range') {
    time = currentCriteriaTime;
  } else {
    time = { kind: 'all' };
  }

  state.criteria = {
    time,
    status: statusEl?.value || null,
    category: categoryEl?.value || null,
    searchTerm: searchEl?.value?.trim() || null,
    sort: state.criteria?.sort ?? null,
  };
}

/**
 * Synchronizes state.criteria back into the toolbar DOM input elements.
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
  } else if (criteria.time.kind === 'month') {
    if (yearEl) yearEl.value = criteria.time.year ? String(criteria.time.year) : '';
    if (monthEl) monthEl.value = String(criteria.time.month);
  } else if (criteria.time.kind === 'day') {
    if (yearEl) yearEl.value = String(criteria.time.year);
    if (monthEl) monthEl.value = String(criteria.time.month);
  } else if (criteria.time.kind === 'range') {
    if (yearEl) yearEl.value = '';
    if (monthEl) monthEl.value = '';
  } else {
    if (yearEl) yearEl.value = '';
    if (monthEl) monthEl.value = '';
    document.dispatchEvent(new CustomEvent(EVENTS.DATE_RANGE_CLEARED));
  }

  if (statusEl) statusEl.value = criteria.status || '';
  if (categoryEl) categoryEl.value = criteria.category || '';
  if (searchEl) searchEl.value = criteria.searchTerm || '';

  const drpContainer = document.getElementById('dateRangePickerContainer');
  if (drpContainer) {
    syncDateRangePickerToCriteria(drpContainer);
  }

  // Update filter count badge if element exists
  const filterCountEl = document.querySelector('#btnMoreFilters .filter-count');
  const filterLabel = document.querySelector('#btnMoreFilters .filter-label');
  if (filterCountEl || filterLabel) {
    const statusVal = statusEl?.value || '';
    const catVal = categoryEl?.value || '';
    const count = (statusVal ? 1 : 0) + (catVal ? 1 : 0);
    if (filterCountEl) {
      filterCountEl.textContent = String(count);
      filterCountEl.classList.toggle('hidden', count === 0);
    }
    if (filterLabel) {
      filterLabel.textContent = count > 0 ? `${count} lọc` : 'Lọc';
    }
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

  updateTabOrderBadge(filtered.length);

  updateActiveFilters();

  updateEmptyState(filtered.length, state.criteria);
  if (document.getElementById('kpiStrip') || document.getElementById('financialHealthCard')) {
    renderOverview({
      filteredOrders: filtered,
      allOrders: state.allOrdersData?.orders ?? [],
      budgetConfig: getCachedBudgetConfig(),
      onDrillDown: (preset) => {
        switchTab(3, preset);
      },
    });
  }
  if (document.getElementById('totalOrders')) {
    renderData(filtered);
  }
  if (document.getElementById('monthlyChart')) {
    renderCharts(filtered, handleDrillDown);
  }
  if (document.getElementById('tableBody')) {
    renderCurrentPage();
  }
  // Category chart — filtered orders breakdown
  const catCanvas = document.getElementById('categoryChart') as HTMLCanvasElement | null;
  if (catCanvas) {
    renderCategoryChart(catCanvas, getCategoryBreakdown(filtered), (cat) => {
      switchTab(3, { category: cat });
    });
  }

  // Insights panel — updates on every filter change
  const insightsEl = document.getElementById('insightsContainer');
  if (insightsEl) {
    renderInsights(insightsEl, generateStructuredInsights(filtered, state.allOrdersData!.orders));
  }

  // Heatmap — always uses all orders (past year), re-renders on filter changes
  const heatmapEl = document.getElementById('heatmapContainer');
  if (heatmapEl) {
    renderHeatmap(heatmapEl, state.allOrdersData!.orders, (preset) => {
      switchTab(3, preset);
    });
  }
  // Shop loyalty — always uses all orders
  const loyaltyEl = document.getElementById('loyaltyContainer');
  if (loyaltyEl) {
    renderShopLoyalty(loyaltyEl, analyzeShopLoyalty(state.allOrdersData!.orders), (shop) => {
      switchTab(3, { searchTerm: shop });
    });
  }
  // Month-end spending prediction
  const predEl = document.getElementById('predictionInfo');
  if (predEl) {
    renderPrediction(predEl, predictMonthEnd(filtered), getCachedBudgetConfig());
  }

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
 * Contextualizes and updates the empty state display based on active criteria
 * and filtered order results count.
 */
export function updateEmptyState(filteredCount: number, criteria: FilterCriteria = state.criteria): void {
  const emptyState = document.getElementById('emptyState');
  const ordersTable = document.getElementById('ordersTable');
  const paginationContainer = document.getElementById('paginationContainer');

  if (!emptyState) return;

  if (filteredCount === 0) {
    emptyState.classList.remove('hidden');
    if (ordersTable) ordersTable.classList.add('hidden');
    if (paginationContainer) paginationContainer.classList.add('hidden');

    const emptyTitle = emptyState.querySelector('.empty-title');
    const emptyMessage = emptyState.querySelector('.empty-message');
    const btnReset = emptyState.querySelector('#btnResetFilters');

    const chips = deriveFilterChips(criteria);

    if (chips.length > 0) {
      if (emptyTitle) emptyTitle.textContent = 'Không tìm thấy đơn hàng nào phù hợp';
      if (emptyMessage) {
        const labels = chips.map(c => c.label).join(', ');
        emptyMessage.textContent = `Không có đơn hàng nào khớp với các tiêu chí đang chọn (${labels}). Bấm đặt lại bộ lọc để xem toàn bộ đơn hàng.`;
      }
    } else {
      if (emptyTitle) emptyTitle.textContent = 'Không tìm thấy đơn hàng nào';
      if (emptyMessage) {
        emptyMessage.textContent = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm';
      }
    }

    if (btnReset) {
      btnReset.textContent = 'Đặt lại bộ lọc';
    }
  } else {
    emptyState.classList.add('hidden');
    if (ordersTable) ordersTable.classList.remove('hidden');
    if (paginationContainer) paginationContainer.classList.remove('hidden');
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
    : null;

  const direction: SortDirection = currentDirection === 'asc' ? 'desc' : 'asc';

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

/**
 * Handles visual drill-down interactions from charts and heatmap.
 * Updates state.criteria, synchronizes toolbar UI and active chips,
 * and re-evaluates filtered orders synchronously.
 */
export function handleDrillDown(criteriaUpdate: Partial<FilterCriteria>): void {
  state.criteria = {
    ...state.criteria,
    ...criteriaUpdate,
  };
  state.currentPage = 1;
  syncCriteriaToToolbar(state.criteria);
  applyFilters({ syncFromDOM: false });
  document.getElementById('ordersTable')?.scrollIntoView({ behavior: 'smooth' });
}
