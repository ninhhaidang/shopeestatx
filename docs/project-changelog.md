# Project Changelog

All notable changes to ShopeeStatX are documented here. Source of truth for current version: `package.json` (3.4.0). The `src/manifest.json` version is kept in sync.

> **Versioning note:** v3.4.0 consolidates work that was previously tracked as 3.1.x patches + 3.2.0 (i18n-vi-only) + 3.3.0 (security) + 3.3.1 (collapsible toolbar) into a single release. Prior to 3.4.0, the source-of-truth `package.json` was 3.1.0; the intervening work was unreleased. All entries below are grouped under v3.4.0 for traceability.

---

## [3.4.0] - 2026-06-01

Consolidated release covering all work from 2026-03-12 through 2026-05-04.

### Added

**Centralized Config (`src/config.ts`)** — closes the prior `[3.2.0] - TBD` hardcode-detection entry
- `DOMAINS` map (vn / id / th / ph / my / sg / tw) for multi-market support
- `STORAGE_KEYS` with consistent `shopeestatx-*` prefix
- `EVENTS` with consistent `shopeestatx:*` prefix
- URL helpers: `getApiBaseUrl()`, `getOrderUrl()`, `getPurchaseUrl()`, `getLoginUrl()`, `getHomeUrl()`
- `setActiveDomain()` / `getActiveDomain()` for runtime domain switching
- `manifest.json` `host_permissions` updated for all 7 supported domains

**5-Theme System** (`src/dashboard/theme-config.ts` + `src/styles/themes.css`)
- Themes: `orange` (Cam), `forest` (Rừng), `rose` (Hồng), `sky` (Trời Xanh), `lavender` (Oải Hương)
- 15 tokens per theme (primary ramp, secondary, bg, text, border, heatmap 0–4, 6 shadow tokens)
- Dropdown selector (`src/dashboard/theme-toggle.ts`) with FOUC-safe init
- Persisted via `localStorage` under `STORAGE_KEYS.THEME`

**Vietnamese-Only i18n**
- Removed `src/i18n/locales/en.json` — Vietnamese-only
- Simplified `src/i18n/index.ts` — removed `setLocale()` / `getLocale()` exports
- Hardcoded `vi-VN` locale in `src/i18n/format.ts`
- Removed `LANGUAGE` key from `src/config.ts`
- Removed language switcher UI from results header
- Theme names now Vietnamese only (`nameVi` instead of `nameEn`)
- Removed `refreshDateRangePickerLabels` export
- Refactor: removed dead code from language switcher removal

**Collapsible Toolbar** (`src/dashboard/results.ts` + `src/styles/filters.css`)
- Toolbar restructured with semantic `toolbar-container` layout
- Search box always visible on primary row
- Date picker always visible (not collapsible)
- Status/Category filters moved to collapsible "More filters" panel
- Mobile: collapsible behavior to save space
- New CSS classes: `toolbar-container`, `toolbar-row`, `search-row`, `filters-row`, `more-filters-panel`, `btn-more-filters`
- Responsive CSS updated for mobile breakpoints
- JavaScript toggle logic for collapsible filters panel
- Filter count badge on "More filters" button
- Accessibility attributes: `aria-expanded`, `aria-controls`
- Active filter chips moved into toolbar for visibility
- Multiple toolbar polish fixes (clear button styling, flat panel, `EVENTS.APPLY_FILTERS` dispatch, etc.)

**Popup User Greeting** (`src/popup/popup.{html,css,ts}`)
- Avatar + name welcome message
- Improved UX: domain check + "Bắt đầu" button clearer enable/disable states

**Order Detail Polish**
- Clickable order ID link (opens Shopee order page in new tab)
- Order detail expand icon (chevron) for clearer affordance
- Order detail two-column layout (info + product details aligned)
- Aligned order info and product details in same rows
- Removed duplicate header line, added card style, fixed text wrap
- Refactor: removed `orderDate` and `daysToDeliver` from order detail

**Date Range Picker** (also covered in v3.1.0)
- Toggle date preset on click (single-click preset selection)

**Categories Enhancement**
- Expanded categories and keywords for product classification
- Word-boundary regex fix in `categorizeOrder` (replaced substring matching to prevent false matches, e.g. "fashion" inside "fashionable")

**Theme Polish**
- User avatar display with floating style
- Status badge accessibility and consistency fixes
- Orange theme heatmap-0 updated to match theme color
- All themes unified to neutral gray background colors
- Pending and returned colors added to all themes

**Documentation**
- README rewritten to reflect current TypeScript + Vite stack
- Replaced stale "xlsx" references with "exceljs"
- Updated setup/build instructions to match `package.json` scripts

### Security (rolled in)

**XSS Prevention**
- `escapeHtml()` utility in `src/dashboard/utils.ts`
- Applied to: `filters.ts`, `insights.ts`, `budget.ts`, `shop-loyalty.ts`, `table.ts`
- All user-generated content sanitized before DOM insertion

**Content Security Policy**
- `content_security_policy` added to `manifest.json`
- Strict CSP headers enforced by Chrome

**Memory Leak Prevention**
- `destroyAllCharts()` function in `src/dashboard/charts.ts`
- `beforeunload` listener ensures cleanup on page exit
- Prevents Chart.js instance leaks

**Accessibility**
- `aria-label`s added to all dropdown elements
- `prefers-reduced-motion` rules added to `src/popup/popup.css:590` and `src/styles/states.css:32` (partial coverage)

