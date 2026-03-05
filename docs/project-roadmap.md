# Project Roadmap

## Current Version: 2.1

### Completed

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
- [x] Demo mode (mock data for localhost preview)
- [x] Modular ES module architecture (refactored from monolith)
- [x] Status badge redesign (7 status types with color coding)

### Potential Future Work

- [ ] Date range filter (custom from/to)
- [ ] Category/tag analysis
- [ ] Seller comparison across time periods
- [ ] Export to CSV option
- [ ] Dark mode toggle
- [ ] Chrome Web Store publication
- [ ] Firefox extension port
- [ ] Product-level analytics (most purchased items)
- [ ] Spending forecast / trend line

## Architecture Stability

The codebase was recently refactored from a monolithic `results.js` (~1000 lines) into focused ES modules. The current module boundaries are stable:

| Module | Responsibility | Status |
|--------|---------------|--------|
| state.js | Shared state | Stable |
| data.js | Fetch + cache | Stable |
| filters.js | Filter/sort/search | Stable |
| table.js | Table render | Stable |
| charts.js | Chart render | Stable |
| comparison.js | Summary cards | Stable |
| export.js | Excel export | Stable |
| utils.js | Formatting helpers | Stable |
| results.js | Orchestrator | Stable |
