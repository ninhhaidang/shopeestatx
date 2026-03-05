# Code Standards

## General Principles

- **YAGNI / KISS / DRY** — no over-engineering, no speculative code
- **TypeScript strict mode** — zero `any` types, full type safety
- **File size limit** — keep source files under 200 LOC; split when exceeded
- **Dependencies via npm** — chart.js, xlsx (no vendored files)
- **Testing-first approach** — Vitest for all logic, aim for >80% coverage

## TypeScript

### Type Safety
- **Strict mode enabled** in `tsconfig.json` (no implicit `any`)
- Define interfaces in `src/types/index.ts` (Order, ShopeeData, Filter, Sort, etc.)
- Use types for state mutations: `const state: AppState = {...}`
- Avoid `unknown` or `as any` — use discriminated unions for complex types

### Module System
- All source files use ES module syntax (`import`/`export`)
- Vite compiles `src/` TypeScript → `dist/` JavaScript at build time
- HTML files load bundled JS via `<script type="module" src="..."></script>`
- Named exports preferred; default exports only for singletons (state, config)

### Naming
- Files: kebab-case with descriptive names (`mock-data.ts`, `background.ts`)
- Functions: camelCase (`applyFilters`, `renderCurrentPage`)
- Types/Interfaces: PascalCase (`Order`, `Filter`, `AppState`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINT`, `PAGINATION_SIZE`)
- DOM IDs: camelCase (`filterYear`, `btnExport`, `loadingText`)

### State
- All mutable shared state lives in `state.ts` as a single exported object
- State type defined in `types/index.ts` (AppState interface)
- Modules import `state` and mutate fields directly — no getter/setter indirection
- `results.ts` may hold ephemeral orchestrator-only state (e.g. `searchTimeout`)

### Error Handling
- Wrap async operations in try/catch blocks
- Define error types in `types/index.ts` for consistent handling
- On fetch error: hide loading, show `#noData` with error message
- Use `console.error()` for unexpected errors; log structured data
- Return `null` or throw typed errors — never silent failures

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

- All design tokens as CSS custom properties on `:root` (e.g., `results.css`)
- Primary color: `#ee4d2d` (Shopee orange)
- Class naming: lowercase kebab (`.filter-chips`, `.summary-card`)
- Animations defined as `@keyframes`, applied via class
- Responsive: 3 breakpoints — `768px` (tablet), `1024px` (desktop)
- Modularized: import via `@import` in main stylesheet

## Testing

### Unit Tests
- File naming: `*.test.ts` or `*.spec.ts` (colocated with source)
- Test functions using `describe()` and `it()`
- Mock external dependencies (chrome API, fetch) via `vi.mock()`
- Aim for >80% coverage

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
- Host permission scoped to `https://shopee.vn/*`
- Service worker (`background.ts`) kept minimal
- No `eval()`, no remote code execution

## Data Integrity

- Cancelled (statusCode 4) and returned (statusCode 12) orders: `subTotal = 0`, excluded from spend
- Order date uses `shipping.tracking_info.ctime` → fallback `status.update_time` → fallback order_id timestamp
- Future timestamps from order_id fallback are rejected
- Orders without `infoCard` or `orderCard` are skipped silently

## Build & Dev Workflow

### Development
```bash
npm run dev           # Vite dev server on localhost:5173
npm run typecheck     # TypeScript validation
npm test              # Vitest
npm run build         # Production build to dist/
```

### Pre-Commit
- Run `npm run typecheck` to validate types
- Run `npm test` to ensure all tests pass
- No lint step (prioritize functionality over formatting)

### File Organization

```
src/                   # TypeScript source
├── dashboard/        # Dashboard UI modules
├── types/            # Type definitions
├── popup/            # Extension popup
├── welcome/          # Onboarding page
├── background.ts     # Service worker
├── content/          # MAIN world API fetcher (IIFE JS)
├── bridge/           # Message relay
└── styles/           # CSS modules

dist/                  # Vite build output (git-ignored)
public/                # Static assets (manifest.json, HTML)
docs/                  # Developer documentation
plans/                 # Implementation plans
```

### Version
Current: **2.5.0** (Phase 1 complete with Vite + TypeScript)
