# Project Changelog

All notable changes to ShopeeStatX are documented here.

## Unreleased — 2026-10-23

### Fixed

- All-page pagination now renders finite row numbers; equal sort keys retain their original order.
- Category matching recognizes accented Vietnamese keywords; custom date ranges retain local dates and include the end of the final second.
- Refresh preserves the selected year and clears stale error states after a successful load.
- Restored reliable theme and export regression tests; CSV and Excel exports follow the visible filtered results.
- API failures and malformed responses no longer masquerade as successful empty order histories, preventing cache loss.
- CSV cells beginning with spreadsheet formula characters are escaped.
- Order parsing keeps true zero subtotals, excludes skipped cards from totals, and includes all parcels in split shipments.
- The page-to-extension relay rejects commands and forwards only validated progress messages.
- Mobile orders retain access to amount and other columns through horizontal table scrolling; dashboard release label matches package version.
- Missing or failed avatar images are hidden rather than showing broken-image placeholders, including in demo data.
- Filter changes no longer recursively dispatch themselves; heatmap requests and post-filter UI notifications now use distinct events.

### Changed

- Dashboard, popup, and onboarding now use restrained typography, warm neutral surfaces, and quiet separators instead of gradients, glass effects, decorative icons, and hover lifts.
- Dashboard summary, analytics, tables, and filter controls remain usable at narrow widths; focus indicators and reduced-motion support are preserved.
- Reuse category breakdown between the category chart and insights; update history-only analytics when orders change, and refresh the heatmap when the selected year or rolling month changes.
- ExcelJS loads only when exporting Excel, shrinking the initial dashboard JavaScript transfer; collapsed order details render on first expansion instead of for every order.

---

## [3.2.0] - 2026-03-15

### Vietnamese-Only i18n

#### Changed

- Removed English (en.json) locale - Vietnamese-only
- Simplified i18n/index.ts - removed setLocale(), getLocale()
- Hardcoded vi-VN locale in format.ts
- Removed LANGUAGE key from config.ts
- Removed language switcher UI from results header
- Theme names now in Vietnamese only (nameVi instead of nameEn)
- Removed refreshDateRangePickerLabels export

---

## [3.3.1] - 2026-03-15

### Collapsible Toolbar Refactor

#### Changed

- Toolbar restructured with semantic `toolbar-container` layout
- Search box always visible on primary row
- Date picker always visible (not collapsible)
- Status/Category filters moved to collapsible "More filters" panel
- Mobile: Collapsible behavior to save space
- New CSS classes: `toolbar-container`, `toolbar-row`, `search-row`, `filters-row`, `more-filters-panel`, `btn-more-filters`
- Responsive CSS updated for mobile breakpoints

#### Added

- JavaScript toggle logic for collapsible filters panel
- Filter count badge on "More filters" button
- Accessibility attributes: `aria-expanded`, `aria-controls`

---

## [3.3.0] - 2026-03-12

### Security Fixes

#### Added

**XSS Prevention**
- `escapeHtml()` utility in `src/dashboard/utils.ts`
- Applied to: filters.ts, insights.ts, budget.ts, shop-loyalty.ts, table.ts
- All user-generated content sanitized before DOM insertion

**Content Security Policy**
- `content_security_policy` added to manifest.json
- Strict CSP headers enforced by Chrome

**Memory Leak Prevention**
- `destroyAllCharts()` function in `src/dashboard/charts.ts`
- `beforeunload` listener ensures cleanup on page exit
- Prevents Chart.js instance leaks

**Accessibility**
- aria-labels added to all dropdown elements

**Error Handling**
- try-catch blocks added to data.ts, budget.ts
- Graceful error handling with user feedback

---

## [3.2.0] - TBD

### Hardcode Detection & Removal

#### Changed

- Refactored all hardcoded values to centralized `src/config.ts` module
- Added multi-domain support (vn, id, th, ph, my, sg, tw)
- Unified storage keys with consistent prefix (`shopeestatx-*`)
- Unified event names with consistent prefix (`shopeestatx:*`)
- Updated manifest.json host_permissions for all supported domains

#### Added

- `src/config.ts` with DOMAINS, STORAGE_KEYS, EVENTS constants
- Helper functions: `getApiBaseUrl()`, `getOrderUrl()`, `getPurchaseUrl()`, `getHomeUrl()`
- Runtime domain switching via `setActiveDomain()`

---

## [3.1.0] - 2026-03-06

### Phase 4: Global — i18n + Date Range Picker

#### Added

**i18n (Internationalization)**
- Core i18n module with t(), setLocale(), getLocale() functions
- Locale-aware currency/date formatting via Intl.NumberFormat
- Vietnamese (vi) and English (en) locale files (~100 keys each)
- Language switcher in header — instant switch, no reload
- Full i18n coverage: dashboard, popup, welcome pages

