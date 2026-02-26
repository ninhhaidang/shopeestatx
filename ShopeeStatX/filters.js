// ShopeeStatX/filters.js
import { state } from './state.js';
import { renderData } from './comparison.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';

function sortOrders(orders, field, direction) {
  const sorted = [...orders].sort((a, b) => {
    let aVal, bVal;

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

    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return sorted;
}

export function applyFilters() {
  if (!state.allOrdersData) return;

  const year = document.getElementById('filterYear').value;
  const month = document.getElementById('filterMonth').value;
  const status = document.getElementById('filterStatus').value;
  const searchTerm = document.getElementById('searchBox').value.toLowerCase().trim();

  let filtered = state.allOrdersData.orders.filter(order => {
    // If filtering by year/month, exclude orders without delivery date
    if (year && (!order.orderYear || order.orderYear != year)) return false;
    if (month && (!order.orderMonth || order.orderMonth != month)) return false;

    // Filter by day if selected (only when month filter is active)
    if (state.selectedDay !== null && month) {
      if (!order.deliveryDate) return false;
      const date = new Date(order.deliveryDate);
      if (date.getDate() != state.selectedDay) return false;
    }

    if (status && order.statusCode != status) return false;

    // Search filter
    if (searchTerm) {
      const searchableText = [
        order.orderId?.toString(),
        order.name,
        order.shopName,
        order.productSummary,
        order.status
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });

  // Apply sorting
  if (state.currentSort.field) {
    filtered = sortOrders(filtered, state.currentSort.field, state.currentSort.direction);
  }

  state.filteredOrders = filtered;
  state.currentPage = 1;

  // Update active filters chips
  updateActiveFilters();

  // Show/hide empty state
  const emptyState = document.getElementById('emptyState');
  const ordersTable = document.getElementById('ordersTable');
  const paginationContainer = document.getElementById('paginationContainer');

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

export function updateActiveFilters() {
  const year = document.getElementById('filterYear').value;
  const month = document.getElementById('filterMonth').value;
  const filterStatus = document.getElementById('filterStatus');
  const status = filterStatus.value;
  const searchTerm = document.getElementById('searchBox').value.trim();

  const activeFiltersContainer = document.getElementById('activeFiltersContainer');
  const activeFiltersDiv = document.getElementById('activeFilters');
  const chips = [];

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

    // Add click event listeners to all chip-remove buttons
    activeFiltersDiv.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const type = this.getAttribute('data-filter-type');
        removeFilter(type);
      });
    });
  } else {
    activeFiltersContainer.classList.add('hidden');
  }
}

export function clearAllFilters() {
  document.getElementById('filterYear').value = '';
  document.getElementById('filterMonth').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('searchBox').value = '';
  state.selectedDay = null;
  state.currentPage = 1;
  applyFilters();
}

export function removeFilter(type) {
  if (type === 'year') document.getElementById('filterYear').value = '';
  if (type === 'month') document.getElementById('filterMonth').value = '';
  if (type === 'day') state.selectedDay = null;
  if (type === 'status') document.getElementById('filterStatus').value = '';
  if (type === 'search') document.getElementById('searchBox').value = '';
  state.currentPage = 1;
  applyFilters();
}

// Legacy: window.removeFilter retained for backward compatibility
// removeFilter is actually called directly via addEventListener, not via HTML onclick
window.removeFilter = removeFilter;

export function handleSort(field) {
  // Toggle sort direction
  if (state.currentSort.field === field) {
    state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.currentSort.field = field;
    state.currentSort.direction = 'asc';
  }

  // Update UI indicators
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
  });

  const activeHeader = document.querySelector(`th[data-sort="${field}"]`);
  if (activeHeader) {
    activeHeader.classList.add(state.currentSort.direction);
  }

  applyFilters();
}
