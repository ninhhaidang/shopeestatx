# Plan: Refactor results.js into ES Modules

**Goal**: Split `ShopeeStatX/results.js` (1006 lines) into 9 smaller ES Module files for maintainability. **ZERO behavioral changes. ZERO runtime errors.**

**Approach**: ES Modules (`import`/`export`) with `type="module"` on `results.html`

**Scope**:
- **IN**: `ShopeeStatX/results.js` → split into 9 files, `ShopeeStatX/results.html` → add `type="module"`
- **OUT**: `content.js`, `bridge.js`, `popup.js`, `background.js`, `manifest.json`, `results.css`, `popup.css`, vendored libs

---

## Architecture Overview

### Current State
```
results.js (1006 lines) — single DOMContentLoaded closure
├── All state as closure variables (lines 32-42)
├── All event listeners (lines 55-132)
├── All functions (lines 134-1004)
└── Everything shares scope implicitly
```

### Target State
```
ShopeeStatX/
├── state.js        (~25 lines)  — shared mutable state object
├── utils.js        (~20 lines)  — pure utility functions
├── comparison.js   (~85 lines)  — time comparison + summary rendering
├── export.js       (~40 lines)  — Excel export
├── charts.js       (~240 lines) — Chart.js rendering
├── table.js        (~200 lines) — table + pagination rendering
├── filters.js      (~200 lines) — filtering, sorting, active filter chips
├── data.js         (~90 lines)  — data fetching, storage, init
├── results.js      (~130 lines) — main orchestrator (event wiring only)
└── results.html    (1 line change: add type="module")
```

### Dependency Graph
```
state.js ←── (imported by all modules)
utils.js ←── comparison.js, charts.js, table.js

comparison.js ←── filters.js
charts.js     ←── filters.js  (⚠ also imports from filters.js → circular)
table.js      ←── filters.js  (⚠ also imports from filters.js → circular)
export.js     ←── results.js

filters.js    ←── data.js, results.js, charts.js, table.js
data.js       ←── results.js

results.js (orchestrator) ←── imports ALL modules
```

### Circular Import Safety
`filters.js ↔ charts.js` and `filters.js ↔ table.js` are **circular** but **safe** because:
- All cross-module function calls happen inside **function bodies** (onClick handlers), never at module evaluation time
- ES Module spec guarantees live bindings resolve correctly for this pattern
- Each affected import MUST have a comment: `// Circular import — safe: called only inside function bodies, not at eval time`

---

## Critical Technical Decisions (Pre-Resolved)

### D1: State Sharing Pattern → Mutable Object Export
```javascript
// state.js — THE pattern for shared mutable state
export const state = {
  allOrdersData: null,
  filteredOrders: [],
  currentPage: 1,
  itemsPerPage: 20,
  selectedDay: null,
  shopCount: 5,
  shopMetric: 'amount',
  currentSort: { field: null, direction: 'asc' }
};
```
**WHY**: ES Module imported bindings are read-only. `import { x } from './state.js'; x = 5;` throws TypeError. But `import { state } from './state.js'; state.x = 5;` works because we're mutating the object property, not reassigning the binding.

**NOT in state.js**: `searchTimeout` (stays in results.js), `monthlyChart`/`shopChart` (stay in charts.js as module-level `let`)

### D2: DOM Access in Non-Orchestrator Modules → `document.getElementById()`
When `charts.js` or `table.js` need filter DOM values, they use `document.getElementById('filterYear').value` directly. This avoids parameter explosion and keeps the API clean. Only the orchestrator (`results.js`) stores DOM element references for event listener wiring.

### D3: Vendored Libs → Bare Globals
`chart.min.js` and `xlsx.min.js` are NOT ES modules. They export to `window`. After split:
- `charts.js` uses `Chart` as a bare global (add comment: `// Chart global from vendored chart.min.js`)
- `export.js` uses `XLSX` as a bare global (add comment: `// XLSX global from vendored xlsx.min.js`)
- **NEVER** try `import Chart from './chart.min.js'` — it will fail

