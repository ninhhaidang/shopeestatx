# Code Review Report: ShopeeStatX

**Reviewer:** code-reviewer
**Date:** 2026-03-12
**Project:** ShopeeStatX - Chrome Extension for Shopee Order Analytics
**Scope:** src/ directory

---

## Executive Summary

The codebase is well-structured for a Chrome extension with clear separation of concerns (popup, dashboard, background, content scripts). Overall code quality is good with TypeScript usage, modular file organization, and reasonable error handling. However, several issues were identified across security, performance, accessibility, and best practices categories.

**Overall Grade: B+**

---

## 1. Code Quality & Patterns

### Strengths
- Clean modular file structure under `src/dashboard/`
- TypeScript types properly defined in `src/types/index.ts`
- Configuration centralized in `config.ts`
- i18n support with locale switching
- Theme system with multi-theme support

### Issues

#### Q-1: Mixed TypeScript/JavaScript in content script
**File:** `src/content/content.js`
**Severity:** Low
**Issue:** Content script is plain JavaScript while other modules use TypeScript. This creates inconsistency and loses type safety.

**Recommendation:** Convert to TypeScript or at minimum add JSDoc type annotations.

---

#### Q-2: Deprecated utility function
**File:** `src/dashboard/utils.ts` (lines 4-7)
```typescript
/** @deprecated Use formatCurrency from i18n/format.ts instead */
export function formatVND(number: number, short = false): string {
  return formatCurrency(number, short);
}
```
**Severity:** Low
**Issue:** Deprecated function still exported and widely used throughout codebase.

**Recommendation:** Replace all usages with `formatCurrency` and remove deprecated wrapper.

---

#### Q-3: Implicit `any` type in event listeners
**File:** `src/dashboard/results.ts` (line 81)
```typescript
th.addEventListener('click', function (this: HTMLElement) {
```
**Severity:** Low
**Issue:** Missing type annotation on `this` context; also `data-sort` attribute accessed without null check.

**Recommendation:** Add proper type guards.

---

## 2. Security Issues

### Critical

#### S-1: XSS via innerHTML with unescaped user data
**Files:** `src/dashboard/insights.ts` (line 92-94), `src/dashboard/results.ts` (lines 44-52)
**Severity:** High

**Issue:** Using template literals with `innerHTML` without proper escaping:
```typescript
container.innerHTML = insights
  .map(text => `<div class="insight-item"><span class="insight-icon">💡</span>${text}</div>`)
  .join('');
```

The `text` variable comes from user data (shop names, product names) and could contain malicious HTML/JS.

**Recommendation:** Use `textContent` or sanitize with DOMPurify before inserting HTML.

---

#### S-2: CSP not defined in manifest
**File:** `src/manifest.json`
**Severity:** Medium

**Issue:** No `content_security_policy` defined. Extension relies on default CSP which may be too permissive.

**Recommendation:** Add explicit CSP:
```json
"content_security_policy": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
```

---

#### S-3: eval() equivalent in dynamic import
**File:** `src/dashboard/data.ts` (line 107)
```typescript
import('./incremental-fetch.js').then(m => m.incrementalFetch());
```
**Severity:** Low

**Issue:** Dynamic import from user-controlled string (though hardcoded here). Pattern could be misused.

**Recommendation:** This is acceptable for code splitting but ensure the path is never user-controlled.

---

### Medium

