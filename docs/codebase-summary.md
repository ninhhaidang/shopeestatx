# Codebase Summary

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Chrome Extension MV3 | Service Worker model |
| Language | TypeScript + IIFE JavaScript | Strict mode, zero `any` types |
| Build System | Vite 6.0 | `root: 'src'`, custom `copy-extension-files` plugin |
| Charts | Chart.js 4.4.7 | npm dependency |
| Export | ExcelJS 4.4.0 | npm dependency (replaces xlsx) |
| i18n | Single Vietnamese locale | en.json removed (see v3.4.0 changelog) |
| Testing | Vitest 3.0 + jsdom | 7 spec files in `tests/` at project root |
| Type Checking | TypeScript strict | `noUnusedLocals` + `noUnusedParameters` enforced |
| Storage | chrome.storage.local | Cache only, key `shopeestatx-stats` |
| CI/CD | GitHub Actions | Build, test, typecheck on push |

## Project Structure

```
shopeestatx/
├── vite.config.ts                    # Vite config (root: 'src', copy-extension-files plugin)
├── tsconfig.json                     # strict + noUnusedLocals + noUnusedParameters
├── vitest.config.ts                  # Test runner config
├── package.json                      # v3.4.0 (source of truth)
├── tests/                            # Test specs (NOT colocated)
│   ├── setup.ts
│   ├── categories.test.ts
│   ├── content-parser.test.ts
│   ├── export.test.ts
│   ├── filters.test.ts
│   ├── predictions.test.ts
│   ├── theme-toggle.test.ts
│   └── utils.test.ts
├── _legacy-shopeestatx/icons/        # Legacy icon assets (still read by Vite plugin)
└── src/
    ├── manifest.json                 # MV3 config
    ├── background.ts                 # MV3 service worker (minimal)
    ├── config.ts                     # DOMAINS, STORAGE_KEYS, EVENTS, URL helpers
    ├── privacy.html                  # In-extension privacy policy
    ├── bridge/
    │   └── bridge.ts                 # ISOLATED world message relay
    ├── content/
    │   └── content.js                # MAIN world API fetcher (IIFE, not bundled)
    ├── dashboard/                    # Dashboard UI (22 .ts modules)
    │   ├── results.ts                # Orchestrator, DOM wiring (311 LOC)
    │   ├── results.html              # Dashboard shell
    │   ├── results.css               # Aggregator @imports styles/*.css
    │   ├── state.ts                  # AppState singleton
    │   ├── data.ts                   # Fetch with progress events
    │   ├── filters.ts                # Year/month/status/search + chips
    │   ├── date-range-picker.ts      # Presets + custom range
    │   ├── incremental-fetch.ts      # Cache merge by orderId
    │   ├── charts.ts                 # Bar + doughnut, drill-down
    │   ├── comparison.ts             # MoM/YoY/avg cards
    │   ├── table.ts                  # Sortable, expandable, clickable filters
    │   ├── export.ts                 # ExcelJS, CSV BOM, PDF print
    │   ├── theme-config.ts           # 5 themes (orange/forest/rose/sky/lavender)
    │   ├── theme-toggle.ts           # Dropdown, FOUC-safe init
    │   ├── categories.ts             # 12-bucket keyword classifier (316 LOC)
    │   ├── heatmap.ts                # 52-week SVG calendar
    │   ├── shop-loyalty.ts           # Repeat rate, loyalty tier
    │   ├── insights.ts               # Max-5 auto insights
    │   ├── predictions.ts            # Linear extrapolation
    │   ├── budget.ts                 # Progress ring + threshold toast
    │   ├── utils.ts                  # formatCurrency, escapeHtml, showToast
    │   ├── icons.ts                  # Heroicons SVG strings
    │   └── mock-data.ts              # Dev preview data
    ├── i18n/
    │   ├── index.ts                  # t(), applyTranslations, initLocale (vi only)
    │   ├── format.ts                 # vi-VN / VND locked
    │   └── locales/vi.json           # 8.4KB, ~100 keys
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.ts                  # Avatar+name greeting, domain check, Bắt đầu button
    ├── welcome/
    │   ├── welcome.html
    │   ├── welcome.css
    │   └── welcome.ts                # First-install onboarding
    ├── styles/                       # 11 CSS files (modular)
    │   ├── variables.css             # Base tokens (Shopee orange palette)
    │   ├── themes.css                # 5 theme overrides (data-theme="…")
    │   ├── layout.css                # Page shell, header, sidebar
    │   ├── cards.css                 # Summary cards, info cards
    │   ├── charts.css                # Chart.js container styling
    │   ├── table.css                 # Data table, rows, pagination
    │   ├── filters.css               # Year/month/status/search controls
    │   ├── date-picker.css           # Date range picker UI
    │   ├── insights.css              # Insight cards, heatmap, loyalty
    │   ├── states.css                # Loading, empty, error states
    │   └── responsive.css            # Mobile/tablet breakpoints
    └── types/
        └── index.ts                  # StatusCode, Order, OrderData, AppState, DateRange…
```

## Build System

- **Vite 6.0**: Fast builds with `root: 'src'`
- **Multi-entry rollupOptions**: results, popup, welcome, background, bridge
- **Custom `copy-extension-files` plugin** in `vite.config.ts`:
  - Writes `manifest.json` to dist
  - Copies `src/content/content.js` (IIFE, MAIN world, not bundled)
  - Copies `src/privacy.html`
  - Copies icon assets from `_legacy-shopeestatx/icons/` (16/48/128)