**Error Handling**
- try-catch blocks added to `data.ts`, `budget.ts`
- Graceful error handling with user feedback

### Changed
- `package.json` version: 3.1.0 → **3.4.0**
- `src/manifest.json` version: 3.1.0 → **3.4.0**
- All hardcoded values moved to `src/config.ts`
- Multi-domain support: 7 Shopee marketplaces
- `event_names` and storage keys unified with `shopeestatx-*` prefix
- Theme names Vietnamese-only (`nameVi`)
- Removed `LANGUAGE` config key

### Notes
- v3.4.0 is the first release published with the consolidated 3.1.x + 3.2.0 + 3.3.x work; no intermediate Chrome Web Store release was made.
- The `_legacy-shopeestatx/icons/` folder is still referenced by `vite.config.ts` for icon assets — documented as tech debt to clean up pre-Phase 5.
- `prefers-reduced-motion` has partial coverage (2 files); full coverage is a Phase 5/6 roadmap item.

---

## [3.1.0] - 2026-03-06

### Phase 4: Global — i18n + Date Range Picker

#### Added

**i18n (Internationalization)** — original Vietnamese + English
- Core i18n module with `t()`, `setLocale()`, `getLocale()` functions
- Locale-aware currency/date formatting via `Intl.NumberFormat`
- Vietnamese (vi) and English (en) locale files (~100 keys each)
- Language switcher in header — instant switch, no reload
- Full i18n coverage: dashboard, popup, welcome pages

**Date Range Picker**
- Custom component with preset buttons: Last 7 days, This month, Last month, 3 months, This year
- Custom date range input (from/to)
- Integration with existing filter logic

**Phase 3 Advanced Analytics** (grouped under 3.1.0 release):
- Heatmap (52-week calendar, `heatmap.ts`)
- Categories (12-bucket classifier, `categories.ts`)
- Predictions (linear extrapolation, `predictions.ts`)
- Shop loyalty (repeat rate, `shop-loyalty.ts`)
- Auto insights (max 5 cards, `insights.ts`)
- Budget tracking (progress ring + toast, `budget.ts`)
- Incremental fetch (cache merge, `incremental-fetch.ts`)

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

**Theme System (1-theme → 5-theme foundation)**
- CSS custom properties for theming
- `data-theme` attribute with `localStorage` persistence
- FOUC (flash of unstyled content) prevention
- Theme-aware colors for Chart.js charts via `cssVar` helper
- New module: `src/dashboard/theme-toggle.ts`
- New stylesheet: `src/styles/dark-theme.css` (later superseded by `themes.css`)

**Incremental Data Fetch**
- In-place data refresh without page reload
- Cache merge by orderId to prevent duplicates
- New module: `src/dashboard/incremental-fetch.ts`
- User feedback via toast notifications

**Enhanced Export**
- CSV export with UTF-8 BOM encoding
- PDF export via `window.print()` integration
- Export format dropdown UI selector
- Updated `export.ts` module

**Utilities**
- `showToast()` notification utility for user feedback

#### Changed

- `export.ts`: extended to support CSV + PDF formats (was Excel only)
- `utils.ts`: added `showToast()` function
- Test suite: 33 new tests for Phase 2 features

#### Testing

- Total: 64 tests (Phase 1: 31, Phase 2: 33)
- Coverage: unit + integration tests for theme, incremental fetch, export formats

---

## [2.5.0] - 2026-03-01

### Phase 1: Build System & TypeScript Migration

#### Added

**Build System & Tooling**
- Vite 6.0 build system with multi-entry configuration
- TypeScript strict mode (zero `any` types)
- Pre-build type validation
- `tsc --noEmit` in `npm run build`

**Code Quality**
- Modular `src/` directory structure
- CSS modules (later grew from 4 to 11 separate files via `@import`)
- TypeScript strict type checking across all modules

**Dependencies**
- Moved `chart.js` from vendored (`chart.min.js`) → npm package (4.4.7)
- Moved `xlsx` from vendored (`xlsx.min.js`) → npm package (later replaced by `exceljs` 4.4.0)
- Kept `content.js` as IIFE JavaScript (Chrome MAIN world requirement)

**Testing**
- Vitest 3.0 unit + integration testing framework
- jsdom for browser simulation
- 31 tests covering dashboard, filters, data, charts
- Coverage reporting via `@vitest/coverage-v8`

#### Preserved Features

- Core Manifest V3 extension structure
- Dual-world injection (MAIN + ISOLATED) for cookie-enabled API access
- Full order history fetch with pagination
- New Shopee API (2024+) support + fallback
- `chrome.storage.local` caching
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
- `content.js`: kept as IIFE, not bundled by Vite

#### Testing

- Total: 31 tests
- Coverage: dashboard initialization, filter logic, data processing, chart rendering

---

## Version History

| Version | Date | Status | Focus |
|---------|------|--------|-------|
| 3.4.0 | 2026-06-01 | Stable | Consolidated: centralized config, 5 themes, vi-only i18n, collapsible toolbar, popup greeting, security hardening, order detail polish, theme unification, docs sync |
| 3.1.0 | 2026-03-06 | Stable | i18n (VI/EN), date range picker, Phase 3 advanced analytics (heatmap/categories/predictions/loyalty/insights/budget/incremental-fetch) |
| 2.7.0 | 2026-03-06 | Stable | Chrome Web Store release |
| 2.6.0 | 2026-03-05 | Stable | Theme foundation, incremental fetch, enhanced export |
| 2.5.0 | 2026-03-01 | Stable | Build system & TypeScript migration |