#### S-4: URL construction without sanitization
**File:** `src/config.ts` (lines 43-57)
```typescript
export function getApiBaseUrl(): string {
  return `https://${DOMAINS[activeDomain]}/api/v4/...`;
}
```
**Severity:** Low

**Issue:** While `activeDomain` is typed as `Domain` union, the pattern could be risky if extended.

**Recommendation:** Already properly typed - no change needed for current implementation.

---

## 3. Performance Concerns

### P-1: Chart.js instances not properly disposed on page unload
**Files:** `src/dashboard/charts.ts`, `src/dashboard/categories.ts`

**Issue:** Chart instances are destroyed on re-render but not on page unload. Memory leak potential.

**Recommendation:** Add cleanup on page unload:
```typescript
window.addEventListener('beforeunload', () => {
  monthlyChart?.destroy();
  shopChart?.destroy();
  categoryChart?.destroy();
});
```

---

#### P-2: Inefficient filtering on every render
**File:** `src/dashboard/filters.ts` (lines 78-144)

**Issue:** `applyFilters()` calls multiple render functions sequentially, each potentially triggering layout thrashing:
```typescript
renderData(filtered);
renderCharts(filtered);
renderCurrentPage();
// ... more renders
```

**Issue:** DOM queries in `applyFilters()` are done on every call without caching element references.

**Recommendation:** Cache DOM element references at initialization:
```typescript
const elements = {
  filterYear: document.getElementById('filterYear') as HTMLSelectElement,
  // ... cache all used elements
};
```

---

#### P-3: Large dataset processing in main thread
**File:** `src/content/content.js` (lines 114-235)

**Issue:** Processing thousands of orders synchronously in while loop can block UI:
```javascript
while (true) {
  let data = await getOrders(offset, limit);
  // ... heavy processing
}
```

**Recommendation:** Consider breaking into chunks with `requestIdleCallback` or Web Workers.

---

#### P-4: No debounce on filter changes
**File:** `src/dashboard/results.ts` (lines 162-168)

**Issue:** Each filter change triggers immediate `applyFilters()`:
```typescript
filterYear.addEventListener('change', () => { state.selectedDay = null; state.currentPage = 1; applyFilters(); });
```

**Recommendation:** Already debounced for search input - consider debouncing other filters for rapid changes.

---

## 4. Accessibility Issues

### A-1: Missing ARIA labels on interactive elements
**Files:** Multiple

**Issue:** Many buttons and controls lack proper ARIA labels:
- Date range picker preset buttons
- Theme dropdown options
- Pagination buttons

---

#### A-2: Focus management issues
**File:** `src/dashboard/theme-toggle.ts`

**Issue:** Dropdown opens but focus not trapped or moved to first item. Keyboard users cannot easily navigate.

**Recommendation:** Add focus management:
```typescript
export function toggleThemeDropdown(): void {
  // ... existing code
  const firstOption = dropdown.querySelector('.theme-option') as HTMLElement;
  firstOption?.focus();
}
```

---

#### A-3: Missing keyboard navigation in dropdowns
**File:** `src/dashboard/results.ts` (lines 146-156)

**Issue:** Export menu only handles Escape key, not Arrow keys or Enter.

**Recommendation:** Implement full keyboard navigation per WAI-ARIA menu pattern.

---

#### A-4: Color contrast in status badges
**Files:** `src/styles/*.css`

**Issue:** Status colors may not meet WCAG AA contrast ratio (4.5:1). Need to verify:
- `status-3` (completed - green)
- `status-4` (cancelled - red)
- `status-7/8` (shipping - blue)

**Recommendation:** Test with color contrast analyzer and adjust if needed.

---

#### A-5: Screen reader announcement for dynamic content
**File:** `src/dashboard/filters.ts`

**Issue:** When filters update results, screen readers not notified. Users don't know data changed.

**Recommendation:** Add live region:
```typescript
const liveRegion = document.getElementById('results-live-region');
liveRegion.textContent = `${filtered.length} results found`;
```

---

## 5. Error Handling

### E-1: Incomplete error handling in content script
**File:** `src/content/content.js` (lines 56-71)

**Issue:** API errors are not gracefully handled:
```javascript
let json = await (await fetch(url)).json();
```

If fetch fails or returns non-JSON, the entire script fails without user feedback.

**Recommendation:** Add proper error handling:
```javascript
const response = await fetch(url);
if (!response.ok) throw new Error(`API error: ${response.status}`);
const json = await response.json();
```

---

#### E-2: Silent failures in storage operations
**Files:** `src/dashboard/data.ts`, `src/dashboard/budget.ts`

**Issue:** Storage operations use fire-and-forget patterns without error handling:
```typescript
chrome.storage.local.set({ [STORAGE_KEYS.STATS]: cacheData });
```

**Recommendation:** Add error handling:
```typescript
try {
  await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: cacheData });
} catch (err) {
  console.error('Storage error:', err);
  showToast('Failed to save data');
}
```

---

#### E-3: Missing null checks before DOM access
**File:** `src/dashboard/results.ts` (multiple locations)

**Issue:** Several places assume DOM elements exist without verification:
```typescript
const btnExport = document.getElementById('btnExport')!;
```

The `!` assertion is used but element might not exist in all contexts.

**Recommendation:** Add defensive checks:
```typescript
const btnExport = document.getElementById('btnExport');
if (!btnExport) return;
```

---

## 6. Edge Cases

### Edge-1: Empty orders array
**File:** `src/content/content.js` (line 118)

**Issue:** No check for empty data - could cause infinite loop if API returns empty but valid response:
```javascript
if (data.length === 0) break;
```

This is correct, but no logging to distinguish "no more data" from "API error returning empty".

---

#### Edge-2: Malformed date handling
**File:** `src/dashboard/heatmap.ts` (line 21)
```typescript
if (isNaN(d.getTime()) || d < startDate || d > endDate) return;
```

**Issue:** While dates are validated, `deliveryDate` can be `null` and the code doesn't always handle this consistently.

**Recommendation:** Ensure consistent null checking throughout.

---

#### Edge-3: Very long shop names / product names
**File:** `src/dashboard/charts.ts` (line 207)
```typescript
labels: topShops.map(s => s[0].substring(0, 20)),
```

**Issue:** Truncation at 20 chars is arbitrary. Long names may still break chart layout.

**Recommendation:** Add ellipsis via CSS `text-overflow: ellipsis` rather than JS truncation.

---

#### Edge-4: Year with no orders
**File:** `src/dashboard/filters.ts` (line 149-158)

**Issue:** If selected year has no orders, UI shows empty state but year still appears in filter dropdown.

---

#### Edge-5: Concurrent refresh requests
**File:** `src/dashboard/incremental-fetch.ts`

**Issue:** No guard against multiple simultaneous refresh operations. User could click refresh multiple times.

**Recommendation:** Add loading state check:
```typescript
let isRefreshing = false;
export async function incrementalFetch(): Promise<void> {
  if (isRefreshing) return;
  isRefreshing = true;
  // ... fetch logic
  finally { isRefreshing = false; }
}
```

---

#### Edge-6: Order ID parsing from timestamp
**File:** `src/content/content.js` (lines 195-205)

**Issue:** Risky heuristic - extracting timestamp from order ID is unreliable:
```javascript
const possibleTimestamp = parseInt(orderIdStr.substring(0, 10));
```

**Recommendation:** This fallback logic should be logged for debugging when it triggers.

---

## 7. Best Practices Violations

### B-1: Global mutable state
**File:** `src/dashboard/state.ts`

**Issue:** Using mutable global state (`state` object) that all modules directly mutate:
```typescript
export const state: AppState = { ... };
// Any module can: state.currentPage = 999;
```

**Recommendation:** Consider using state management patterns or at minimum, add state change events for predictability.

---

#### B-2: Magic numbers
**Files:** Multiple

**Issue:** Hardcoded numbers throughout codebase:
- `limit = 20` in content script
- `itemsPerPage = 20` default
- Color hex codes in comparison.ts

**Recommendation:** Move to config constants.

---

#### B-3: Inconsistent error messages
**Issue:** Mix of Vietnamese and English in error messages. Some in Vietnamese (`'Không tìm thấy tab Shopee'`), some in English (`'Failed to export Excel'`).

**Recommendation:** Use i18n system consistently for all user-facing strings.

---

#### B-4: Console.log vs proper logging
**Issue:** Uses `console.error` and `console.warn` but also `console.log` in some places. No structured logging.

**Recommendation:** Consider using a logging utility with levels.

---

#### B-5: No unit tests
**Issue:** Project has `vitest.config.ts` but no test files visible in src/.

**Recommendation:** Add tests especially for:
- Filter logic (`filters.ts`)
- Category classification (`categories.ts`)
- Date range calculations (`date-range-picker.ts`)

---

#### B-6: Hardcoded strings in business logic
**File:** `src/dashboard/comparison.ts` (lines 69-70)
```typescript
const color = isUp ? '#f44336' : '#4caf50';
```

**Issue:** Should use CSS custom properties for theming.

---

#### B-7: Missing TypeScript strict mode
**File:** `tsconfig.json`

**Issue:** Not reviewed, but likely not using strict mode given implicit `any` seen in code.

**Recommendation:** Enable strict mode in tsconfig:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

---

## Summary of Recommendations

### Critical (Fix Soon)
1. **S-1**: Sanitize HTML before innerHTML - XSS risk
2. **E-3**: Add null checks before DOM access
3. **E-1**: Add error handling in content script API calls

### High Priority
4. **P-1**: Add chart cleanup on page unload
5. **S-2**: Add CSP to manifest
6. **A-1/2**: Improve accessibility - ARIA labels, focus management

### Medium Priority
7. **B-1**: Consider state management pattern
8. **P-2**: Cache DOM element references
9. **E-2**: Add error handling to storage operations
10. **Edge-5**: Add guard against concurrent refreshes

### Low Priority / Nice to Have
11. **Q-1**: Convert content.js to TypeScript
12. **Q-2**: Remove deprecated formatVND function
13. **B-5**: Add unit tests
14. **B-3**: Standardize error message language

---

## Unresolved Questions

1. **Q-UI-1**: How should the extension handle rate limiting from Shopee API? Current implementation has no backoff strategy.

2. **Q-UI-2**: What's the expected behavior when user has >10,000 orders? Should pagination or virtual scrolling be implemented?

3. **Q-UI-3**: Should the extension support data export to Google Sheets in addition to Excel/CSV/PDF?

4. **Q-UI-4**: How to handle multi-tab scenarios? Currently only single tab ID is stored - what happens if user opens multiple Shopee tabs?

5. **Q-UI-5**: Is offline support needed? Currently no service worker caching strategy for the extension itself.

---

*Report generated by code-reviewer agent*
