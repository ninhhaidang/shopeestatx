# Project Roadmap

## Current Version: 2.5.0

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

## Phase 2: Enhanced Analytics (Backlog)

**Priority:** Medium | **Target:** Q2 2026

- [ ] Date range filter (custom from/to)
- [ ] Category/tag analysis
- [ ] Seller comparison across time periods
- [ ] Export to CSV option
- [ ] Dark mode toggle
- [ ] Product-level analytics (most purchased items)
- [ ] Spending forecast / trend line

## Distribution & Release

- [ ] Chrome Web Store submission (v2.5.0 — target Q1 2026)
- [ ] Firefox extension port (Phase 3)
- [ ] Auto-update via Chrome Web Store

## Architecture Stability

After Phase 1 (Vite + TypeScript migration), the module boundaries are stable and type-safe:

| Module | Responsibility | Status |
|--------|---------------|--------|
| types/index.ts | Type definitions | Stable |
| state.ts | Shared state singleton | Stable |
| data.ts | Fetch + cache | Stable |
| filters.ts | Filter/sort/search logic | Stable |
| table.ts | Table render + pagination | Stable |
| charts.ts | Chart.js integration | Stable |
| comparison.ts | Summary cards + metrics | Stable |
| export.ts | SheetJS Excel export | Stable |
| utils.ts | Formatting helpers | Stable |
| results.ts | Orchestrator + DOM wiring | Stable |
| content.js | MAIN world API fetcher | Stable |
| bridge.ts | ISOLATED world relay | Stable |
| popup.ts | Extension popup logic | Stable |
| welcome.ts | Onboarding logic | Stable |
| background.ts | MV3 service worker | Stable |