**Date Range Picker**
- Custom component with preset buttons: Last 7 days, This month, Last month, 3 months, This year
- Custom date range input (from/to)
- Integration with existing filter logic

#### Changed

- Version bump to 3.1.0
- popup.html version display: v2.5 → v3.1
- welcome.html version display: v2.5 → v3.1

---

## [2.7.0] - 2026-03-06

### Chrome Web Store Release

#### Added

**Store Distribution**
- Onboarding flow (welcome.html + background.ts onInstalled listener)
- Privacy Policy page (in-extension + public GitHub Pages)
- Store listing assets (descriptions, screenshots)

#### Changed

- Extension version bumped to 2.7.0 for store submission

---

## [2.6.0] - 2026-03-05

### Phase 2: Enhanced UX & Export

#### Added

**Dark Mode Support**
- CSS custom properties for theming (light/dark)
- data-theme attribute with localStorage persistence
- FOUC (flash of unstyled content) prevention
- Dark mode colors for Chart.js charts via cssVar helper
- New module: `src/dashboard/theme-toggle.ts`
- New stylesheet: `src/styles/dark-theme.css`

**Incremental Data Fetch**
- In-place data refresh without page reload
- Cache merge by orderId to prevent duplicates
- New module: `src/dashboard/incremental-fetch.ts`
- User feedback via toast notifications

**Enhanced Export**
- CSV export with UTF-8 BOM encoding
- PDF export via window.print() integration
- Export format dropdown UI selector
- Updated `export.ts` module

**Utilities**
- showToast() notification utility for user feedback

#### Changed

- export.ts: Extended to support CSV + PDF formats (was Excel only)
- utils.ts: Added showToast() function
- Test suite: 33 new tests for Phase 2 features (64 total)

#### Testing

- Total: 64 tests (Phase 1: 31, Phase 2: 33)
- Coverage: Unit + integration tests for dark mode, incremental fetch, export formats

---

## [2.5.0] - 2026-03-01

### Phase 1: Build System & TypeScript Migration

#### Added

**Build System & Tooling**
- Vite 6.0 build system with multi-entry configuration
- TypeScript strict mode (zero `any` types)
- GitHub Actions CI pipeline (build, typecheck, test)
- Pre-build type validation

**Code Quality**
- Modular src/ directory structure
- CSS modules (8 separate files via @import)
- TypeScript strict type checking across all modules

**Dependencies**
- Moved chart.js from vendored (chart.min.js) → npm package (4.4.7)
- Moved xlsx from vendored (xlsx.min.js) → npm package (0.18.5)
- Kept content.js as IIFE JavaScript (Chrome MAIN world requirement)

**Testing**
- Vitest 3.0 unit + integration testing framework
- jsdom for browser simulation
- 31 tests covering dashboard, filters, data, charts
- Coverage reporting via @vitest/coverage-v8

#### Preserved Features

- Core Manifest V3 extension structure
- Dual-world injection (MAIN + ISOLATED) for cookie-enabled API access
- Full order history fetch with pagination
- New Shopee API (2024+) support + fallback
- chrome.storage.local caching
- Summary cards: total orders, total spend, avg per order
- Month/year time comparison
- Bar chart: monthly/daily with switchable metrics
- Pie chart: top shops with configurable N
- Bar chart drill-down: month → daily → filter table
- Smart filters: year, month, status, text search
- Filter chips with clear controls
- Sortable table with expand rows
- Pagination: 20/50/100/all
- Excel export (.xlsx) with Vietnamese headers
- Keyboard shortcuts: `/`, `Esc`, `R`
- Responsive design (mobile/tablet/desktop)
- Demo mode (mock data for Vite dev server)
- Status badge redesign (7 status types)
- Onboarding flow (welcome.html + background.ts)
- Privacy Policy page

#### Changed

- Extension from vanilla JS (17 files) → TypeScript + Vite
- CSS management: inline styles → modular files
- content.js: Kept as IIFE, not bundled by Vite

#### Testing

- Total: 31 tests
- Coverage: Dashboard initialization, filter logic, data processing, chart rendering

---

## Version History

| Version | Date | Status | Focus |
|---------|------|--------|-------|
| 3.2.0 | 2026-03-15 | Stable | i18n VI-only (removed EN) |
| 3.1.0 | 2026-03-06 | Stable | i18n (VI/EN), date range picker |
| 2.7.0 | 2026-03-06 | Stable | Chrome Web Store release |
| 2.6.0 | 2026-03-05 | Stable | Dark mode, incremental fetch, enhanced export |
| 2.5.0 | 2026-03-01 | Stable | Build system & TypeScript migration |