### D4: `renderData` and `initializeUI` Assignment
- `renderData` → lives in `comparison.js` (it calls `renderTimeComparison` and updates summary DOM)
- `initializeUI` → lives in `data.js` (called from `fetchDataFromShopee` and `loadDataFromStorage`)

### D5: `exportToExcel` Pre-existing Behavior → PRESERVE
`exportToExcel` filters by year/month/status only — does NOT filter by `selectedDay` or `searchTerm`. This means exported Excel may differ from what's shown on screen. This is **pre-existing behavior** and MUST be preserved exactly. Add comment: `// NOTE: Intentionally does not filter by selectedDay or searchTerm — pre-existing behavior`

### D6: `window.removeFilter` → Legacy Dead Code, Preserve
`window.removeFilter` (line 376) is dead code — `removeFilter` is called directly via `addEventListener`, not via HTML `onclick`. Preserve it anyway for safety. Add comment: `// Legacy: window.removeFilter retained for backward compatibility, removeFilter called directly via addEventListener`

---

## Guardrails (MUST NOT)

- **MUST NOT** add `type="module"` to `chart.min.js` or `xlsx.min.js` script tags
- **MUST NOT** attempt `import Chart from` or `import XLSX from`
- **MUST NOT** use `export let x = val` + reassignment for shared mutable state
- **MUST NOT** put `monthlyChart`/`shopChart` in `state.js` (they stay as module-level `let` in `charts.js`)
- **MUST NOT** fix the `exportToExcel` day-filter behavior — zero behavioral changes
- **MUST NOT** change `manifest.json`, `content.js`, `bridge.js`, `popup.js`, `background.js`
- **MUST NOT** move event listener setup out of `results.js` orchestrator
- **MUST NOT** call any cross-module function at module evaluation scope (only inside function bodies)
- **MUST NOT** add `web_accessible_resources` or `content_security_policy` to manifest

---

## Execution Tasks

### Wave 1 — Foundation (No Dependencies, Parallel)

#### Task 1: Create `state.js`
**File**: `ShopeeStatX/state.js` (NEW)
**Source lines**: results.js lines 32-42 (variable declarations)
**What**: Create shared mutable state object

```javascript
// ShopeeStatX/state.js
// Shared mutable state — all modules import and mutate state.X directly
// Originally closure variables in results.js lines 32-42

export const state = {
  allOrdersData: null,     // Raw data from storage/API
  filteredOrders: [],       // Current filtered orders
  currentPage: 1,           // Current pagination page
  itemsPerPage: 20,         // Items per page (20, 50, 100, or Infinity)
  selectedDay: null,        // Day drill-down from chart click
  shopCount: 5,             // Number of shops in doughnut chart
  shopMetric: 'amount',     // Metric for shop chart: 'amount', 'orders', 'products'
  currentSort: { field: null, direction: 'asc' }  // Current sort state
};
```

**Exclude from state.js**:
- `searchTimeout` → stays in `results.js` (orchestrator-only timer handle)
- `monthlyChart`, `shopChart` → stay as `let` in `charts.js` (chart-private instances)

**QA**: File exists. Contains `export const state`. Properties match list above exactly. No `searchTimeout`, no `monthlyChart`, no `shopChart`.

---

#### Task 2: Create `utils.js`
**File**: `ShopeeStatX/utils.js` (NEW)
**Source lines**: results.js lines 917-929
**What**: Extract pure utility functions

```javascript
// ShopeeStatX/utils.js
// Pure utility functions — no dependencies, no side effects

export function formatVND(number, short = false) {
  // Copy lines 917-922 exactly
}

export function escapeHtml(text) {
  // Copy lines 924-929 exactly
}
```

**QA**: File exists. Exports `formatVND` and `escapeHtml`. No imports. No other code. Functions are byte-for-byte identical to original.

---

### Wave 2 — Leaf Modules (Depend on Wave 1, Parallel)

