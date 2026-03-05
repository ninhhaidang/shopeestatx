// Filter logic, sorting, active filter chips, and search
import type { Order, SortDirection } from '../types/index.js';
import { state } from './state.js';
import { renderData } from './comparison.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';

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
  return orders.filter(order => {
    if (opts.year && (!order.orderYear || order.orderYear !== Number(opts.year))) return false;
    if (opts.month && (!order.orderMonth || order.orderMonth !== Number(opts.month))) return false;
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

  let filtered = filterOrders(state.allOrdersData.orders, { year, month, status, searchTerm });

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

  if (year) chips.push({ label: `Năm ${year}`, type: 'year' });
  if (month) chips.push({ label: `Tháng ${month}`, type: 'month' });
  if (state.selectedDay !== null && month) chips.push({ label: `Ngày ${state.selectedDay}`, type: 'day' });
  if (status) {
    const statusText = filterStatus.options[filterStatus.selectedIndex].text;
    chips.push({ label: statusText, type: 'status' });
  }
  if (searchTerm) chips.push({ label: `Tìm: "${searchTerm}"`, type: 'search' });

  if (chips.length > 0) {
    activeFiltersContainer.classList.remove('hidden');
    activeFiltersDiv.innerHTML = chips.map(chip =>
      `<span class="filter-chip" data-type="${chip.type}">
        ${chip.label}
        <span class="chip-remove" data-filter-type="${chip.type}">&times;</span>
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
  state.selectedDay = null;
  state.currentPage = 1;
  applyFilters();
}

export function removeFilter(type: string): void {
  if (type === 'year') (document.getElementById('filterYear') as HTMLSelectElement).value = '';
  if (type === 'month') (document.getElementById('filterMonth') as HTMLSelectElement).value = '';
  if (type === 'day') state.selectedDay = null;
  if (type === 'status') (document.getElementById('filterStatus') as HTMLSelectElement).value = '';
  if (type === 'search') (document.getElementById('searchBox') as HTMLInputElement).value = '';
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
