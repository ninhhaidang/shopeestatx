// Main orchestrator — imports all modules and wires DOM event listeners
import { state } from './state.js';
import { exportToExcel, exportToCSV, exportToPDF } from './export.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';
import { applyFilters, clearAllFilters, handleSort } from './filters.js';
import { fetchDataFromShopee, loadDataFromStorage, refreshData, isExtensionContext, loadMockData } from './data.js';
import { initTheme, toggleTheme, syncThemeButton } from './theme-toggle.js';
import './results.css';

document.addEventListener('DOMContentLoaded', async function () {
  // Apply theme immediately (also handled by FOUC inline script)
  initTheme();
  syncThemeButton();

  const filterYear = document.getElementById('filterYear') as HTMLSelectElement;
  const filterMonth = document.getElementById('filterMonth') as HTMLSelectElement;
  const filterStatus = document.getElementById('filterStatus') as HTMLSelectElement;
  const searchBox = document.getElementById('searchBox') as HTMLInputElement;
  const btnExport = document.getElementById('btnExport')!;
  const btnRefresh = document.getElementById('btnRefresh')!;
  const btnClearFilters = document.getElementById('btnClearFilters')!;
  const btnResetFilters = document.getElementById('btnResetFilters')!;

  const pageSize = document.getElementById('pageSize') as HTMLSelectElement;
  const btnFirstPage = document.getElementById('btnFirstPage')!;
  const btnPrevPage = document.getElementById('btnPrevPage')!;
  const btnNextPage = document.getElementById('btnNextPage')!;
  const btnLastPage = document.getElementById('btnLastPage')!;

  const shopCountSelect = document.getElementById('shopCount') as HTMLSelectElement;
  const shopMetricSelect = document.getElementById('shopMetric') as HTMLSelectElement;
  const shopCountDisplay = document.getElementById('shopCountDisplay')!;

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const urlParams = new URLSearchParams(window.location.search);
  const shouldFetch = urlParams.get('fetch') === 'true';

  if (!isExtensionContext()) {
    await loadMockData();
  } else if (shouldFetch) {
    await fetchDataFromShopee();
  } else {
    loadDataFromStorage();
  }

  // Theme toggle
  document.getElementById('btnTheme')!.addEventListener('click', () => {
    toggleTheme(() => renderCharts(state.filteredOrders));
    syncThemeButton();
  });

  // Export dropdown toggle
  const exportMenu = document.getElementById('exportMenu')!;
  btnExport.setAttribute('aria-haspopup', 'true');
  btnExport.setAttribute('aria-expanded', 'false');
  const setExportOpen = (open: boolean) => {
    exportMenu.classList.toggle('open', open);
    btnExport.setAttribute('aria-expanded', String(open));
  };
  btnExport.addEventListener('click', (e) => { e.stopPropagation(); setExportOpen(!exportMenu.classList.contains('open')); });
  document.addEventListener('click', () => setExportOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setExportOpen(false); });
  document.getElementById('btnExportXlsx')!.addEventListener('click', () => { exportToExcel(); setExportOpen(false); });
  document.getElementById('btnExportCsv')!.addEventListener('click', () => { exportToCSV(); setExportOpen(false); });
  document.getElementById('btnExportPdf')!.addEventListener('click', () => { exportToPDF(); setExportOpen(false); });

  // Filter changes
  filterYear.addEventListener('change', () => { state.selectedDay = null; state.currentPage = 1; applyFilters(); });
  filterMonth.addEventListener('change', () => { state.selectedDay = null; state.currentPage = 1; applyFilters(); });
  filterStatus.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
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
    if (searchTimeout) clearTimeout(searchTimeout);
    state.currentPage = 1;
    searchTimeout = setTimeout(applyFilters, 300);
  });

  // Sort headers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', function (this: HTMLElement) {
      handleSort(this.dataset.sort!);
    });
  });

  // Shop chart controls
  shopCountSelect.addEventListener('change', function () {
    state.shopCount = parseInt(this.value);
    shopCountDisplay.textContent = String(state.shopCount);
    if (searchBox.value.trim()) {
      searchBox.value = '';
      applyFilters();
    } else {
      renderCharts(state.filteredOrders);
    }
  });

  shopMetricSelect.addEventListener('change', function () {
    state.shopMetric = this.value as 'amount' | 'orders' | 'products';
    if (searchBox.value.trim()) {
      searchBox.value = '';
      applyFilters();
    } else {
      renderCharts(state.filteredOrders);
    }
  });
});
