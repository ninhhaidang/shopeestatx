# System Architecture

## Overview

ShopeeStatX is a Chrome Extension MV3 with no backend. All logic runs in the browser.

## Dual-World Pattern

Chrome Extensions run in ISOLATED world by default — cannot access page cookies.
ShopeeStatX bypasses this legally via the Dual-World Pattern:

```
popup.js
  └── opens results.html?fetch=true
        └── results.js (ES module orchestrator)
              ├── injects bridge.js → ISOLATED world (relay)
              └── injects content.js → MAIN world (fetches Shopee API with cookies)
                    └── postMessage → bridge.js → chrome.runtime.sendMessage → results.js
```

## Module Map

```
ShopeeStatX/
├── manifest.json        # MV3 config: permissions, host_permissions, service_worker
├── background.js        # Service worker (minimal — message relay only)
├── popup.html/js/css    # Extension popup UI (~30 lines logic)
├── results.html         # Dashboard shell (236 lines)
├── results.css          # Design system + responsive layout (1467 lines)
├── results.js           # ES module orchestrator — DOM wiring only (123 lines)
├── state.js             # Shared mutable state singleton (29 lines)
├── data.js              # Fetch, cache, storage, mock data (144 lines)
├── filters.js           # Filter/sort/search logic (193 lines)
├── table.js             # Table render + pagination (195 lines)
├── charts.js            # Chart.js bar + pie rendering (242 lines)
├── comparison.js        # Summary cards + time comparison (98 lines)
├── export.js            # SheetJS Excel export (39 lines)
├── utils.js             # formatVND, escapeHtml (16 lines)
├── mock-data.js         # Static demo data for localhost preview (142 lines)
├── content.js           # MAIN world — Shopee API fetch (216 lines)
├── bridge.js            # ISOLATED world — message relay
├── chart.min.js         # Chart.js vendored
└── xlsx.min.js          # SheetJS vendored
```

## Data Flow

```
User clicks "Bat dau phan tich"
  → popup.js stores shopeeTabId in chrome.storage.local
  → opens results.html?fetch=true
    → data.js::fetchDataFromShopee()
      → executeScript(bridge.js, ISOLATED)
      → executeScript(content.js, MAIN)
        → loops GET /api/v4/order/get_all_order_and_checkout_list?offset=N&limit=20
        → postMessage progress updates (MAIN → ISOLATED → runtime)
        → returns allOrders[]
      → cache to chrome.storage.local {shopeeStats: {..., cachedAt}}
      → state.allOrdersData = data
      → initializeUI() → applyFilters() → renderCharts() + renderCurrentPage()
```

## State Management

Single shared object in `state.js`:

| Field | Type | Purpose |
|-------|------|---------|
| allOrdersData | object | Raw fetched/cached data |
| filteredOrders | array | After active filters |
| currentPage | number | Pagination cursor |
| itemsPerPage | number | 20/50/100/Infinity |
| selectedDay | number\|null | Drill-down day filter |
| shopCount | number | Top N shops in pie chart |
| shopMetric | string | 'amount' or 'count' |
| currentSort | object | {field, direction} |

## API

- Endpoint: `https://shopee.vn/api/v4/order/get_all_order_and_checkout_list`
- Auth: browser session cookies (automatic via MAIN world)
- Pagination: `offset` + `limit=20`, loop until empty response
- Two API structures supported:
  - **New (2024+)**: `new_data.order_or_checkout_data[].order_list_detail`
  - **Old (fallback)**: `data.order_data.details_list[]`

## Caching

- Storage: `chrome.storage.local` key `shopeeStats`
- Shape: `{ orders[], totalCount, totalAmount, fetchedAt, cachedAt }`
- Invalidation: manual refresh only (user presses R or Refresh button)
- Age display: "Vua xong / X phut truoc / X gio truoc / X ngay truoc"

## Demo Mode

When `isExtensionContext()` returns false (running via `python -m http.server`):
- Loads `mock-data.js` instead of calling Shopee API
- Enables UI development/preview without extension installation
