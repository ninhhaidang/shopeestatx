# Codebase Summary

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Chrome Extension MV3 | Service Worker model |
| Language | Vanilla JavaScript (ES modules) | Zero build step |
| Charts | Chart.js (vendored) | chart.min.js |
| Export | SheetJS (vendored) | xlsx.min.js |
| Storage | chrome.storage.local | Cache only |
| Dev server | python -m http.server 3000 | Demo mode preview |

## File Inventory

### Core Extension Files

| File | LOC | Role |
|------|-----|------|
| results.css | 1467 | Full design system — CSS vars, animations, responsive |
| charts.js | 242 | Chart.js bar (monthly/daily) + pie (top shops) |
| content.js | 216 | MAIN world API fetcher — loops Shopee order API |
| results.html | 236 | Dashboard shell — all DOM structure |
| table.js | 195 | Table render, pagination, expandable rows |
| filters.js | 193 | Filter/sort/search, filter chip management |
| data.js | 144 | Fetch, storage, mock data, cache, UI init |
| mock-data.js | 142 | Static demo orders for localhost preview |
| popup.css | 370 | Popup UI styles |
| comparison.js | 98 | Summary cards + month/year comparison rendering |
| results.js | 123 | ES module orchestrator — DOM event wiring only |
| welcome.html | 155 | First-run onboarding page (shown on install) |
| privacy.html | 224 | In-extension privacy policy (linked from popup footer) |
| popup.js | 29 | Domain check + open results page + footer links |
| state.js | 29 | Shared state singleton |
| export.js | 39 | SheetJS Excel export |
| utils.js | 16 | formatVND, escapeHtml |
| welcome.css | 168 | Onboarding page styles |
| welcome.js | 18 | Onboarding page logic (close button, link handlers) |
| bridge.js | — | ISOLATED world message relay |
| background.js | — | MV3 service worker + onInstalled listener for welcome page |

### Config & Assets

| File | Purpose |
|------|---------|
| manifest.json | MV3 permissions, icons, service worker |
| icons/ | icon16/48/128.png |
| package.json | npm scripts (dev only) |

## Module Dependencies

```
results.js (orchestrator)
  ├── state.js
  ├── utils.js
  ├── comparison.js → state.js, utils.js
  ├── export.js → state.js, utils.js
  ├── charts.js → state.js
  ├── table.js → state.js, utils.js, filters.js
  ├── filters.js → state.js, utils.js, charts.js, table.js, comparison.js
  └── data.js → state.js, filters.js
```

## Key Patterns

- **ES modules**: `results.html` loads `results.js` as `type="module"`; all other JS files are ES module imports
- **Vendored libs**: Chart.js and SheetJS loaded via `<script src>` (not modules), not npm
- **State sharing**: All modules import the same `state` object from `state.js` and mutate it directly
- **No framework**: Pure DOM manipulation, no React/Vue/etc.
- **Dual-world injection**: `content.js` (MAIN) + `bridge.js` (ISOLATED) for cookie-enabled API access
- **Demo mode**: `isExtensionContext()` check in `data.js` enables localhost development

## Entry Points

| Context | Entry |
|---------|-------|
| Extension popup | popup.html / popup.js |
| Analytics dashboard | results.html / results.js |
| API fetcher | content.js (injected into Shopee tab) |
| Message relay | bridge.js (injected into Shopee tab) |
| Background | background.js (service worker) |
| Dev preview | `npm run dev` → localhost:3000/results.html |