#### Task 3: Create `comparison.js`
**File**: `ShopeeStatX/comparison.js` (NEW)
**Source lines**: results.js lines 439-457 (`renderData`) + lines 931-1004 (`renderTimeComparison`)
**What**: Extract summary rendering and time comparison logic

```javascript
// ShopeeStatX/comparison.js
import { state } from './state.js';
import { formatVND } from './utils.js';

export function renderData(orders) {
  // Copy lines 439-457 exactly
  // Line 453: use formatVND(totalAmount) — imported from utils
  // Line 456: renderTimeComparison(state.allOrdersData.orders) — ALWAYS passes ALL orders, NOT filtered
}

export function renderTimeComparison(allOrders) {
  // Copy lines 931-1004 exactly
  // Uses formatVND — imported from utils
}
```

**Critical behavior to preserve**: `renderTimeComparison` always receives `allOrdersData.orders` (full dataset), never `filteredOrders`. This is intentional — comparison cards show current month vs. last month across ALL data regardless of filters.

**QA**: Exports both `renderData` and `renderTimeComparison`. `renderData` calls `renderTimeComparison(state.allOrdersData.orders)` — verify `allOrdersData` not `filteredOrders`.

---

#### Task 4: Create `export.js`
**File**: `ShopeeStatX/export.js` (NEW)
**Source lines**: results.js lines 883-915
**What**: Extract Excel export logic

```javascript
// ShopeeStatX/export.js
import { state } from './state.js';
// XLSX global from vendored xlsx.min.js script tag in results.html

export function exportToExcel() {
  // Copy lines 883-915 exactly
  // Replace closure references:
  //   allOrdersData → state.allOrdersData
  //   filterYear.value → document.getElementById('filterYear').value
  //   filterMonth.value → document.getElementById('filterMonth').value
  //   filterStatus.value → document.getElementById('filterStatus').value
  //
  // NOTE: Intentionally does not filter by selectedDay or searchTerm — pre-existing behavior, do not change
}
```

**QA**: File exports `exportToExcel`. Does NOT reference `state.selectedDay` in filter logic. Contains the preservation comment. Uses `XLSX` as bare global.

---

#### Task 5: Create `charts.js`
**File**: `ShopeeStatX/charts.js` (NEW)
**Source lines**: results.js lines 650-881
**What**: Extract chart rendering (monthly bar + shop doughnut)

```javascript
// ShopeeStatX/charts.js
import { state } from './state.js';
import { formatVND } from './utils.js';
import { applyFilters } from './filters.js'; // Circular import — safe: applyFilters called only inside onClick handlers, not at eval time
// Chart global from vendored chart.min.js script tag in results.html

// Chart instances — private to this module, NOT in state.js
let monthlyChart = null;
let shopChart = null;

export function renderCharts(orders) {
  // Copy lines 650-881 exactly
  // Replace closure references:
  //   selectedDay → state.selectedDay
  //   shopCount → state.shopCount
  //   shopMetric → state.shopMetric
  //   filterYear.value → document.getElementById('filterYear').value
  //   filterMonth.value → document.getElementById('filterMonth').value
  //   filterStatus.value → document.getElementById('filterStatus').value
  //   searchBox.value → document.getElementById('searchBox').value
  //
  // Lines 786-789: selectedDay = day → state.selectedDay = day
  // Lines 800-801: filterYear.value = year → document.getElementById('filterYear').value = year
  //                filterMonth.value = monthNum → document.getElementById('filterMonth').value = monthNum
  // Line 870: searchBox.value = shopName → document.getElementById('searchBox').value = shopName
  //
  // Lines 793, 804, 873: applyFilters() — imported from filters.js (circular but safe)
  // Line 831: shopMetric → state.shopMetric
  // Line 832: shopCount → state.shopCount
}
```

**QA**: `monthlyChart` and `shopChart` declared as module-level `let`, NOT in state.js. Forward-import of `applyFilters` from `./filters.js` present with circular-import comment. `state.selectedDay` used instead of bare `selectedDay`. DOM values accessed via `document.getElementById`.

---

