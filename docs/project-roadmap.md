# Project Roadmap

## Current Version: 3.1.0

## Phase 1: Foundation — Complete (v2.5.0)

**Status:** ✅ COMPLETED (2026-03-05)

### Phase 1 Deliverables

**Build System & Tooling:**
- [x] Migrate from vanilla JS (17 files) to **Vite 6.0** build system
- [x] Add **TypeScript** strict mode (zero `any` types)
- [x] Configure multi-entry rollupOptions (dashboard, popup, welcome, background)
- [x] Add **GitHub Actions CI** pipeline (build, typecheck, test)

**Code Quality:**
- [x] TypeScript strict type checking (pre-build validation)
- [x] Modular src/ structure (dashboard/, types/, content/, popup/, welcome/, bridge/, background/, styles/)
- [x] CSS modularized into 8 separate files via `@import`

**Dependencies:**
- [x] Move chart.js from vendored (chart.min.js) → **npm package (4.4.7)**
- [x] Move xlsx from vendored (xlsx.min.js) → **npm package (0.18.5)**
- [x] Keep content.js as IIFE JavaScript (Chrome MAIN world requirement)

**Testing:**
- [x] Add **Vitest 3.0** unit + integration testing
- [x] Configure **jsdom** for browser simulation
- [x] Write 31 tests covering dashboard, filters, data, charts
- [x] Add coverage reporting (@vitest/coverage-v8)

**Existing Features (Preserved):**
- [x] Core Manifest V3 extension structure
- [x] Dual-world injection (MAIN + ISOLATED) for cookie-enabled API access
- [x] Full order history fetch with pagination (limit=20 loop)
- [x] New Shopee API (2024+) support + old API fallback
- [x] chrome.storage.local caching with age display
- [x] Summary cards: total orders, total spend, avg per order
- [x] Month/year time comparison (this vs last)
- [x] Bar chart: monthly/daily, switchable metric (amount/count/products)
- [x] Pie chart: top shops, configurable N (3/5/10/15), switchable metric
- [x] Bar chart drill-down: click month → daily view → click day → filter table
- [x] Smart filters: year, month, status, text search
- [x] Filter chips with individual/bulk clear
- [x] Sortable table with expand rows and click-to-filter
- [x] Pagination: 20/50/100/all
- [x] Excel export (.xlsx) with Vietnamese headers
- [x] Keyboard shortcuts: `/`, `Esc`, `R`
- [x] Responsive design (mobile/tablet/desktop)
- [x] Demo mode (mock data for Vite dev server)
- [x] Status badge redesign (7 status types with color coding)
- [x] Onboarding / first-run flow (welcome.html + background.ts onInstalled listener)
- [x] Privacy Policy page (in-extension + public GitHub Pages)

## Phase 2: Enhanced UX & Export — Complete (v2.6.0)

**Status:** ✅ COMPLETED (2026-03-05)

### Phase 2 Deliverables

**Dark Mode:**
- [x] CSS custom properties (light/dark theme variables)
- [x] data-theme attribute toggle (localStorage persistence)
- [x] FOUC (flash of unstyled content) prevention
- [x] Chart.js dark mode colors via cssVar helper
- [x] New file: `src/styles/dark-theme.css`
- [x] New file: `src/dashboard/theme-toggle.ts`

**Incremental Data Fetch:**
- [x] In-place data refresh (append new orders to existing data)
- [x] Cache merge by orderId (prevent duplicates)
- [x] No page reload required
- [x] New file: `src/dashboard/incremental-fetch.ts`

**Enhanced Export:**
- [x] CSV export (UTF-8 BOM, proper encoding)
- [x] PDF export (window.print() integration)
- [x] Export format dropdown UI selector
- [x] Updated `export.ts` module

**Utilities & Testing:**
- [x] showToast() notification utility
- [x] 64 total tests (33 new for Phase 2)

## Phase 4: Global — Complete (v3.1.0)

**Status:** ✅ COMPLETED (2026-03-06)

### Phase 4 Deliverables

**i18n (Internationalization):**
- [x] Core i18n module (`src/i18n/index.ts`) with t(), setLocale(), getLocale()
- [x] Locale-aware formatting (`src/i18n/format.ts`) for currency, dates
- [x] Vietnamese locale (`src/i18n/locales/vi.json`) - ~100 translation keys
- [x] English locale (`src/i18n/locales/en.json`)
- [x] Language switcher UI in header
- [x] Apply i18n to all modules: comparison.ts, table.ts, charts.ts, filters.ts, insights.ts, export.ts
- [x] i18n for popup.html and welcome.html

**Date Range Picker:**
- [x] Custom date range picker component (`src/dashboard/date-range-picker.ts`)
- [x] Preset buttons: Last 7 days, This month, Last month, 3 months, This year, Custom
- [x] Custom date input panel (from/to)
- [x] Date picker CSS styles
- [x] Integration with filter logic

**Testing & Version:**
- [x] 87 total tests (all passing)
- [x] Version bump to 3.1.0

## Phase 3: Advanced Analytics (Backlog)

**Priority:** Medium | **Target:** Q3 2026

- [ ] Date range filter (custom from/to)
- [ ] Category/tag analysis
- [ ] Seller comparison across time periods
- [ ] Product-level analytics (most purchased items)
- [ ] Spending forecast / trend line

## Distribution & Release

- [x] Chrome Web Store submission (v2.7.0 — released 2026-03-06)
- [ ] Firefox extension port (Phase 3)
- [ ] Auto-update via Chrome Web Store

## Architecture Stability

After Phase 2 (Dark mode + Export enhancements), module boundaries remain stable and type-safe:

| Module | Responsibility | Status |
|--------|---------------|--------|
| types/index.ts | Type definitions | Stable |
| state.ts | Shared state singleton | Stable |
| data.ts | Fetch + cache | Stable |
| filters.ts | Filter/sort/search logic | Stable |
| table.ts | Table render + pagination | Stable |
| charts.ts | Chart.js integration | Stable |
| comparison.ts | Summary cards + metrics | Stable |
| export.ts | CSV/PDF export | Updated v2.6 |
| theme-toggle.ts | Dark mode toggle + cssVar helper | New v2.6 |
| incremental-fetch.ts | In-place data refresh | New v2.6 |
| utils.ts | Formatting + toast notifications | Updated v2.6 |
| results.ts | Orchestrator + DOM wiring | Stable |
| content.js | MAIN world API fetcher | Stable |
| bridge.ts | ISOLATED world relay | Stable |
| popup.ts | Extension popup logic | Stable |
| welcome.ts | Onboarding logic | Stable |
| background.ts | MV3 service worker | Stable |