- **TypeScript strict + noUnusedLocals + noUnusedParameters**: pre-build validation
- **CSS**: 11 files in `src/styles/` + `src/dashboard/results.css` aggregator that `@import`s them
- **content.js**: IIFE, never bundled (Chrome MAIN world requirement)

## Module Dependency Map

```
results.ts (orchestrator)
  ├── state.ts (singleton AppState)
  ├── utils.ts (formatCurrency, escapeHtml, showToast)
  ├── config.ts (DOMAINS, STORAGE_KEYS, EVENTS)
  ├── i18n/index.ts (t(), initLocale)
  ├── data.ts → state, filters, types, config
  ├── filters.ts → state, utils, charts, table, comparison, i18n
  ├── date-range-picker.ts → state, filters, i18n
  ├── incremental-fetch.ts → state, utils
  ├── charts.ts → state, utils, types
  ├── comparison.ts → state, utils, i18n
  ├── table.ts → state, utils, filters, i18n
  ├── export.ts → state, utils, i18n, ExcelJS
  ├── theme-config.ts → 5 theme definitions
  ├── theme-toggle.ts → theme-config, state
  ├── categories.ts → keyword-based 12-bucket classifier
  ├── heatmap.ts → state, filters, SVG render
  ├── shop-loyalty.ts → state, types
  ├── insights.ts → state, i18n, max-5 cards
  ├── predictions.ts → linear extrapolation, state
  ├── budget.ts → state, progress ring, toast
  └── icons.ts → Heroicons SVG strings

popup.ts → config, chrome.tabs.create
welcome.ts → config
background.ts → chrome.runtime.onInstalled
bridge.ts → chrome.runtime.sendMessage (ISOLATED relay)
content.js → fetch(API), postMessage (MAIN, IIFE)
```

## Entry Points & Build

| Context | Source | Built To |
|---------|--------|----------|
| Dashboard | `src/dashboard/results.ts` | `dist/results.js` (asset hash) |
| Popup | `src/popup/popup.ts` | `dist/popup.js` (asset hash) |
| Welcome | `src/welcome/welcome.ts` | `dist/welcome.js` (asset hash) |
| Background | `src/background.ts` | `dist/background.js` (root) |
| Bridge | `src/bridge/bridge.ts` | `dist/bridge.js` (root) |
| API Fetcher | `src/content/content.js` | `dist/content.js` (copied, not bundled) |
| Dev preview | `npm run dev` (Vite dev server) | `localhost:5173` |

## Key Features (shipped through v3.4.0)

### Core Analytics
- Summary cards: total orders, total spend, avg per order
- MoM/YoY/avg time comparison
- Bar chart (monthly/daily) + doughnut (top shops), drill-down click-through
- Heatmap: 52-week SVG calendar, order count, year filter
- Smart filters: year, month, status, text search, filter chips
- Sortable table: all columns, expandable rows, click-to-filter values
- Pagination: 20/50/100/all
- Excel export (ExcelJS), CSV (UTF-8 BOM), PDF (window.print())
- Keyboard shortcuts: `/` search, `Esc` clear, `R` refresh
- Cache: `chrome.storage.local` with age display
- Demo mode: mock data when running outside extension (localhost)

### Advanced Analytics (v3.x)
- **Heatmap** (`heatmap.ts`): 52-week calendar, year filter
- **Categories** (`categories.ts`): 12-bucket keyword classifier with word-boundary regex
- **Predictions** (`predictions.ts`): Linear extrapolation for next-month forecast
- **Shop loyalty** (`shop-loyalty.ts`): 3+ orders threshold, repeat rate
- **Auto insights** (`insights.ts`): Max-5 auto-generated cards
- **Budget tracking** (`budget.ts`): Progress ring + threshold toast
- **Date range picker** (`date-range-picker.ts`): Presets + custom range
- **Incremental fetch** (`incremental-fetch.ts`): Cache merge by orderId, no reload

### UX & Theme
- **5 themes** (`theme-config.ts`): orange (Cam), forest (Rừng), rose (Hồng), sky (Trời Xanh), lavender (Oải Hương)
- Theme dropdown (`theme-toggle.ts`) with FOUC-safe init
- Theme persistence via `localStorage` under `STORAGE_KEYS.THEME`
- Collapsible toolbar: search + date always visible, secondary filters in expandable panel
- Mobile responsive (3 breakpoints: 768/1024/desktop)

### Multi-Market & i18n
- **Multi-domain** (`config.ts`): 7 Shopee sites (vn/id/th/ph/my/sg/tw)
- **Vietnamese-only i18n** (rolled into v3.4.0): `en.json` removed, `vi.json` only
- Locale-aware formatting (vi-VN / VND) locked in `i18n/format.ts`

### Popup & Onboarding
- **Popup greeting**: avatar + name welcome message
- Domain check: Bắt đầu button disabled when not on supported Shopee site
- First-install welcome page with privacy + start analysis links

## Key Patterns

- **TypeScript strict mode**: Zero `any` types, full type safety
- **ES modules**: Compiled by Vite; HTML files load bundled JS as module
- **State singleton**: All modules import `state` and mutate directly
- **Dual-world injection**: `content.js` (MAIN) + `bridge.ts` (ISOLATED) for cookie access
- **Demo mode**: `isExtensionContext()` check enables localhost development
- **Centralized config**: All hardcoded values in `src/config.ts`
- **No vendor code**: All dependencies via npm

## Version

Current: **3.4.0** (per `package.json` + `src/manifest.json`)