#### Task 6: Create `table.js`
**File**: `ShopeeStatX/table.js` (NEW)
**Source lines**: results.js lines 459-648
**What**: Extract table rendering, pagination, and page button creation

```javascript
// ShopeeStatX/table.js
import { state } from './state.js';
import { escapeHtml, formatVND } from './utils.js';
import { applyFilters } from './filters.js'; // Circular import — safe: applyFilters called only inside click event handlers, not at eval time

export function renderCurrentPage() {
  // Copy lines 459-596 exactly
  // Replace closure references:
  //   currentPage → state.currentPage
  //   itemsPerPage → state.itemsPerPage
  //   filteredOrders → state.filteredOrders
  //   selectedDay → state.selectedDay
  //
  // Lines 570, 574: filterStatus/searchBox → document.getElementById('filterStatus'/'searchBox')
  // Lines 579-581: filterYear/filterMonth/selectedDay → document.getElementById + state.selectedDay
  // Lines 571, 575, 582: applyFilters() — imported (circular but safe, inside click handler)
}

export function updatePaginationInfo() {
  // Copy lines 598-637 exactly
  // Replace:
  //   filteredOrders → state.filteredOrders
  //   currentPage → state.currentPage
  //   itemsPerPage → state.itemsPerPage
  //
  // Note: createPageButton calls in this function reference the local function below
}

export function createPageButton(page, isActive) {
  // Copy lines 639-648 exactly
  // Replace:
  //   currentPage → state.currentPage
  //   Inside click handler: currentPage = page → state.currentPage = page
}
```

**QA**: Exports `renderCurrentPage`, `updatePaginationInfo`, `createPageButton`. Forward-import of `applyFilters` present. All `currentPage` refs become `state.currentPage`. All `filteredOrders` refs become `state.filteredOrders`.

---

### Wave 3 — Hub Module (Depends on Wave 1 + 2)

#### Task 7: Create `filters.js`
**File**: `ShopeeStatX/filters.js` (NEW)
**Source lines**: results.js lines 255-437 + lines 376-384
**What**: Extract filtering, sorting, and active filter chips

```javascript
// ShopeeStatX/filters.js
import { state } from './state.js';
import { renderData } from './comparison.js';
import { renderCharts } from './charts.js';
import { renderCurrentPage } from './table.js';

export function applyFilters() {
  // Copy lines 255-322 exactly
  // Replace closure references:
  //   allOrdersData → state.allOrdersData
  //   filteredOrders = filtered → state.filteredOrders = filtered
  //   currentPage = 1 → state.currentPage = 1
  //   selectedDay → state.selectedDay
  //   currentSort → state.currentSort
  //   filterYear.value → document.getElementById('filterYear').value
  //   filterMonth.value → document.getElementById('filterMonth').value
  //   filterStatus.value → document.getElementById('filterStatus').value
  //   searchBox.value → document.getElementById('searchBox').value
  //
  // Lines 294-296: if (currentSort.field) → if (state.currentSort.field)
  // Lines 319-321: renderData, renderCharts, renderCurrentPage — imported
}

export function updateActiveFilters() {
  // Copy lines 324-363 exactly
  // Replace filter DOM refs → document.getElementById
  // Replace selectedDay → state.selectedDay
}

export function clearAllFilters() {
  // Copy lines 365-373 exactly
  // Replace filter DOM refs → document.getElementById
  // Replace selectedDay = null → state.selectedDay = null
  // Calls applyFilters() — same module, no circular issue
}

export function removeFilter(type) {
  // Copy lines 376-384 exactly (the function body, not the window.removeFilter assignment)
  // Replace filter DOM refs → document.getElementById
  // Replace selectedDay = null → state.selectedDay = null
  // Calls applyFilters() — same module
}

// Legacy: window.removeFilter retained for backward compatibility
// removeFilter is actually called directly via addEventListener, not via HTML onclick
window.removeFilter = removeFilter;

export function handleSort(field) {
  // Copy lines 386-406 exactly
  // Replace currentSort → state.currentSort
  // Calls applyFilters() — same module
}

function sortOrders(orders, field, direction) {
  // Copy lines 408-437 exactly
  // NOT exported — only used internally by applyFilters via handleSort
}
```

