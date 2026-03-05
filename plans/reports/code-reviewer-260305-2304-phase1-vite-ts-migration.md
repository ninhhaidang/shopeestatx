# Code Review: Phase 1 -- Vite + TypeScript Migration

**Date:** 2026-03-05
**Reviewer:** code-reviewer
**Scope:** Full new `src/` tree, build configs, tests, CI

## Scope

- Files reviewed: 30+ (all new src/, tests/, configs, CI)
- LOC (TS/JS): ~1,200 source + ~200 test
- Focus: complete new codebase review
- Verification: tsc 0 errors, vitest 31/31 pass, vite build <4s

## Overall Assessment

**Solid migration.** Clean modular structure, zero `any` types, strict TS config, good test foundation. A few issues need attention before merge, one critical.

---

## Critical Issues

### 1. XSS in table.ts innerHTML (CRITICAL)

`table.ts` line 42 injects `order.orderId` directly into an `<a>` href without escaping:

```ts
<a href="https://shopee.vn/user/purchase/order/${order.orderId}" ...>${order.orderId}</a>
```

If `orderId` contains special characters (unlikely from Shopee API but possible with corrupted cache/storage), this is injectable. Same with `order.status` on line 44 and `order.subTotalFormatted` on line 47. All values from `order.*` that go into innerHTML should be escaped.

Also line 51: `detailItems.push(... ${order.orderId} ...)` -- orderId unescaped in detail section.

**Fix:** Wrap all dynamic values in `escapeHtml()` or validate orderId is numeric-only before rendering.

### 2. `xlsx` package version 0.18.5 is the community fork (SheetJS)

`xlsx@0.18.5` is the last open-source release before SheetJS changed licensing. It has known vulnerabilities (prototype pollution in older parsers). The package is used for **write-only** (export), so attack surface is limited. However:

- Consider pinning to `xlsx@0.18.5` exactly (remove `^`) to avoid accidental upgrades
- Or switch to the maintained `xlsx-js-style` or `exceljs` fork
- The CI `npm audit --audit-level=high || true` silently swallows audit failures -- remove the `|| true` or at least log warnings

---

## High Priority

### 3. Duplicated filter logic in charts.ts (DRY violation)

`charts.ts` lines 19-41 duplicate the filtering logic from `filters.ts:applyFilters()`. When filters change, both must be updated in sync.

**Fix:** Extract a shared `filterOrders(orders, opts)` pure function in `filters.ts` and reuse it in charts.

### 4. charts.ts exceeds 200-line limit (207 lines)

Per project standards, code files should stay under 200 lines. The chart rendering has two distinct responsibilities (monthly bar chart + shop doughnut).

**Fix:** Extract shop chart into `shop-chart.ts` or at least split the two chart functions.

### 5. content.js parseStatusLabel is duplicated in test

`tests/content-parser.test.ts` copies `parseStatusLabel` from `content.js` instead of importing it. If the source changes, the test won't catch regressions.

**Root cause:** content.js is an IIFE -- functions aren't exportable. This is the correct trade-off for MAIN world injection, but:

**Fix:** Extract `parseStatusLabel` into a shared `src/utils/status-parser.ts`, import it in both content.js (pre-bundled by a small script or inlined) and tests. Alternatively, accept the duplication but add a comment linking them with a NOTE to keep in sync.

### 6. No error boundary on `JSON.parse(filterValue!)` in table.ts

Line 96: `const dateData = JSON.parse(filterValue!)` -- if `data-value` attribute is malformed, this throws uncaught. Wrap in try-catch.

### 7. Non-null assertions (`!`) overuse

Counted 40+ `!` assertions across `data.ts`, `filters.ts`, `table.ts`, `comparison.ts`, `results.ts`. Most DOM lookups use `getElementById(...)!` which will throw if the element is missing.

This is acceptable for a Chrome extension where HTML is controlled, but fragile during refactoring. Consider a utility:

```ts
function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}
```

---

## Medium Priority

### 8. `results.html` missing `<link>` in `<head>` for no-JS fallback

CSS is loaded via `import './results.css'` in results.ts. If JS fails to load, the page is unstyled. Not a real issue for Chrome extension context but worth noting. popup.html and welcome.html correctly have `<link rel="stylesheet">` tags -- results.html is inconsistent.

### 9. welcome.html icon path `../icons/icon128.png`

In dist, `welcome/welcome.html` references `../icons/icon128.png`. The Vite plugin copies icons to `dist/icons/`. This works because Vite preserves the relative path in HTML. Verified: build succeeds. But this is fragile -- if the welcome page moves, the relative path breaks. Consider using `chrome.runtime.getURL()` in JS instead.

### 10. Export inconsistency with table filters

