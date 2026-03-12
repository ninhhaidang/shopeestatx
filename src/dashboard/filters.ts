// Filter logic, sorting, active filter chips, and search
import type { Order, SortDirection } from '../types/index.js';
import { state } from './state.js';
import { t } from '../i18n/index.js';
import { formatDate } from '../i18n/format.js';
import { renderData } from './comparison.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';
import { categorizeOrder, getCategoryBreakdown, renderCategoryChart } from './categories.js';
import { generateInsights, renderInsights } from './insights.js';
import { renderHeatmap } from './heatmap.js';
import { analyzeShopLoyalty, renderShopLoyalty } from './shop-loyalty.js';
import { EVENTS } from '../config.js';
import { escapeHtml } from './utils.js';

export function sortOrders(orders: Order[], field: string, direction: SortDirection): Order[] {
  return [...orders].sort((a, b) => {
    let aVal: number;
    let bVal: number;

    switch (field) {
      case 'deliveryDate':
        aVal = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        bVal = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
        break;
      case 'subTotal':
        aVal = a.subTotal || 0;
        bVal = b.subTotal || 0;
        break;
      case 'status':
        aVal = a.statusCode || 0;
        bVal = b.statusCode || 0;
        break;
      default:
        return 0;
    }

    return direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });
}

/** Filter orders by year/month/status/search (excludes selectedDay). Reused by charts. */
export function filterOrders(
  orders: Order[],
  opts: { year: string; month: string; status: string; searchTerm: string },
): Order[] {
  const { start, end } = state.dateRange;
  const useDateRange = !opts.year && !opts.month && (start !== null || end !== null);

  return orders.filter(order => {
    // Date range filter (only when year/month selects are not active)
    if (useDateRange) {
      if (!order.deliveryDate) return false;
      const d = new Date(order.deliveryDate);
      if (start && d < start) return false;
      if (end && d > end) return false;
    } else {
      if (opts.year && (!order.orderYear || order.orderYear !== Number(opts.year))) return false;
      if (opts.month && (!order.orderMonth || order.orderMonth !== Number(opts.month))) return false;
    }

    if (opts.status && order.statusCode !== Number(opts.status)) return false;

    if (opts.searchTerm) {
      const searchableText = [
        order.orderId?.toString(),
        order.name,
        order.shopName,
        order.productSummary,
        order.status,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchableText.includes(opts.searchTerm)) return false;
    }

    return true;
  });
}

export function applyFilters(): void {
  if (!state.allOrdersData) return;

  const year = (document.getElementById('filterYear') as HTMLSelectElement).value;
  const month = (document.getElementById('filterMonth') as HTMLSelectElement).value;
  const status = (document.getElementById('filterStatus') as HTMLSelectElement).value;
  const searchTerm = (document.getElementById('searchBox') as HTMLInputElement).value.toLowerCase().trim();
  const category = (document.getElementById('filterCategory') as HTMLSelectElement)?.value ?? '';

  let filtered = filterOrders(state.allOrdersData.orders, { year, month, status, searchTerm });

  // Apply category filter (runs categorizeOrder on each order)
  if (category) {
    filtered = filtered.filter(o => categorizeOrder(o) === category);
  }

  // Apply selectedDay filter (only in applyFilters, not in chart view)
  if (state.selectedDay !== null && month) {
    filtered = filtered.filter(order => {
      if (!order.deliveryDate) return false;
      return new Date(order.deliveryDate).getDate() === state.selectedDay;
    });
  }

  if (state.currentSort.field) {
    filtered = sortOrders(filtered, state.currentSort.field, state.currentSort.direction);
  }

  state.filteredOrders = filtered;
  state.currentPage = 1;

  updateActiveFilters();

  const emptyState = document.getElementById('emptyState')!;
  const ordersTable = document.getElementById('ordersTable')!;
  const paginationContainer = document.getElementById('paginationContainer')!;

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    ordersTable.classList.add('hidden');
    paginationContainer.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    ordersTable.classList.remove('hidden');
    paginationContainer.classList.remove('hidden');
  }

  renderData(filtered);
  renderCharts(filtered);
  renderCurrentPage();

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
}

