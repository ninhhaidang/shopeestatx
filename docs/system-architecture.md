# System Architecture

## Overview

ShopeeStatX is a Chrome Extension MV3 (v2.5.0) built with TypeScript + Vite, with zero backend. All logic runs in the browser.

## Build Pipeline

```
src/ (TypeScript)
  → Vite 6.0 (dev: npm run dev | build: npm run build)
    → TypeScript strict type check
    → Multi-entry rollupOptions (results, popup, welcome, background)
    → dist/ (bundled JS)
  → Vitest 3.0 + jsdom (npm test)
    → 31 tests covering dashboard, filters, data, charts
    → Coverage via @vitest/coverage-v8
  → GitHub Actions CI (on push)
    → TypeScript check, build, tests
```

## Dual-World Pattern

Chrome Extensions run in ISOLATED world by default — cannot access page cookies.
ShopeeStatX bypasses this legally via the Dual-World Pattern:

```
popup.ts
  └── opens results.html?fetch=true
        └── results.ts (TypeScript orchestrator)
              ├── injects bridge.ts → ISOLATED world (relay)
              └── injects content.js → MAIN world (API fetcher, IIFE)
                    └── postMessage → bridge.ts → chrome.runtime.sendMessage → results.ts
```

## Module Structure

```
dist/ (built extension)
├── manifest.json              # MV3config: permissions, service_worker
├── results.html / results.js  # Dashboard (compiled from src/dashboard/)
├── popup.html / popup.js      # Extension popup (compiled from src/popup/)
├── welcome.html / welcome.js  # Onboarding (compiled from src/welcome/)
├── background.js              # Service worker (compiled from src/background.ts)
├── bridge.js                  # Message relay (compiled from src/bridge/bridge.ts)
├── content.js                 # API fetcher (src/content/content.js, IIFE, not bundled)
├── styles/                    # CSS modules
│   ├── results.css
│   ├── popup.css
│   ├── welcome.css
│   └── shared.css
└── icons/                     # Extension icons
```

## Data Flow

### Extension Startup (First Install)
```
User installs extension
  → background.ts::chrome.runtime.onInstalled (reason === 'install')
    → chrome.tabs.create(welcome.html)
      → Displays onboarding info + links to results/privacy
      → User clicks "Start Analysis" or closes
```

### Analytics Flow
```
User clicks "Bat dau phan tich"
  → popup.ts stores shopeeTabId in chrome.storage.local
  → opens results.html?fetch=true
    → results.ts initializes UI
    → data.ts::fetchDataFromShopee()
      → chrome.scripting.executeScript(bridge.ts, ISOLATED)
      → chrome.scripting.executeScript(content.js, MAIN)
        → loops GET /api/v4/order/get_all_order_and_checkout_list?offset=N&limit=20
        → postMessage progress updates (MAIN → ISOLATED → runtime)
        → returns allOrders[]
      → cache to chrome.storage.local {shopeeStats: {..., cachedAt}}
      → state.allOrdersData = data
      → initializeUI() → applyFilters() → renderCharts() + renderCurrentPage()
```

## State Management

Single shared state object in `state.ts` (TypeScript):

| Field | Type | Purpose |
|-------|------|---------|
| allOrdersData | ShopeeData | Raw fetched/cached data |
| filteredOrders | Order[] | After active filters |
| currentPage | number | Pagination cursor |
| itemsPerPage | number | 20/50/100/Infinity |
| selectedDay | number\|null | Drill-down day filter |
| shopCount | number | Top N shops in pie chart |
| shopMetric | string | 'amount' or 'count' |
| currentSort | Sort | {field, direction} |

(See `src/types/index.ts` for TypeScript interfaces)

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

When `isExtensionContext()` returns false (running via Vite dev server):
- Loads `mock-data.ts` instead of calling Shopee API
- Enables UI development/preview without extension installation

## Testing Strategy

- **Unit tests**: Individual functions (formatVND, filters, utils)
- **Integration tests**: Dashboard initialization, data flow, state mutations
- **Test runner**: Vitest with jsdom (no real DOM)
- **Coverage**: @vitest/coverage-v8
- **CI**: Automated on every push via GitHub Actions
