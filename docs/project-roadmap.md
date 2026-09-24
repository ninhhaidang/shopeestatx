# Project Roadmap

## Current Version: 3.4.0

> Version source of truth: `package.json` + `src/manifest.json` (kept in sync). Distribution (Chrome Web Store) ships the same version.

---

## Phase 1: Foundation — Complete (v2.5.0)

**Status:** ✅ COMPLETED (2026-03-01)

### Phase 1 Deliverables

**Build System & Tooling:**
- [x] Migrate from vanilla JS (17 files) to **Vite 6.0** build system
- [x] Add **TypeScript** strict mode (zero `any` types)
- [x] Configure multi-entry rollupOptions (dashboard, popup, welcome, background, bridge)
- [x] Custom `copy-extension-files` plugin in `vite.config.ts`
- [x] Pre-build validation via `tsc --noEmit` in `npm run build`

**Code Quality:**
- [x] TypeScript strict type checking
- [x] `noUnusedLocals` + `noUnusedParameters` + `isolatedModules` enabled
- [x] Modular `src/` structure (dashboard/, types/, content/, popup/, welcome/, bridge/, i18n/, background/, styles/)
- [x] CSS modularized into 11 separate files via `@import` in `results.css`

**Dependencies:**
- [x] Move `chart.js` from vendored (`chart.min.js`) → **npm package (4.4.7)**
- [x] Move `xlsx` from vendored (`xlsx.min.js`) → **npm package (exceljs 4.4.0)**
- [x] Keep `content.js` as IIFE JavaScript (Chrome MAIN world requirement)

**Testing:**
- [x] Add **Vitest 3.0** unit + integration testing
- [x] Configure **jsdom** for browser simulation
- [x] Test specs in `tests/` at project root (not colocated) — KEEP as standard
- [x] Add coverage reporting (`@vitest/coverage-v8`)

**Existing Features (Preserved):**
- [x] Core Manifest V3 extension structure
- [x] Dual-world injection (MAIN + ISOLATED) for cookie-enabled API access
- [x] Full order history fetch with pagination (`limit=20` loop)
- [x] New Shopee API (2024+) support + old API fallback
- [x] `chrome.storage.local` caching (key `shopeestatx-stats`) with age display
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

---

## Phase 2: Enhanced UX & Export — Complete (v2.6.0)

**Status:** ✅ COMPLETED (2026-03-05)

### Phase 2 Deliverables

**Theme System foundation (v2.6.0, expanded to 5 themes in v3.4.0):**
- [x] CSS custom properties for theming
- [x] `data-theme` attribute toggle (localStorage persistence)
- [x] FOUC (flash of unstyled content) prevention
- [x] Chart.js theme-aware colors via `cssVar` helper
- [x] New file: `src/dashboard/theme-toggle.ts`
- [x] **v3.4.0**: Expanded to 5 themes (orange/forest/rose/sky/lavender) in `src/dashboard/theme-config.ts` + `src/styles/themes.css`
- [x] Theme dropdown UI in header

**Incremental Data Fetch:**
- [x] In-place data refresh (append new orders to existing data)
- [x] Cache merge by orderId (prevent duplicates)
- [x] No page reload required
- [x] New file: `src/dashboard/incremental-fetch.ts`

**Enhanced Export:**
- [x] CSV export (UTF-8 BOM, proper encoding)
- [x] PDF export (`window.print()` integration)
- [x] Export format dropdown UI selector
- [x] Updated `export.ts` module (now uses ExcelJS)

**Utilities & Testing:**
- [x] `showToast()` notification utility
- [x] 64 total tests (33 new for Phase 2)

---

## Phase 3: Advanced Analytics — Complete (v3.1.0)

**Status:** ✅ COMPLETED (2026-03-06)

### Completed Features

**Heatmap:**
- [x] GitHub-style 52-week SVG calendar (`heatmap.ts`)
- [x] Show order count per day
- [x] Filter by selected year (`filterYear` dropdown)
- [x] Day labels on Y axis (Mon, Wed, Fri)
- [x] English month names on X axis (Jan, Feb, Mar…)

**Categories:**
- [x] Keyword-based product categorization (12 buckets + "Khác")
- [x] Vietnamese + English keyword support
- [x] Word-boundary regex matching (bug fix in v3.4.0)
- [x] Doughnut chart visualization
- [x] Expanded categories and keywords (v3.4.0)

**Date Range Picker:**
- [x] Custom date range picker component (`date-range-picker.ts`)
- [x] Preset buttons: Last 7 days, This month, Last month, 3 months, This year, Custom
- [x] Custom date input panel (from/to)
- [x] Date picker CSS styles
- [x] Integration with filter logic
- [x] Click-to-toggle preset selection (v3.4.0)

**Spending Predictions:**
- [x] Linear regression for monthly trend (`predictions.ts`)
- [x] Next-month forecast display
- [x] Visual trend line on chart

