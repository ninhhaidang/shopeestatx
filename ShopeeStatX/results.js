// ShopeeStatX/results.js — Main Orchestrator
// Imports all modules and wires DOM event listeners
// This file should be ~130 lines max

import { state } from './state.js';
import { formatVND, escapeHtml } from './utils.js';
import { renderData, renderTimeComparison } from './comparison.js';
import { exportToExcel } from './export.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage, updatePaginationInfo, createPageButton } from './table.js';
import { applyFilters, clearAllFilters, removeFilter, handleSort } from './filters.js';
import { fetchDataFromShopee, loadDataFromStorage, refreshData, updateLastUpdatedTime } from './data.js';

document.addEventListener('DOMContentLoaded', async function () {
  // DOM element references for event wiring ONLY
  const filterYear = document.getElementById('filterYear');
  const filterMonth = document.getElementById('filterMonth');
  const filterStatus = document.getElementById('filterStatus');
  const searchBox = document.getElementById('searchBox');
  const btnExport = document.getElementById('btnExport');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnClearFilters = document.getElementById('btnClearFilters');
  const btnResetFilters = document.getElementById('btnResetFilters');

  const pageSize = document.getElementById('pageSize');
  const btnFirstPage = document.getElementById('btnFirstPage');
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  const btnLastPage = document.getElementById('btnLastPage');

  const shopCountSelect = document.getElementById('shopCount');
  const shopMetricSelect = document.getElementById('shopMetric');
  const shopCountDisplay = document.getElementById('shopCountDisplay');

  let searchTimeout = null; // Timer handle — orchestrator-only, NOT in state.js

  // Check if we need to fetch data
  const urlParams = new URLSearchParams(window.location.search);
  const shouldFetch = urlParams.get('fetch') === 'true';

  if (shouldFetch) {
    await fetchDataFromShopee();
  } else {
    loadDataFromStorage();
  }

  // === Event Listeners (ALL stay here) ===

  // Filter changes
  filterYear.addEventListener('change', () => { state.selectedDay = null; state.currentPage = 1; applyFilters(); });
  filterMonth.addEventListener('change', () => { state.selectedDay = null; state.currentPage = 1; applyFilters(); });
  filterStatus.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
  btnExport.addEventListener('click', exportToExcel);
  btnRefresh.addEventListener('click', refreshData);
  btnClearFilters.addEventListener('click', clearAllFilters);
  btnResetFilters.addEventListener('click', clearAllFilters);

  // Pagination
  pageSize.addEventListener('change', function () {
    state.itemsPerPage = this.value === 'all' ? Infinity : parseInt(this.value);
    state.currentPage = 1;
    renderCurrentPage();
  });
  btnFirstPage.addEventListener('click', () => { state.currentPage = 1; renderCurrentPage(); });
  btnPrevPage.addEventListener('click', () => { if (state.currentPage > 1) { state.currentPage--; renderCurrentPage(); } });
  btnNextPage.addEventListener('click', () => { const totalPages = Math.ceil(state.filteredOrders.length / state.itemsPerPage); if (state.currentPage < totalPages) { state.currentPage++; renderCurrentPage(); } });
  btnLastPage.addEventListener('click', () => { state.currentPage = Math.ceil(state.filteredOrders.length / state.itemsPerPage); renderCurrentPage(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== searchBox) {
      e.preventDefault();
      searchBox.focus();
    }
    if (e.key === 'Escape' && document.activeElement === searchBox) {
      searchBox.value = '';
      applyFilters();
      searchBox.blur();
    }
    if (e.key === 'r' && document.activeElement === document.body) {
      refreshData();
    }
  });

  // Search with debounce
  searchBox.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    state.currentPage = 1;
    searchTimeout = setTimeout(applyFilters, 300);
  });

  // Sort headers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', function () {
      handleSort(this.dataset.sort);
    });
  });

  // Shop chart controls
  shopCountSelect.addEventListener('change', function () {
    state.shopCount = parseInt(this.value);
    shopCountDisplay.textContent = state.shopCount;
    if (searchBox.value.trim()) {
      searchBox.value = '';
      applyFilters();
    } else {
      renderCharts(state.filteredOrders);
    }
  });

  shopMetricSelect.addEventListener('change', function () {
    state.shopMetric = this.value;
    if (searchBox.value.trim()) {
      searchBox.value = '';
      applyFilters();
    } else {
      renderCharts(state.filteredOrders);
    }
  });
});
