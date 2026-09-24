# Code Standards

## General Principles

- **YAGNI / KISS / DRY** — no over-engineering, no speculative code
- **TypeScript strict mode** — zero `any` types, full type safety
- **200 LOC target** — aspirational for new modules; current exceptions listed below
- **Dependencies via npm** — chart.js, exceljs (no vendored files)
- **Testing-first approach** — Vitest for all logic, aim for >80% coverage

## TypeScript

### Type Safety
- **Strict mode** in `tsconfig.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`)
- Define interfaces in `src/types/index.ts`:
  - **Types**: `StatusCode`, `ShopMetric`, `SortDirection`
  - **Interfaces**: `UserProfile`, `Order`, `OrderData`, `DateRange`, `AppState`
- Use types for state mutations: `const state: AppState = {...}`
- Avoid `unknown` or `as any` — use discriminated unions for complex types

### Module System
- All source files use ES module syntax (`import`/`export`)
- Vite compiles `src/` TypeScript → `dist/` JavaScript at build time
- HTML files load bundled JS via `<script type="module" src="..."></script>`
- Named exports preferred; default exports only for singletons (state, config)

### Naming
- Files: kebab-case with descriptive names (`mock-data.ts`, `background.ts`, `date-range-picker.ts`)
- Functions: camelCase (`applyFilters`, `renderCurrentPage`, `categorizeOrder`)
- Types/Interfaces: PascalCase (`Order`, `AppState`, `DateRange`, `StatusCode`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINT`, `PAGINATION_SIZE`, `STORAGE_KEYS`)
- DOM IDs: camelCase (`filterYear`, `btnExport`, `loadingText`)

### State
- All mutable shared state lives in `state.ts` as a single exported object
- State type defined in `types/index.ts` (`AppState` interface)
- Modules import `state` and mutate fields directly — no getter/setter indirection
- `results.ts` may hold ephemeral orchestrator-only state (e.g. `searchTimeout`)

### Error Handling
- Wrap async operations in try/catch blocks
- Define error types in `types/index.ts` for consistent handling
- On fetch error: hide loading, show `#noData` with error message
- Use `console.error()` for unexpected errors; log structured data
- Return `null` or throw typed errors — never silent failures

### Security
- **XSS Prevention**: Use `escapeHtml()` utility for all user-generated content rendered in DOM
- **CSP**: Content Security Policy enforced in manifest.json
- **Memory Management**: Destroy Chart.js instances on page unload via `destroyAllCharts()`
- **Accessibility**: All interactive elements must have proper aria-labels

### Comments
- File-level TSDoc comment: `/** ShopeeStatX/filename.ts — purpose */`
- TSDoc comments for exported functions/types
- Comment non-obvious logic; skip trivial code
- Mark API structure differences with inline comments (NEW API / OLD API)

## JavaScript (content.js only)

- `src/content/content.js` stays as IIFE (Chrome MAIN world requirement, not bundled)
- Use ES6+ syntax but no module syntax
- Wrap in IIFE: `(function() { ... })()`
- Type comments (`/** @type {string} */`) for JSDoc-style typing
- Same naming conventions as TypeScript code

## HTML

- Semantic elements where appropriate (`<th>`, `<section>`, etc.)
- All interactive elements have IDs matching source code references
- No inline styles — use CSS classes or CSS variables
- Load bundled JS: `<script type="module" src="..."></script>`
- Include `charset="utf-8"` and `viewport` meta tags

## CSS

- All design tokens as CSS custom properties (see `docs/design-guidelines.md`)
- Base tokens in `src/styles/variables.css:5-69`
- 5 theme overrides in `src/styles/themes.css:5-261` (`:root[data-theme="orange"|"forest"|"rose"|"sky"|"lavender"]`)
- Aggregator: `src/dashboard/results.css` `@import`s all 11 style modules
- Class naming: lowercase kebab (`.filter-chips`, `.summary-card`)
- Animations defined as `@keyframes`, applied via class
- Responsive: 3 breakpoints — `768px` (tablet), `1024px` (desktop)
- Modularized: each concern in its own file (`cards.css`, `charts.css`, `table.css`, …)

## Testing

### Unit Tests
- Spec location: `tests/` at project root (not colocated with source)
- File naming: `*.test.ts` (e.g., `categories.test.ts`, `filters.test.ts`)
- Test functions using `describe()` and `it()`
- Mock external dependencies (chrome API, fetch) via `vi.mock()`
- Aim for >80% coverage
- Current test files: `categories`, `content-parser`, `export`, `filters`, `predictions`, `theme-toggle`, `utils` + `setup.ts`

### Integration Tests
- Test data flows (fetch → state → UI)
- Use `jsdom` for DOM testing
- Verify filter/sort/pagination logic end-to-end
- Test error scenarios (API failure, invalid data)

### Running Tests
```bash
npm test              # Run all tests once
npm run test:watch   # Watch mode for development
npm run test:coverage # Generate coverage report
```

## Chrome Extension

- Manifest V3 only — no MV2 patterns
- Minimum permissions: `activeTab`, `storage`, `scripting`
- Host permissions: 7 Shopee domains from `manifest.json` (vn/id/th/ph/my/sg/tw)
- Service worker (`background.ts`) kept minimal — handles `chrome.runtime.onInstalled` only
- No `eval()`, no remote code execution

## Data Integrity

- Cancelled (statusCode 4) and returned (statusCode 12) orders: `subTotal = 0`, excluded from spend
- Order date uses `shipping.tracking_info.ctime` → fallback `status.update_time` → fallback order_id timestamp
- Future timestamps from order_id fallback are rejected
- Orders without `infoCard` or `orderCard` are skipped silently
- StatusCode type lists `{0, 3, 4, 7, 8, 9, 12}` — real Shopee data may include other codes; unknown codes default to neutral badge

## Build & Dev Workflow

### Development
```bash
npm run dev           # Vite dev server on localhost:5173 (root: 'src')
npm run typecheck     # TypeScript validation (strict + noUnusedLocals + noUnusedParameters)
npm test              # Vitest
npm run build         # Production build to dist/ (tsc --noEmit && vite build)
```

### Pre-Commit
- Run `npm run typecheck` to validate types
- Run `npm test` to ensure all tests pass
- No lint step (prioritize functionality over formatting)

## File Organization

```
shopeestatx/                      # Project root
├── vite.config.ts                 # Vite config (root: 'src', copy-extension-files plugin)
├── tsconfig.json                  # strict + noUnusedLocals + noUnusedParameters
├── vitest.config.ts               # Test runner config
├── package.json                   # v3.4.0
├── tests/                         # Vitest spec files (NOT colocated)
└── src/                           # TypeScript source
    ├── dashboard/                 # 22 .ts UI modules + results.html + results.css
    ├── types/                     # Shared type definitions
    ├── i18n/                      # Vietnamese-only translation
    ├── popup/                     # Extension popup (html/css/ts)
    ├── welcome/                   # Onboarding page (html/css/ts)
    ├── background.ts              # MV3 service worker
    ├── content/content.js         # MAIN world API fetcher (IIFE)
    ├── bridge/                    # ISOLATED world message relay
    ├── styles/                    # 11 modular CSS files
    ├── config.ts                  # Centralized config (DOMAINS, STORAGE_KEYS, EVENTS)
    ├── manifest.json              # MV3 config
    └── privacy.html               # In-extension privacy policy

dist/                              # Vite build output (git-ignored)
docs/                              # Developer documentation
plans/                             # Implementation plans
```

### 200 LOC Target — Current Exceptions

The 200 LOC guideline is **aspirational** for new modules. Current dashboard modules that exceed it (refactor deferred):

| File | LOC | Reason |
|------|-----|--------|
| `categories.ts` | 316 | 12-bucket keyword classifier with VI/EN keyword sets |
| `results.ts` | 311 | Orchestrator + DOM wiring (all event listeners in one place) |
| `charts.ts` | 253 | Chart.js wrappers + 2 chart types + drill-down |
| `filters.ts` | 252 | Year/month/status/search/chips filter pipeline |
| `table.ts` | 225 | Render + sort + expand + clickable filter cells |
| `date-range-picker.ts` | 222 | Custom date range + presets + state management |
| `cards.css` / `layout.css` / `table.css` / `themes.css` | 193/493/503/485 | CSS aggregate (not subject to 200 LOC rule) |

## Version

Current: **3.4.0** (per `package.json` + `src/manifest.json`)

## Configuration

All hardcoded values (domains, storage keys, event names) MUST be centralized in `src/config.ts`.

### Config Module Usage

```typescript
import {
  DOMAINS,
  setActiveDomain,
  getActiveDomain,
  getApiBaseUrl,
  getOrderUrl,
  getPurchaseUrl,
  STORAGE_KEYS,
  EVENTS,
} from './config';
```

### Rules

- **Domain**: Use `getApiBaseUrl()`, `getOrderUrl()`, `getPurchaseUrl()`, `getHomeUrl()` — never hardcode URLs
- **Storage**: Use `STORAGE_KEYS.STATS`, `STORAGE_KEYS.THEME`, `STORAGE_KEYS.BUDGET` — never hardcode keys
- **Events**: Use `EVENTS.APPLY_FILTERS` or prefixed `shopeestatx:*` events — never hardcode event names
- **Adding new domains**: Add to `DOMAINS` object, update `manifest.json` host_permissions
- **7 supported Shopee sites**: `vn`, `id`, `th`, `ph`, `my`, `sg`, `tw`
