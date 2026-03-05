# Codebase Summary

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Chrome Extension MV3 | Service Worker model |
| Language | TypeScript + IIFE JavaScript | Strict mode, zero `any` types |
| Build System | Vite 6.0 | Multi-entry rollupOptions for extension files |
| Charts | Chart.js 4.4.7 | npm dependency |
| Export | SheetJS (xlsx) 0.18.5 | npm dependency |
| Testing | Vitest 3.0 + jsdom | 31 tests, unit & integration |
| Type Checking | TypeScript strict | Pre-build validation |
| Storage | chrome.storage.local | Cache only |
| CI/CD | GitHub Actions | Build, test, lint on push |

## Project Structure

```
src/
├── dashboard/              # Dashboard UI (TypeScript)
│   ├── results.ts         # Orchestrator, DOM wiring
│   ├── state.ts           # Shared mutable state
│   ├── data.ts            # Fetch, cache, storage
│   ├── filters.ts         # Filter/sort/search logic
│   ├── table.ts           # Table render + pagination
│   ├── charts.ts          # Chart.js bar + pie
│   ├── comparison.ts      # Summary cards + comparison
│   ├── export.ts          # SheetJS Excel export
│   ├── utils.ts           # formatVND, escapeHtml
│   ├── icons.ts           # Icon data URIs
│   └── mock-data.ts       # Static demo data
├── types/                  # Type definitions
│   └── index.ts           # Order, Filter, State interfaces
├── popup/
│   └── popup.ts           # Extension popup logic
├── welcome/
│   └── welcome.ts         # Onboarding page logic
├── background.ts          # MV3 service worker
├── content/
│   └── content.js         # MAIN world API fetcher (IIFE)
├── bridge/
│   └── bridge.ts          # ISOLATED world message relay
└── styles/                 # CSS modules
    ├── results.css        # Dashboard design system
    ├── popup.css          # Popup UI styles
    ├── welcome.css        # Onboarding styles
    └── shared.css         # Shared variables

public/
├── manifest.json          # MV3 config
├── results.html           # Dashboard shell
├── popup.html             # Extension popup shell
├── welcome.html           # Onboarding shell
└── privacy.html           # Privacy policy
```

## Build System

- **Vite 6.0**: Fast builds, module federation
- **Multi-entry**: Separate bundles for dashboard, popup, welcome, background
- **TypeScript**: Strict mode, no `any` types, src/ compiles to dist/
- **content.js**: Stays as IIFE JavaScript (Chrome MAIN world requirement, not bundled by Vite)
- **CSS**: Modularized into 8 files, imported via `@import` in results.ts

## Module Dependency Map

```
results.ts (orchestrator)
  ├── state.ts
  ├── utils.ts
  ├── comparison.ts → state.ts, utils.ts
  ├── export.ts → state.ts, utils.ts
  ├── charts.ts → state.ts, types/index.ts
  ├── table.ts → state.ts, utils.ts, filters.ts
  ├── filters.ts → state.ts, utils.ts, charts.ts, table.ts, comparison.ts
  └── data.ts → state.ts, filters.ts, types/index.ts
```

## Key Patterns

- **TypeScript strict mode**: Zero `any` types, full type safety
- **ES modules**: Compiled by Vite; `results.html` loads bundled `results.js` as module
- **Vendored deps → npm**: chart.js and xlsx now as npm dependencies
- **State singleton**: All modules import `state` and mutate directly
- **Dual-world injection**: `content.js` (MAIN) + `bridge.ts` (ISOLATED) for cookie access
- **Demo mode**: `isExtensionContext()` check enables localhost development
- **Testing**: Vitest with jsdom, unit + integration tests

## Entry Points & Build

| Context | Source | Built To |
|---------|--------|----------|
| Dashboard | src/dashboard/results.ts | dist/results.js |
| Popup | src/popup/popup.ts | dist/popup.js |
| Welcome | src/welcome/welcome.ts | dist/welcome.js |
| Background | src/background.ts | dist/background.js |
| Bridge | src/bridge/bridge.ts | dist/bridge.js |
| API Fetcher | src/content/content.js | src/ (IIFE, not bundled) |
| Dev preview | `npm run dev` (Vite dev server) | localhost:5173 |

## Version

Current: **2.5.0** (Phase 1 completion)