export function updateActiveFilters(): void {
  const year = (document.getElementById('filterYear') as HTMLSelectElement).value;
  const month = (document.getElementById('filterMonth') as HTMLSelectElement).value;
  const filterStatus = document.getElementById('filterStatus') as HTMLSelectElement;
  const status = filterStatus.value;
  const searchTerm = (document.getElementById('searchBox') as HTMLInputElement).value.trim();

  const activeFiltersContainer = document.getElementById('activeFiltersContainer')!;
  const activeFiltersDiv = document.getElementById('activeFilters')!;
  const chips: { label: string; type: string }[] = [];
  const categoryFilter = document.getElementById('filterCategory') as HTMLSelectElement | null;
  const category = categoryFilter?.value ?? '';

  if (year) chips.push({ label: t('filter.chip.year', { value: year }), type: 'year' });
  if (month) chips.push({ label: t('filter.chip.month', { value: month }), type: 'month' });
  if (state.selectedDay !== null && month) chips.push({ label: t('filter.chip.day', { value: `${state.selectedDay}/${month}` }), type: 'day' });
  if (!year && !month && (state.dateRange.start || state.dateRange.end)) {
    const startStr = state.dateRange.start ? formatDate(state.dateRange.start) : '…';
    const endStr = state.dateRange.end ? formatDate(state.dateRange.end) : '…';
    chips.push({ label: t('filter.chip.dateRange', { start: startStr, end: endStr }), type: 'dateRange' });
  }
  if (status) {
    const statusText = filterStatus.options[filterStatus.selectedIndex].text;
    chips.push({ label: escapeHtml(statusText), type: 'status' });
  }
  if (searchTerm) chips.push({ label: t('filter.chip.search', { value: searchTerm }), type: 'search' });
  if (category) chips.push({ label: t('filter.chip.category', { value: category }), type: 'category' });

  if (chips.length > 0) {
    activeFiltersContainer.classList.remove('hidden');
    activeFiltersDiv.innerHTML = chips.map(chip =>
      `<span class="filter-chip" data-type="${escapeHtml(chip.type)}">
        ${escapeHtml(chip.label)}
        <span class="chip-remove" data-filter-type="${escapeHtml(chip.type)}">&times;</span>
      </span>`
    ).join('');

    activeFiltersDiv.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLElement, e: Event) {
        e.stopPropagation();
        const type = this.getAttribute('data-filter-type')!;
        removeFilter(type);
      });
    });
  } else {
    activeFiltersContainer.classList.add('hidden');
  }
}

export function clearAllFilters(): void {
  (document.getElementById('filterYear') as HTMLSelectElement).value = '';
  (document.getElementById('filterMonth') as HTMLSelectElement).value = '';
  (document.getElementById('filterStatus') as HTMLSelectElement).value = '';
  (document.getElementById('searchBox') as HTMLInputElement).value = '';
  const filterCat = document.getElementById('filterCategory') as HTMLSelectElement | null;
  if (filterCat) filterCat.value = '';
  state.selectedDay = null;
  state.dateRange = { start: null, end: null };
  state.currentPage = 1;
  document.dispatchEvent(new CustomEvent(EVENTS.DATE_RANGE_CLEARED));
  applyFilters();
}

export function removeFilter(type: string): void {
  if (type === 'year') (document.getElementById('filterYear') as HTMLSelectElement).value = '';
  if (type === 'month') {
    (document.getElementById('filterMonth') as HTMLSelectElement).value = '';
    state.selectedDay = null; // BUG-1: clear stale selectedDay when month is removed
  }
  if (type === 'day') state.selectedDay = null;
  if (type === 'status') (document.getElementById('filterStatus') as HTMLSelectElement).value = '';
  if (type === 'search') (document.getElementById('searchBox') as HTMLInputElement).value = '';
  if (type === 'dateRange') {
    state.dateRange = { start: null, end: null };
    document.dispatchEvent(new CustomEvent(EVENTS.DATE_RANGE_CLEARED));
  }
  if (type === 'category') {
    const el = document.getElementById('filterCategory') as HTMLSelectElement | null;
    if (el) el.value = '';
  }
  state.currentPage = 1;
  applyFilters();
}

export function handleSort(field: string): void {
  if (state.currentSort.field === field) {
    state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.currentSort.field = field;
    state.currentSort.direction = 'asc';
  }

  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
  });

  const activeHeader = document.querySelector(`th[data-sort="${field}"]`);
  if (activeHeader) {
    activeHeader.classList.add(state.currentSort.direction);
  }

  applyFilters();
}