**QA**: Exports `applyFilters`, `updateActiveFilters`, `clearAllFilters`, `removeFilter`, `handleSort`. `sortOrders` is NOT exported (internal). `window.removeFilter = removeFilter` line is present. All `state.X` mutations use mutable object pattern.

---

### Wave 4 — Data Module (Depends on Wave 3)

#### Task 8: Create `data.js`
**File**: `ShopeeStatX/data.js` (NEW)
**Source lines**: results.js lines 134-253
**What**: Extract data fetching, storage, initialization

```javascript
// ShopeeStatX/data.js
import { state } from './state.js';
import { applyFilters } from './filters.js';

export async function fetchDataFromShopee() {
  // Copy lines 134-190 exactly
  // Replace:
  //   allOrdersData = ... → state.allOrdersData = ...
  //   loading, loadingText, content, noData → document.getElementById(...)
  //
  // Line ~185: calls initializeUI(data) — local function in this module
  //
  // Note: chrome.scripting.executeScript, chrome.runtime.onMessage — these are Chrome APIs, unchanged
}

export function loadDataFromStorage() {
  // Copy lines 192-206 exactly
  // Replace:
  //   allOrdersData = ... → state.allOrdersData = ...
  //   loading, content, noData → document.getElementById(...)
  //
  // Calls initializeUI — local function
  // Calls updateLastUpdatedTime — local function
}

export function refreshData() {
  // Copy lines 208-210 exactly — simple redirect
}

export function updateLastUpdatedTime(fetchedAt) {
  // Copy lines 212-230 exactly
  // Replace:
  //   lastUpdated → document.getElementById('lastUpdated')
}

export function initializeUI(data) {
  // Copy lines 232-253 exactly
  // Replace:
  //   loading → document.getElementById('loading')
  //   content → document.getElementById('content')
  //   filterYear → document.getElementById('filterYear')
  //
  // Line 252: applyFilters() — imported from filters.js
}
```

**QA**: Exports all 5 functions. `state.allOrdersData` used instead of bare `allOrdersData`. `initializeUI` calls `applyFilters()` from filters.js. All DOM refs use `document.getElementById`.

---

### Wave 5 — Orchestrator (Depends on ALL previous waves)

#### Task 9: Rewrite `results.js` as Main Orchestrator
**File**: `ShopeeStatX/results.js` (REWRITE — replace entire content)
**Source lines**: Original lines 1-133 (event wiring) + import statements
**What**: Slim orchestrator that imports all modules and wires event listeners

```javascript
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
```

**QA**:
- File is ≤150 lines
- Contains import statements from ALL 8 modules
- `let searchTimeout` declared here (NOT in state.js)
- All state mutations use `state.X = value` pattern
- NO function bodies beyond event wiring
- ALL event listeners from original lines 55-132 are present
- `filteredOrders` → `state.filteredOrders`, `currentPage` → `state.currentPage`, etc.

---

### Wave 6 — HTML Update (Depends on Wave 5)

#### Task 10: Update `results.html`
**File**: `ShopeeStatX/results.html` (EDIT line 234 only)
**What**: Add `type="module"` to the results.js script tag

**Change**:
```html
<!-- Line 234 BEFORE -->
<script src="results.js"></script>

<!-- Line 234 AFTER -->
<script type="module" src="results.js"></script>
```

**DO NOT CHANGE**:
- Line 9: `<script src="chart.min.js"></script>` — stays as-is (NOT a module)
- Line 10: `<script src="xlsx.min.js"></script>` — stays as-is (NOT a module)

**QA**: Line 234 has `type="module"`. Lines 9-10 do NOT have `type="module"`. No other changes. `manifest.json` is UNCHANGED.

---

### Wave 7 — Final Verification

#### Task 11: End-to-End Manual QA
**What**: Verify zero behavioral changes after refactoring

**Verification checklist** (ALL must pass):

