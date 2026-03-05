# Code Standards

## General Principles

- **YAGNI / KISS / DRY** — no over-engineering, no speculative code
- **No build step** — vanilla JS, ES modules, no transpilation
- **No external CDN** — third-party libs vendored locally (chart.min.js, xlsx.min.js)
- **File size limit** — keep source files under 200 LOC; split when exceeded

## JavaScript

### Module System
- All source files use ES module syntax (`import`/`export`)
- Entry point: `results.html` loads `results.js` with `type="module"`
- Vendored libs (Chart.js, SheetJS) loaded via `<script src>` before the module

### Naming
- Files: kebab-case (`mock-data.js`, `background.js`)
- Functions: camelCase (`applyFilters`, `renderCurrentPage`)
- Constants/state fields: camelCase (`allOrdersData`, `filteredOrders`)
- DOM IDs: camelCase (`filterYear`, `btnExport`, `loadingText`)

### State
- All mutable shared state lives in `state.js` as a single exported object
- Modules import `state` and mutate fields directly — no getter/setter indirection
- `results.js` may hold ephemeral orchestrator-only state (e.g. `searchTimeout`)

### Error Handling
- Wrap async operations in try/catch
- On fetch error: hide loading, show `#noData` with error message
- Use `console.error()` for unexpected errors

### Comments
- File-level comment: `// ShopeeStatX/filename.js — purpose`
- Comment non-obvious logic; skip trivial code
- Mark API structure differences with inline comments (NEW API / OLD API)

## HTML

- Semantic elements where appropriate (`<th>`, `<section>`, etc.)
- All interactive elements have IDs matching `results.js` references
- No inline styles — use CSS classes or CSS variables

## CSS

- All design tokens as CSS custom properties on `:root` (`results.css:9-58`)
- Primary color: `#ee4d2d` (Shopee orange)
- Class naming: lowercase kebab (`.filter-chips`, `.summary-card`)
- Animations defined as `@keyframes`, applied via class
- Responsive: 3 breakpoints — mobile `768px`, tablet `1024px`, desktop

## Chrome Extension

- Manifest V3 only — no MV2 patterns
- Minimum permissions: `activeTab`, `storage`, `scripting`
- Host permission scoped to `https://shopee.vn/*`
- Service worker (`background.js`) kept minimal
- No `eval()`, no remote code execution

## Data Integrity

- Cancelled (statusCode 4) and returned (statusCode 12) orders: `subTotal = 0`, excluded from spend
- Order date uses `shipping.tracking_info.ctime` → fallback `status.update_time` → fallback order_id timestamp
- Future timestamps from order_id fallback are rejected
- Orders without `infoCard` or `orderCard` are skipped silently

## File Organization

```
ShopeeStatX/           # All extension source (loaded by Chrome)
Documents/             # User-facing guides (Vietnamese + English)
Screenshots/           # README images
docs/                  # Developer documentation (this directory)
plans/                 # Implementation plans and reports
```

## Dev Workflow

```bash
npm run dev            # python -m http.server 3000 --directory ShopeeStatX
# Open: http://localhost:3000/results.html
# Uses mock-data.js automatically (isExtensionContext() = false)
```

No lint config, no test framework, no CI pipeline currently.
