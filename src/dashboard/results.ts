// Main orchestrator — imports all modules and wires DOM event listeners
import { state } from './state.js';
import { exportToExcel, exportToCSV, exportToPDF } from './export.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';
import { applyFilters, clearAllFilters, handleSort } from './filters.js';
import { fetchDataFromShopee, loadDataFromStorage, refreshData, isExtensionContext, loadMockData } from './data.js';
import { initTheme, setTheme, updateThemeButton, getThemes, toggleThemeDropdown, closeThemeDropdown } from './theme-toggle.js';
import { loadBudgetConfig, saveBudgetConfig, setCachedBudgetConfig, getCachedBudgetConfig } from './budget.js';
import { initLocale, setLocale, getLocale } from '../i18n/index.js';
import { renderDateRangePicker, refreshDateRangePickerLabels, resetDateRangePicker } from './date-range-picker.js';
import './results.css';

document.addEventListener('DOMContentLoaded', async function () {
  // Apply theme immediately (also handled by FOUC inline script)
  initTheme();
  updateThemeButton();

  // Initialize i18n before rendering anything
  initLocale();

  // Pre-load budget config so it's ready before first render
  loadBudgetConfig().then(cfg => setCachedBudgetConfig(cfg));

  const filterYear = document.getElementById('filterYear') as HTMLSelectElement;
  const filterMonth = document.getElementById('filterMonth') as HTMLSelectElement;
  const filterStatus = document.getElementById('filterStatus') as HTMLSelectElement;
  const filterCategory = document.getElementById('filterCategory') as HTMLSelectElement;
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

  // Date range picker
  const dateRangeContainer = document.getElementById('dateRangePickerContainer')!;
  renderDateRangePicker(dateRangeContainer);

  // Language switcher
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang!;
      setLocale(lang);
      // Update active state on lang buttons
      document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === lang);
      });
      // Re-render date picker labels after language switch
      refreshDateRangePickerLabels(dateRangeContainer);
      // Re-render charts and table to pick up locale-aware formatting
      renderCharts(state.filteredOrders);
      renderCurrentPage();
    });
  });

  // Sync lang button active state on init
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === getLocale());
  });

  // Reset date range picker when filters are cleared
  document.addEventListener('shopeestatx:date-range-cleared', () => {
    resetDateRangePicker(dateRangeContainer);
  });

  // URL lang param override
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang) {
    setLocale(urlLang);
    document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === urlLang);
    });
  }

  const shouldFetch = urlParams.get('fetch') === 'true';

  if (!isExtensionContext()) {
    await loadMockData();
  } else if (shouldFetch) {
    await fetchDataFromShopee();
  } else {
    loadDataFromStorage();
  }

  // Theme selector
  document.getElementById('btnTheme')!.addEventListener('click', () => {
    toggleThemeDropdown();
  });

  // Render theme dropdown options
  const themeDropdown = document.getElementById('themeDropdown');
  if (themeDropdown) {
    const themes = getThemes();
    const currentId = document.documentElement.dataset.theme || 'light';
    themeDropdown.innerHTML = themes.map(theme => `
      <button class="theme-option ${theme.id === currentId ? 'active' : ''}" data-theme="${theme.id}">
        <span class="theme-color-dot" style="background: ${theme.primaryColor}"></span>
        <span>${theme.nameEn}</span>
        <span class="theme-check">✓</span>
      </button>
    `).join('');

    // Theme selection
    themeDropdown.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = (btn as HTMLElement).dataset.theme!;
        setTheme(themeId, () => renderCharts(state.filteredOrders));
        updateThemeButton();
        closeThemeDropdown();

        // Update active state in dropdown
        themeDropdown.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.theme-selector')) {
      closeThemeDropdown();
    }
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
  filterCategory.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
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
  btnNextPage.addEventListener('click', () => { const totalPages = state.itemsPerPage === Infinity ? 1 : Math.ceil(state.filteredOrders.length / state.itemsPerPage); if (state.currentPage < totalPages) { state.currentPage++; renderCurrentPage(); } });
  btnLastPage.addEventListener('click', () => { state.currentPage = state.itemsPerPage === Infinity ? 1 : Math.ceil(state.filteredOrders.length / state.itemsPerPage); renderCurrentPage(); });

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

  // Heatmap click → applyFilters (dispatched via custom event to avoid circular dep)
  document.addEventListener('shopeestatx:apply-filters', () => applyFilters());

  // Shop loyalty: filter by shop name
  document.addEventListener('shopeestatx:filter-by-shop', (e) => {
    searchBox.value = (e as CustomEvent<string>).detail;
    state.currentPage = 1;
    applyFilters();
    document.getElementById('ordersTable')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Budget dialog wiring (event delegation for dynamically rendered buttons)
  const budgetDialog = document.getElementById('budgetDialog') as HTMLDialogElement;
  const budgetLimitInput = document.getElementById('budgetLimit') as HTMLInputElement;
  const budgetThresholdInput = document.getElementById('budgetThreshold') as HTMLInputElement;
  const budgetThresholdValue = document.getElementById('budgetThresholdValue')!;
  const budgetEnabledCheck = document.getElementById('budgetEnabled') as HTMLInputElement;

  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.btn-budget-settings')) {
      const cfg = getCachedBudgetConfig();
      budgetLimitInput.value = String(cfg.monthlyLimit);
      budgetThresholdInput.value = String(Math.round(cfg.alertThreshold * 100));
      budgetThresholdValue.textContent = budgetThresholdInput.value + '%';
      budgetEnabledCheck.checked = cfg.enabled;
      budgetDialog.showModal();
    }
  });

  budgetThresholdInput.addEventListener('input', () => {
    budgetThresholdValue.textContent = budgetThresholdInput.value + '%';
  });

  document.getElementById('btnBudgetSave')!.addEventListener('click', async () => {
    const cfg = {
      monthlyLimit: Number(budgetLimitInput.value),
      alertThreshold: Number(budgetThresholdInput.value) / 100,
      enabled: budgetEnabledCheck.checked,
    };
    await saveBudgetConfig(cfg);
    budgetDialog.close();
    applyFilters(); // re-render budget widget + prediction
  });

  document.getElementById('btnBudgetClose')!.addEventListener('click', () => budgetDialog.close());

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
