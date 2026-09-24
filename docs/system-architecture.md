# System Architecture

## Overview

ShopeeStatX is a Chrome Extension MV3 (v3.4.0) built with TypeScript + Vite, with zero backend. All logic runs in the browser. 7 Shopee marketplaces supported (vn/id/th/ph/my/sg/tw) via `config.ts` `DOMAINS`.

## Build Pipeline

```
src/ (TypeScript, root per vite.config.ts)
  → Vite 6.0 (dev: npm run dev | build: npm run build)
    → TypeScript strict + noUnusedLocals + noUnusedParameters
    → Multi-entry rollupOptions (results, popup, welcome, background, bridge)
    → Custom copy-extension-files plugin (manifest.json, content.js, privacy.html, icons)
    → dist/ (bundled JS, hashed assets)
  → Vitest 3.0 + jsdom (npm test)
    → 7 spec files in tests/ (categories, content-parser, export, filters, predictions, theme-toggle, utils)
    → Coverage via @vitest/coverage-v8
  → GitHub Actions CI (on push)
    → TypeScript check, build, tests
```

## Dual-World Pattern

Chrome Extensions run in ISOLATED world by default — cannot access page cookies. ShopeeStatX bypasses this legally via the Dual-World Pattern:

```
popup.ts
  └── opens results.html?fetch=true (chrome.tabs.create)
        └── results.ts (TypeScript orchestrator)
              ├── chrome.scripting.executeScript(bridge.ts → ISOLATED world relay)
              ├── chrome.scripting.executeScript(content.js → MAIN world IIFE)
              │     └── fetch(API) with browser session cookies
              │     └── postMessage(progress) → window
              │           │
              │           ▼
              └── bridge.ts (ISOLATED) listens for window.message
                    └── chrome.runtime.sendMessage → results.ts
                    └── results.ts renders UI
```

## UI Surfaces

| Surface | Entry | Purpose |
|---------|-------|---------|
| Popup | `src/popup/popup.{html,css,ts}` | Click-to-launch with avatar+name greeting, domain check, Bắt đầu button |
| Welcome | `src/welcome/welcome.{html,css,ts}` | First-install onboarding (chrome.runtime.onInstalled) |
| Dashboard | `src/dashboard/results.{html,css,ts}` | Main analytics view (22 .ts modules) |

## Module Structure

```
dist/ (built extension)
├── manifest.json              # MV3 config: permissions, service_worker, host_permissions
├── results.html / results.js  # Dashboard (compiled from src/dashboard/)
├── popup.html / popup.js      # Extension popup (compiled from src/popup/)
├── welcome.html / welcome.js  # Onboarding (compiled from src/welcome/)
├── background.js              # Service worker (compiled from src/background.ts)
├── bridge.js                  # Message relay (compiled from src/bridge/bridge.ts)
├── content.js                 # API fetcher (src/content/content.js, IIFE, not bundled)
├── privacy.html               # In-extension privacy policy
├── styles/                    # CSS modules (built from src/styles/ + results.css aggregator)
└── icons/                     # Extension icons (16/48/128, copied from _legacy-shopeestatx/icons/)
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

### Popup Launch
```
User clicks extension icon
  → popup.ts::checkCurrentTab()
    → if domain matches active DOMAINS key → enable "Bắt đầu" button
    → else → show domain warning, disable button
  → User clicks "Bắt đầu"
    → chrome.tabs.create(results.html?fetch=true)
```

### Analytics Flow
```
results.ts initializes
  → data.ts::fetchDataFromShopee()
    → chrome.scripting.executeScript(bridge.ts, ISOLATED)
    → chrome.scripting.executeScript(content.js, MAIN)
      → loops GET /api/v4/order/get_all_order_and_checkout_list?offset=N&limit=20
      → postMessage progress updates (MAIN → ISOLATED → runtime)
      → returns allOrders[]
    → cache to chrome.storage.local {shopeestatx-stats: {…, cachedAt}}
    → state.allOrdersData = data
    → initializeUI() → applyFilters() → renderCharts() + renderCurrentPage()
```

### Incremental Refresh
```
User presses R or clicks Refresh
  → incremental-fetch.ts::incrementalFetch()
    → fetch only orders with ctime > cachedAt
    → merge into existing data by orderId
    → update state + re-render
    → no page reload
```

## State Management

Single shared state object in `state.ts` (`AppState` interface in `types/index.ts`):

| Field | Type | Purpose |
|-------|------|---------|
| allOrdersData | OrderData | Raw fetched/cached data |
| filteredOrders | Order[] | After active filters |
| currentPage | number | Pagination cursor |
| itemsPerPage | number | 20/50/100/Infinity |
| selectedDay | number\|null | Drill-down day filter |
| shopCount | number | Top N shops in pie chart |
| shopMetric | ShopMetric | 'amount' / 'orders' / 'products' |
| currentSort | Sort | {field, direction} |
| dateRange | DateRange | Custom range from date-range-picker |

## API

- Endpoint: `https://{domain}/api/v4/order/get_all_order_and_checkout_list` (domain from `getApiBaseUrl()`)
- Auth: browser session cookies (automatic via MAIN world)
- Pagination: `offset` + `limit=20`, loop until empty response
- Two API structures supported:
  - **New (2024+)**: `new_data.order_or_checkout_data[].order_list_detail`
  - **Old (fallback)**: `data.order_data.details_list[]`

## Caching

- Storage: `chrome.storage.local` key `shopeestatx-stats` (from `STORAGE_KEYS.STATS`)
- Shape: `{ user, orders, totalCount, totalAmount, fetchedAt, cachedAt }`
- Invalidation: manual refresh only (user presses R or Refresh button)
- Age display: "Vua xong / X phut truoc / X gio truoc / X ngay truoc"

## Theme System

- 5 themes defined in `src/dashboard/theme-config.ts` and `src/styles/themes.css`
- Themes: `orange` (Cam), `forest` (Rừng), `rose` (Hồng), `sky` (Trời Xanh), `lavender` (Oải Hương)
- Each theme: 15 tokens (primaryColor/Light/Dark/Gradient, secondary, bgMain/Card/Sidebar, textPrimary/Secondary/Muted, borderColor, heatmap-0..4, 6 shadow tokens)
- Applied via `data-theme` attribute on `<html>`
- Persisted in `localStorage` under `STORAGE_KEYS.THEME`
- Background tokens (bg-main/card/sidebar) and status colors are identical across all 5 themes; only the primary ramp + shadow-glow varies
- **No dark theme exists** (no `prefers-color-scheme` media query)
- Theme toggle: `src/dashboard/theme-toggle.ts` dropdown with FOUC-safe init

## Internationalization (i18n)

- Single locale: `vi` (Vietnamese) — `en.json` removed (v3.4.0)
- `src/i18n/index.ts` exports `t()`, `applyTranslations()`, `initLocale()`
- `src/i18n/format.ts` hardcodes `vi-VN` + `VND` currency
- `src/i18n/locales/vi.json`: ~100 keys, 8.4KB
- No language switcher UI

## Demo Mode

When `isExtensionContext()` returns false (running via Vite dev server):
- Loads `mock-data.ts` instead of calling Shopee API
- Enables UI development/preview without extension installation

## Testing Strategy

- **Unit tests**: Individual functions (formatCurrency, filters, utils, categorizeOrder, predictions)
- **Integration tests**: Dashboard initialization, data flow, state mutations
- **Test runner**: Vitest with jsdom (no real DOM)
- **Spec location**: `tests/` at project root (not colocated with source)
- **Coverage**: @vitest/coverage-v8
- **CI**: Automated on every push via GitHub Actions
