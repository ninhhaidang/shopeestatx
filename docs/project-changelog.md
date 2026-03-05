# Project Changelog

All notable changes to ShopeeStatX are documented here.

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
| 2.6.0 | 2026-03-05 | Stable | Dark mode, incremental fetch, enhanced export |
| 2.5.0 | 2026-03-01 | Stable | Build system & TypeScript migration |