1. **Page loads**: Dashboard renders without console errors. Open Chrome DevTools → Console → verify 0 errors
2. **Data display**: Order count > 0, charts visible (`canvas` elements have `height > 0`), table has rows
3. **Year/month filter**: Change year → table + charts update correctly. Change month → same
4. **Day drill-down**: Click a month bar → chart switches to daily view → click a day bar → table filters to that day + chip appears
5. **Day toggle**: Click same day bar again → `selectedDay` clears → table shows full month
6. **Shop drill-down**: Click doughnut chart segment → `searchBox` populates with shop name → table filters
7. **Filter chips**: Apply year + month + status → chips appear → click ✕ on one → only that filter clears
8. **Clear all filters**: Click "Xóa tất cả" → all filters reset → all orders shown
9. **Export**: Click "Xuất file xlsx" → `.xlsx` file downloads with correct columns (STT, Mã đơn, Ngày giao, etc.)
10. **Export with day filter**: Apply day filter → export → Excel should contain **entire month** (not just filtered day) — pre-existing behavior
11. **Keyboard shortcuts**: `/` → focus search; `Escape` → clear search; `R` → refresh
12. **Sorting**: Click "Ngày giao" header → orders sort ascending → click again → descending
13. **Pagination**: Change page size to 50 → correct number shown; navigate pages
14. **Detail row**: Click table row → expand detail → click "Người bán" value → auto-filters to that shop
15. **Shop chart controls**: Change top shop count (3/5/10/15) → chart updates; change metric → chart updates

**Files that MUST NOT have changed** (verify with git diff):
- `manifest.json` — zero changes
- `content.js` — zero changes
- `bridge.js` — zero changes
- `popup.js` — zero changes
- `background.js` — zero changes
- `popup.html` — zero changes
- `popup.css` — zero changes
- `results.css` — zero changes

**New files created** (verify exist):
- `ShopeeStatX/state.js`
- `ShopeeStatX/utils.js`
- `ShopeeStatX/comparison.js`
- `ShopeeStatX/export.js`
- `ShopeeStatX/charts.js`
- `ShopeeStatX/table.js`
- `ShopeeStatX/filters.js`
- `ShopeeStatX/data.js`

**Modified files**:
- `ShopeeStatX/results.js` — rewritten as orchestrator
- `ShopeeStatX/results.html` — line 234 only

---

## Module-to-Function Mapping (Complete Reference)

| Original Function | Lines | Target Module | Exported? |
|---|---|---|---|
| `fetchDataFromShopee` | 134-190 | `data.js` | YES |
| `loadDataFromStorage` | 192-206 | `data.js` | YES |
| `refreshData` | 208-210 | `data.js` | YES |
| `updateLastUpdatedTime` | 212-230 | `data.js` | YES |
| `initializeUI` | 232-253 | `data.js` | YES |
| `applyFilters` | 255-322 | `filters.js` | YES |
| `updateActiveFilters` | 324-363 | `filters.js` | YES |
| `clearAllFilters` | 365-373 | `filters.js` | YES |
| `removeFilter` (+ window assign) | 376-384 | `filters.js` | YES |
| `handleSort` | 386-406 | `filters.js` | YES |
| `sortOrders` | 408-437 | `filters.js` | NO (internal) |
| `renderData` | 439-457 | `comparison.js` | YES |
| `renderCurrentPage` | 459-596 | `table.js` | YES |
| `updatePaginationInfo` | 598-637 | `table.js` | YES |
| `createPageButton` | 639-648 | `table.js` | YES |
| `renderCharts` | 650-881 | `charts.js` | YES |
| `exportToExcel` | 883-915 | `export.js` | YES |
| `formatVND` | 917-922 | `utils.js` | YES |
| `escapeHtml` | 924-929 | `utils.js` | YES |
| `renderTimeComparison` | 931-1004 | `comparison.js` | YES |
| Event listeners | 55-132 | `results.js` | N/A (inline) |
| State variables | 32-42 | `state.js` | YES (as object) |
| DOM refs | 2-29 | `results.js` | NO (local) |