**Shop Loyalty:**
- [x] Order count by shop tracking (`shop-loyalty.ts`)
- [x] Top shops by order count
- [x] Loyalty tier calculation (VIP, Regular, New)
- [x] Repeat rate metric

**Auto Insights:**
- [x] Max-5 auto-generated insight cards (`insights.ts`)

**Budget Tracking:**
- [x] Progress ring + threshold toast (`budget.ts`)

**Multi-Domain Support (v3.4.0):**
- [x] `src/config.ts` with `DOMAINS` (vn/id/th/ph/my/sg/tw)
- [x] `manifest.json` `host_permissions` for all 7 domains
- [x] Runtime domain switching via `setActiveDomain()` / `getActiveDomain()`
- [x] Centralized URL helpers: `getApiBaseUrl`, `getOrderUrl`, `getPurchaseUrl`, `getLoginUrl`, `getHomeUrl`
- [x] Unified `STORAGE_KEYS` with `shopeestatx-*` prefix
- [x] Unified `EVENTS` with `shopeestatx:*` prefix

### Remaining Tasks (deferred to Phase 5/6)
- [ ] Category manual override UI (user can correct category)
- [ ] Product-level analytics (most purchased items)

---

## Phase 4: Global — Complete (v3.1.0)

**Status:** ✅ COMPLETED (2026-03-06)

### Phase 4 Deliverables

**i18n (Internationalization):**
- [x] Core i18n module (`src/i18n/index.ts`) with `t()`, `initLocale()`
- [x] Locale-aware formatting (`src/i18n/format.ts`)
- [x] Vietnamese locale (`src/i18n/locales/vi.json`) — ~100 translation keys, 8.4KB
- [x] Apply i18n to all modules: `comparison.ts`, `table.ts`, `charts.ts`, `filters.ts`, `insights.ts`, `export.ts`
- [x] i18n for popup.html and welcome.html
- [x] **v3.4.0**: Vietnamese-only — `en.json` removed, `setLocale()` / `getLocale()` API removed
- [x] **v3.4.0**: Language switcher UI removed from results header
- [x] **v3.4.0**: Theme names now Vietnamese only (`nameVi`)

**Date Range Picker:** (see Phase 3 — grouped here for cohesion)

**Testing & Version:**
- [x] 7 spec files in `tests/` (categories, content-parser, export, filters, predictions, theme-toggle, utils)
- [x] Version bumps tracked in `package.json` + `src/manifest.json`

---

## Version 3.4.0: Consolidated Release — Complete (2026-06-01)

**Status:** ✅ COMPLETED

### v3.4.0 Highlights

**Centralized Config** (closes prior `[3.2.0] - TBD` hardcode-detection entry)
- [x] `src/config.ts` with `DOMAINS`, `STORAGE_KEYS`, `EVENTS` constants
- [x] URL helpers (`getApiBaseUrl`, `getOrderUrl`, `getPurchaseUrl`, `getLoginUrl`, `getHomeUrl`)
- [x] Multi-domain support (vn / id / th / ph / my / sg / tw)
- [x] Unified `STORAGE_KEYS` (`shopeestatx-*` prefix)
- [x] Unified `EVENTS` (`shopeestatx:*` prefix)
- [x] `manifest.json` `host_permissions` updated for all 7 domains

**Vietnamese-Only i18n**
- [x] Removed `src/i18n/locales/en.json`
- [x] Removed `setLocale()` / `getLocale()` exports from `src/i18n/index.ts`
- [x] Hardcoded `vi-VN` locale in `src/i18n/format.ts`
- [x] Removed `LANGUAGE` key from `src/config.ts`
- [x] Removed language switcher UI from results header
- [x] Theme names Vietnamese only (`nameVi`)

**Collapsible Toolbar**
- [x] Semantic `toolbar-container` layout
- [x] Search + date picker always visible on primary row
- [x] Status/Category filters in expandable "More filters" panel
- [x] Mobile: collapsible behavior
- [x] New CSS classes: `toolbar-container`, `toolbar-row`, `search-row`, `filters-row`, `more-filters-panel`, `btn-more-filters`
- [x] Filter count badge on "More filters" button
- [x] `aria-expanded` + `aria-controls` for a11y
- [x] Active filter chips moved into toolbar

**Popup Greeting**
- [x] Avatar + name welcome message in popup
- [x] Domain check + "Bắt đầu" button clearer enable/disable states

**Order Detail Polish**
- [x] Clickable order ID link (opens Shopee order page)
- [x] Order detail expand icon (chevron) for clearer affordance
- [x] Two-column layout (info + product details aligned)
- [x] Aligned order info and product details in same rows
- [x] Removed duplicate header line, added card style, fixed text wrap
- [x] Removed `orderDate` and `daysToDeliver` from order detail (refactor)