`export.ts` line 12-18: Export intentionally skips `selectedDay` and `searchTerm` filters. The comment acknowledges this. Users may be confused when exported data doesn't match what they see on screen. Consider adding a note/tooltip in the UI.

### 11. `mock-data.ts` formatVND duplication

`mock-data.ts` line 4 re-declares `formatVND()` instead of importing from `utils.ts`. DRY violation.

**Fix:** `import { formatVND } from './utils.js';`

### 12. Shared mutable state pattern

`state.ts` exports a singleton mutable object. All modules mutate it directly. This works for a small extension but is fragile:
- No change detection/reactivity
- Race conditions possible if async operations overlap (e.g., rapid filter changes during data fetch)

Not actionable now but worth tracking for v3+.

### 13. `bridge.ts` forwards ALL messages to runtime

Line 6: `chrome.runtime.sendMessage(event.data)` forwards any message with `source: 'shopee-stats'`. An attacker on the page could inject messages. Currently, the background listener only handles `openResults`, so impact is low. But as the extension grows, validate message shape.

### 14. `package-lock.json` untracked

Previous commit removed `package-lock.json`, but now with `package.json` having dependencies, the lockfile must be committed for reproducible builds. CI uses `npm ci` which requires it.

---

## Low Priority

### 15. CI could cache build artifacts

The CI workflow runs tsc, vitest, and vite build sequentially. Consider parallelizing typecheck and test (they're independent).

### 16. `minify: false` in vite.config.ts

Comment says "for easier debugging during development." Should enable for production builds. Could use environment variable: `minify: mode === 'production'`.

### 17. Loose equality in filters

`filters.ts` uses `!=` (loose) for comparisons: `order.orderYear != Number(year)`, `order.statusCode != Number(status)`. While functionally equivalent here (comparing number to number), `!==` is more precise TypeScript style.

### 18. `results.ts` line 54: `parseInt(this.value)` without radix

`parseInt(this.value)` should be `parseInt(this.value, 10)` for clarity, though in practice the default is base-10 for numeric strings.

---

## Edge Cases Found

1. **Empty orders array:** `renderTimeComparison` accesses `state.allOrdersData!.orders` -- if allOrdersData is null (shouldn't happen per flow but possible with corrupted storage), this crashes
2. **Infinity pagination:** `itemsPerPage = Infinity` when "All" is selected -- edge case is handled correctly in `renderCurrentPage` and `updatePaginationInfo`
3. **Timezone drift:** `deliveryDate` is stored as ISO string, but `toLocaleDateString('vi-VN')` uses local timezone. If user is not in VN timezone, dates may shift by one day
4. **Large datasets:** No virtualization for table rendering. 10,000+ orders will cause DOM performance issues. Acceptable for v2.5 but track for future
5. **Concurrent fetch:** If user clicks "refresh" rapidly, multiple `fetchDataFromShopee()` calls could race. No debounce/lock on the refresh button

---

## Positive Observations

- Zero `any` types -- excellent type discipline
- Clean module boundaries with single-responsibility files
- `escapeHtml` using DOM textContent approach is XSS-safe (when used)
- Proper Chrome extension MV3 patterns (service worker, scripting API)
- Good test coverage for pure functions (utils, sort, status parsing)
- CSS modularization via @import chain is clean
- content.js IIFE + programmatic injection is the correct approach for MAIN world
- Manifest correctly does NOT use `content_scripts` (programmatic injection is better for on-demand execution)
- `shouldFetch` URL parameter pattern for triggering data fetch is clean

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | 100% (no `any`, strict mode) |
| Test Coverage | Partial -- utils, sort, status parsing covered; DOM/chart/data modules untested |
| Linting Issues | 0 (tsc --noEmit clean) |
| Build Time | <4s |
| Bundle Size | ~1MB (mostly chart.js + xlsx) |

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Escape `orderId`, `status`, and `subTotalFormatted` in table.ts innerHTML
2. **[HIGH]** Extract shared filter function to eliminate charts.ts duplication
3. **[HIGH]** Fix content-parser test to stay in sync with source (or extract shared module)
4. **[HIGH]** Add try-catch around `JSON.parse` in table.ts line 96
5. **[HIGH]** Commit `package-lock.json`
6. **[MEDIUM]** De-duplicate `formatVND` in mock-data.ts
7. **[MEDIUM]** Split charts.ts to stay under 200-line limit
8. **[MEDIUM]** Pin xlsx version or switch to maintained fork
9. **[LOW]** Enable minification for production
10. **[LOW]** Use strict equality (`!==`) in filters.ts

---

## Unresolved Questions

1. Should content.js remain plain JS forever, or is there a path to TS compilation with IIFE output (e.g., a separate Vite entry with `iife` format)?
2. Is the `xlsx@0.18.5` license acceptable for Chrome Web Store distribution?
3. Should the export function respect ALL active filters (including day and search) to match what the user sees?