**Security Hardening** (rolled in from 3.3.0)
- [x] `escapeHtml()` utility applied across `filters.ts`, `insights.ts`, `budget.ts`, `shop-loyalty.ts`, `table.ts`
- [x] `content_security_policy` in `manifest.json`
- [x] `destroyAllCharts()` cleanup on `beforeunload`
- [x] aria-labels on all dropdown elements
- [x] try-catch blocks in `data.ts`, `budget.ts`
- [x] `prefers-reduced-motion` rules in `src/popup/popup.css:590` + `src/styles/states.css:32` (partial coverage)

**Categories & Theme Polish**
- [x] Word-boundary regex fix in `categorizeOrder` (no more "fashion" matching "fashionable")
- [x] Expanded categories and keywords for product classification
- [x] User avatar display with floating style
- [x] Status badge accessibility and consistency fixes
- [x] Orange theme heatmap-0 updated to match theme color
- [x] All themes unified to neutral gray background colors
- [x] Pending and returned colors added to all themes

**Documentation**
- [x] README rewritten to reflect current TypeScript + Vite stack
- [x] Stale "xlsx" references replaced with "exceljs"

---

## Distribution & Release

- [x] Chrome Web Store submission — **v3.4.0** is the current release
- [ ] Firefox extension port — deferred to Phase 5/6
- [x] Auto-update via Chrome Web Store

---

## Architecture Stability

Module boundaries remain stable and type-safe through v3.4.0:

| Module | Responsibility | Status |
|--------|---------------|--------|
| `types/index.ts` | Type definitions (`StatusCode`, `Order`, `OrderData`, `AppState`, `DateRange`, `UserProfile`, `ShopMetric`, `SortDirection`) | Stable |
| `state.ts` | Shared state singleton (`AppState`) | Stable |
| `data.ts` | Fetch + cache | Stable |
| `filters.ts` | Filter/sort/search logic | Stable |
| `table.ts` | Table render + pagination | Stable |
| `charts.ts` | Chart.js integration (bar + doughnut) | Stable |
| `comparison.ts` | Summary cards + MoM/YoY/avg | Stable |
| `export.ts` | ExcelJS + CSV + PDF | Updated v3.4.0 |
| `theme-toggle.ts` | Theme dropdown + FOUC-safe init | Updated v3.4.0 |
| `theme-config.ts` | 5 theme definitions | New v3.4.0 |
| `incremental-fetch.ts` | In-place data refresh | Stable |
| `utils.ts` | Formatting + toast + escape | Updated v3.4.0 |
| `results.ts` | Orchestrator + DOM wiring | Stable |
| `content.js` | MAIN world API fetcher (IIFE) | Stable |
| `bridge.ts` | ISOLATED world relay | Stable |
| `popup.ts` | Extension popup (avatar+name greeting) | Updated v3.4.0 |
| `welcome.ts` | Onboarding logic | Stable |
| `background.ts` | MV3 service worker | Stable |
| `config.ts` | Centralized DOMAINS, STORAGE_KEYS, EVENTS, URL helpers | New v3.4.0 |
| `i18n/index.ts` | Translation (`t`, `initLocale` only) | Updated v3.4.0 |
| `i18n/format.ts` | Locale-aware formatting (vi-VN locked) | Updated v3.4.0 |
| `date-range-picker.ts` | Date range picker (presets + custom) | Stable |
| `heatmap.ts` | 52-week SVG calendar | Stable |
| `categories.ts` | 12-bucket keyword classifier | Updated v3.4.0 |
| `predictions.ts` | Linear extrapolation forecast | Stable |
| `shop-loyalty.ts` | Repeat rate, loyalty tier | Stable |
| `insights.ts` | Max-5 auto insights | Stable |
| `budget.ts` | Progress ring + threshold toast | Stable |

---

## Phase 5/6: Future (Ideas Only)

Listed for awareness, **not committed**. Prioritization deferred until v3.4.x is stable in production.

- Firefox port (WebExtension MV3 differences in `chrome.scripting` API)
- Safari port (WebExtension API differences, requires Xcode toolchain)
- Dark theme (5 colored themes exist; no `prefers-color-scheme` support yet)
- Full `prefers-reduced-motion` coverage (currently partial: `popup.css:590`, `states.css:32`)
- Multi-account support (currently single Shopee session per install)
- Product-level analytics (most-purchased items, frequently bought together)
- Category manual override UI
- Real-time sync between devices (would require server — out of scope)
- English UI restore (currently vi-only)
- Custom budget period (monthly/weekly/quarterly)
- Spending goals with notifications
- CSV column customization for export
- Historical snapshot comparison (compare this month vs same month last year)
- **Tech debt cleanup**: migrate icons from `_legacy-shopeestatx/icons/` to a proper `icons/` directory at project root; remove `_legacy-shopeestatx/` folder entirely
- **Tech debt cleanup**: refactor 6 dashboard modules over 200 LOC (`categories.ts:316`, `results.ts:311`, `charts.ts:253`, `filters.ts:252`, `table.ts:225`, `date-range-picker.ts:222`) — current 200 LOC guideline is aspirational; new code should target the limit
