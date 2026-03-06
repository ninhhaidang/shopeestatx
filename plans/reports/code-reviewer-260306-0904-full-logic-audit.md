# Logic Audit Report — ShopeeStatX

**Date:** 2026-03-06
**Scope:** Full logic audit — 13 core modules, ~900 LOC
**Focus:** Bug logic, edge cases, state inconsistencies

---

## Critical Bugs (phải fix ngay)

### BUG-1: `selectedDay` filter silently drops when `month` not set
**File:** `src/dashboard/filters.ts:94`

```ts
if (state.selectedDay !== null && month) {
  // filter by day
}
```

`selectedDay` is only applied when `month` is also set. Two code paths set `selectedDay` without guaranteeing `month`:
1. `heatmap.ts:126-128` — sets filterYear + filterMonth + selectedDay correctly, then dispatches `shopeestatx:apply-filters`. This path IS correct.
2. `table.ts:101-104` (detail row click → "date" filter) — sets filterYear + filterMonth + selectedDay via `state.selectedDay = dateData.day`. Correct if deliveryDate always has a valid month.

**The real bug:** `removeFilter('year')` in `filters.ts:209` clears year but NOT month. If user has year+month+day active and removes the year chip, `month` stays set but `year` is blank. The `filterOrders` logic in the else branch (`opts.year && ...`) short-circuits: since `year` is now blank, year filter is skipped but `opts.month` is still applied — this is arguably correct. However, the `selectedDay` chip is still shown in UI (line 160: `state.selectedDay !== null && month`), but after removing year, if month remains set, day still filters — no real bug here, but the chip label shows no context for which year.

**Actual Bug:** `removeFilter('month')` (line 210) clears month but does NOT clear `state.selectedDay`. After removing month chip, `selectedDay !== null` but `month === ''`, so the day filter silently becomes a no-op — but `selectedDay` state is dirty. On the next `filterYear` change, `selectedDay` could reactivate unexpectedly if user picks a month again. The chip for "day" won't show (line 160 requires `month`), so the stale `selectedDay` is invisible.

**Fix:** In `removeFilter`, when `type === 'month'`, also reset `state.selectedDay = null`.

---

### BUG-2: Chart drill-down does NOT clear `state.dateRange` — filter collision
**File:** `src/dashboard/charts.ts:132-137`

```ts
// onClick (monthly chart, no month filter active):
(document.getElementById('filterYear') as HTMLSelectElement).value = year;
(document.getElementById('filterMonth') as HTMLSelectElement).value = monthNum;
applyFilters();
```

When a `dateRange` is active (e.g., user selected "Last 3 months"), `filterOrders` uses the condition:

```ts
const useDateRange = !opts.year && !opts.month && (start !== null || end !== null);
```

After the chart click sets year+month, `useDateRange` becomes `false`, so the dateRange is ignored. The filter switches to year/month mode — correct behavior. BUT:

- The dateRange chip in `updateActiveFilters` (line 161) checks `!year && !month`, so it disappears — good.
- However, `state.dateRange` is NOT cleared. If user then removes the month chip via `removeFilter('month')`, the state returns to: `!year && !month && dateRange.start !== null` → `useDateRange = true`, and the dateRange filter reactivates silently without any UI indication it was still stored.

**Severity:** Medium-high. User drills into a month from a 3-month range, removes the month chip expecting to go back to "no filter" or "3-month view", but instead gets teleported back into the dateRange filter unexpectedly.

**Fix:** In the chart's monthly `onClick` handler, add `state.dateRange = { start: null, end: null }` before `applyFilters()`. Also dispatch `shopeestatx:date-range-cleared` to reset the picker UI.

---

### BUG-3: `predictMonthEnd` — division by `dayOfMonth` when day = 1 yields massive overestimate
**File:** `src/dashboard/predictions.ts:18`

```ts
if (dayOfMonth === 0 || currentSpending === 0) return 0;
return Math.round((currentSpending / dayOfMonth) * daysInMonth);
```

`dayOfMonth` from `getDate()` is always 1-31, never 0, so the `=== 0` guard is dead code. More importantly, on day 1 of the month with even a single order, the prediction extrapolates the entire month from one day's data. A single ₫500K order on day 1 → predicted ₫15.5M for 31-day month. No minimum-days guard exists.

**Fix:** Return 0 (or null) if `dayOfMonth < 3` (or similar threshold) to avoid misleading early-month predictions. The dead `dayOfMonth === 0` guard should also be removed.

---

### BUG-4: `last3months` preset — negative month index when month < 2
**File:** `src/dashboard/date-range-picker.ts:48-50`

```ts
case 'last3months': {
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const start = new Date(year, month - 2, 1);
```

`month` is 0-based (`now.getMonth()`). In January (`month = 0`): `month - 2 = -2`. In February (`month = 1`): `month - 2 = -1`.

`new Date(year, -2, 1)` → JavaScript Date constructor handles negative months by rolling back years: `-2` → October of the previous year. This actually works correctly due to JS Date overflow behavior, BUT it only covers October–December of prior year + January of current year (3 months total from January). For February: November–January. This is technically correct behavior, just unusual to rely on.

**Risk:** Low — JS Date arithmetic handles it. But it's fragile and confusing to maintain. `thisYear` preset has the same potential confusion with `month - 2` in `last3months`.

**Recommendation:** Explicit year rollback for clarity:
```ts
const startMonthOffset = month - 2;
const startYear = startMonthOffset < 0 ? year - 1 : year;
const startMonth = ((startMonthOffset % 12) + 12) % 12;
```

---

## Logic Issues (nên fix)

### ISSUE-1: `syncYearMonthSelects` called for 'thisMonth'/'lastMonth' but dateRange also set
**File:** `src/dashboard/date-range-picker.ts:94-98`

For `thisMonth` and `lastMonth` presets, both `state.dateRange` AND `filterYear`/`filterMonth` are set simultaneously. In `filterOrders`:

```ts
const useDateRange = !opts.year && !opts.month && (start !== null || end !== null);
```

Since `opts.year` and `opts.month` are now set (via `syncYearMonthSelects`), `useDateRange = false` — so the dateRange is ignored and year/month filtering applies. This is intentional (comment says "keep chart drill-down working"), but it creates a subtle inconsistency: `state.dateRange` contains a valid range, yet it's effectively bypassed. If a user later removes the year chip (without removing the month), dateRange would NOT reactivate because month is still set. Once both year and month chips are removed, dateRange WOULD reactivate — creating the same ghost-dateRange issue as BUG-2.

**Fix:** Either don't set `state.dateRange` for these presets (rely purely on year/month select), or don't call `syncYearMonthSelects` and instead use dateRange. Mixed state is the root cause of confusion.

---

### ISSUE-2: `selectedDay` chip displayed without year context
**File:** `src/dashboard/filters.ts:160`

Chip shows `t('filter.chip.day', { value: state.selectedDay })` — e.g., "Day: 15". No year/month context shown in chip label. User could be confused which month's day 15 is being filtered.

**Recommendation:** Include month in chip label: "Day: 15/3".

---

### ISSUE-3: `renderTimeComparison` always uses `state.allOrdersData.orders` (unfiltered)
**File:** `src/dashboard/comparison.ts:24`

`renderData(filtered)` is called with filtered orders, but then it calls:
```ts
renderTimeComparison(state.allOrdersData!.orders);
```

The summary cards (currentMonthAmount, currentYearAmount, avgOrderValue) always show stats from ALL orders regardless of active filters. This is likely intentional behavior, but `avgOrderValue` and `avgComparison` (line 97) show "completed orders: N" which counts ALL completed orders — not the filtered set. This could mislead users who apply a shop filter expecting to see that shop's average.

**Recommendation:** Document this design decision explicitly, or pass `orders` instead of `allOrdersData.orders` to `renderTimeComparison` (the filtered orders).

---

### ISSUE-4: `_alertFired` budget flag never resets on new month
**File:** `src/dashboard/budget.ts:57-58`

```ts
let _alertFired = false;
export function resetBudgetAlert(): void { _alertFired = false; }
```

`resetBudgetAlert()` is never called anywhere in the codebase. The alert fires once per extension session. If the budget config is saved (line 210 in results.ts calls `applyFilters()` but not `resetBudgetAlert()`), the alert will never re-fire in the same session even if user updates the threshold. Intended one-shot behavior or missing reset call is unclear.

**Recommendation:** Call `resetBudgetAlert()` in `saveBudgetConfig()` or after budget dialog save, so the alert re-evaluates with new config.

---

### ISSUE-5: `insights.ts` "top day" uses `deliveryDate` to find highest-spend day, but groups by date string
**File:** `src/dashboard/insights.ts:66-73`

```ts
const day = o.deliveryDate.substring(0, 10);
daySpend[day] = (daySpend[day] || 0) + o.subTotal;
```

This groups by calendar day (YYYY-MM-DD), which is correct. But `thisMonth` is filtered from `completedAll` (all orders), while the `allOrders` passed to `generateInsights` is `state.allOrdersData.orders`. The `orders` (first param, filtered) is used for category insight but `allOrders` is used for thisMonth/lastMonth. If a user filters by a specific shop, the "top day this month" insight still shows the top day across ALL orders for that month, not the shop's top day. Inconsistent — category insight reflects the filter, others don't.

---

### ISSUE-6: `heatmap.ts` re-attaches event listeners on every filter change
**File:** `src/dashboard/heatmap.ts:108-131`

`renderHeatmap` is called on every `applyFilters()` invocation. Each call:
1. Destroys and rebuilds the SVG
2. Attaches new `mousemove` + `mouseleave` + `click` listeners on the new SVG
3. Reuses the tooltip div (`document.querySelector('.heatmap-tooltip')`)

The SVG is replaced via `innerHTML`, so old listeners are garbage-collected — no leak. The tooltip is reused. This is architecturally fine but creates DOM churn on every filter change even though the heatmap always renders all orders (not filtered).

**Optimization opportunity:** Only re-render heatmap when `allOrdersData` changes, not on every filter.

---

### ISSUE-7: `shop-loyalty.ts` — `repeatRate` is always divided by constant 12 months
**File:** `src/dashboard/shop-loyalty.ts:39`

```ts
repeatRate: parseFloat((v.orders / MONTHS_SPAN).toFixed(1)),
```

`MONTHS_SPAN = 12` is hardcoded. A user with 3 months of data who has 6 orders at a shop gets `repeatRate = 0.5/month`, but the actual rate over their data span is `2/month`. The metric is consistently misleading for users with less than 12 months of data.

**Fix:** Calculate actual span from `firstOrder` to `lastOrder` dates, capped at 12 months.

---

### ISSUE-8: Pagination `btnNextPage`/`btnLastPage` — Infinity itemsPerPage edge case
**File:** `src/dashboard/results.ts:136-137`

```ts
btnNextPage.addEventListener('click', () => {
  const totalPages = Math.ceil(state.filteredOrders.length / state.itemsPerPage);
  if (state.currentPage < totalPages) { state.currentPage++; renderCurrentPage(); }
});
btnLastPage.addEventListener('click', () => {
  state.currentPage = Math.ceil(state.filteredOrders.length / state.itemsPerPage);
  renderCurrentPage();
});
```

When `itemsPerPage = Infinity`, `Math.ceil(N / Infinity) = 0`. So `btnLastPage` sets `currentPage = 0`. Then in `renderCurrentPage`:
```ts
const start = (state.currentPage - 1) * state.itemsPerPage; // (0-1)*Infinity = -Infinity
```
`slice(-Infinity, Infinity)` → returns entire array, so the page renders correctly by accident. But `currentPage = 0` is an invalid state. Pagination buttons would then show both prev/next as disabled (since `currentPage === 1` is false and `currentPage === totalPages` is `0 === 0` = true).

**Fix:** In `updatePaginationInfo`, `totalPages = itemsPerPage === Infinity ? 1 : Math.ceil(...)` already handles this correctly. But the inline listeners in results.ts compute `totalPages` independently without this guard.

---

## Edge Cases (cân nhắc)

### EDGE-1: `filterOrders` — dateRange `end` comparison is exclusive of end-of-day
**File:** `src/dashboard/filters.ts:53-54`

```ts
if (start && d < start) return false;
if (end && d > end) return false;
```

`d` is `new Date(order.deliveryDate)`. If `deliveryDate` is `"2026-03-05T00:00:00"` and `end` is `new Date("2026-03-05T23:59:59")`, this works. But if `deliveryDate` includes time past 23:59:59.000 (e.g., `"2026-03-05T23:59:59.500"`), it would be excluded. Low risk since Shopee API likely returns dates in a consistent format. Verify format from actual data.

---

### EDGE-2: `categorizeOrder` — normalize function does not strip `đ → d` before NFD
**File:** `src/dashboard/categories.ts:21-27`

```ts
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
```

After NFD decomposition, `đ` (U+0111, a precomposed character) decomposes differently from `d + combining stroke`. `đ` is NOT fully decomposed by NFD (it's a non-combining form), so `.replace(/đ/g, 'd')` still works on the post-NFD string. However, the uppercase `Đ` would not be caught because `toLowerCase()` runs first — so this is fine. Low risk.

---

### EDGE-3: `analyzeShopLoyalty` — shop name parsing splits on first ` - `
**File:** `src/dashboard/shop-loyalty.ts:21`, `insights.ts:36`

```ts
const shop = o.shopName.split(' - ')[1] || o.shopName;
```

If `shopName = "Shop A - Official Store"`, result = `"Official Store"`. If `shopName = "Just A Shop"` (no dash), falls back to full name. But if `shopName = "Shop - with - dashes"`, result = `"with - dashes"`. The intent seems to strip a prefix (likely Shopee's internal format). This inconsistent parsing could cause the same shop to be counted under two different keys if some orders have the prefix and others don't.

---

### EDGE-4: `updateActiveFilters` — chips are re-created on every render (event listener churn)
**File:** `src/dashboard/filters.ts:175-188`

`activeFiltersDiv.innerHTML = ...` on every `applyFilters()` call discards old chips and creates new ones, re-attaching `.chip-remove` listeners each time. No memory leak (old DOM removed), but it's inefficient. Not a bug.

---

### EDGE-5: `renderBudgetWidget` — `percent` when `monthlyLimit = 0`
**File:** `src/dashboard/budget.ts:70`

```ts
const percent = config.monthlyLimit > 0 ? spent / config.monthlyLimit : 0;
```

If user saves `monthlyLimit = 0` (empty input field), `Number('')` → `0`. The guard correctly returns `0`. Alert threshold check at line 81: `0 >= config.alertThreshold` → `0 >= 0.8` → false, so no spurious alert. Edge case handled.

---

### EDGE-6: `totalPages = 0` in pagination
**File:** `src/dashboard/table.ts:121, 154-155`

When `filteredOrders.length === 0`: `totalPages = Math.ceil(0 / 20) = 0`.

Line 154: `state.currentPage === totalPages` → `1 === 0` → false → Next button enabled when it shouldn't be.
Line 155: Same — Last button enabled.

This is a cosmetic bug (buttons are enabled but clicking them would compute `currentPage = 0`, and the table is already showing empty state). However, it's a real state issue.

**Fix:** `updatePaginationInfo` already partially guards this via `|| totalPages === 0` on line 154-155 — let me re-read...

Actually lines 154-155 DO include `|| totalPages === 0`:
```ts
.disabled = state.currentPage === totalPages || totalPages === 0;
```

This correctly disables Next/Last when `totalPages = 0`. My read was wrong — **this is handled correctly.**

---

### EDGE-7: `heatmap.ts` — date range boundary: `d < oneYearAgo` is strict less-than
**File:** `src/dashboard/heatmap.ts:24`

```ts
if (isNaN(d.getTime()) || d < oneYearAgo || d > now) return;
```

`oneYearAgo` is set to `new Date(now)` then `setFullYear(year - 1)` — it has a time component. So exactly 1 year ago today at the same millisecond would pass, but 1 year ago yesterday would be excluded if the time on that order is earlier than current time-of-day. Very low risk.

---

## Confirmed Correct (đã review, không có vấn đề)

- **`comparison.ts` — January edge case (lastMonth):** Correctly handles `currentMonth === 1 → lastMonth = 12, lastMonthYear = currentYear - 1` (line 31-32). Also correctly handled in `insights.ts:10-11`.
- **`comparison.ts` — `monthChange` null when no last month data:** `lastMonthTotal > 0` guard prevents division-by-zero and shows `t('comparison.noLastMonth')` appropriately.
- **`filterOrders` — year/month mutual exclusivity with dateRange:** The `useDateRange` flag is logically sound for the intended use case.
- **`sortOrders` — stable sort fallback:** Returns 0 for unknown fields, no crash.
- **`categorizeOrder` — RULES order (Sách before Điện tử):** Comment explains 'sach' vs 'bo sac' ordering concern — the rule order is intentionally defensive.
- **`renderCategoryChart` — chart destroy on re-render:** Destroys old chart before creating new one.
- **`loadBudgetConfig` — dual storage (chrome + localStorage):** Correct fallback chain.
- **`i18n/index.ts` — circular dependency risk:** `format.ts` imports `getLocale()` from `index.ts`. `index.ts` does NOT import from `format.ts`. No circular dependency.
- **`applyTranslations()` called on language switch:** `setLocale()` calls `applyTranslations()`. Language switch in results.ts calls `setLocale()`. Dynamic components (charts, table) are re-rendered separately. Confirmed correct.
- **`t()` — missing key fallback:** Returns key string, not undefined/null. Safe.
- **`updatePaginationInfo` — Infinity itemsPerPage:** `totalPages = itemsPerPage === Infinity ? 1 : ...` correctly returns 1. The `start`/`end` display also handles Infinity correctly (lines 122-123).
- **`table.ts` — `escapeHtml` on all user-facing strings:** XSS-safe rendering confirmed.
- **`heatmap.ts` — tooltip div reuse:** Existing tooltip reused; no duplicate appends.
- **`date-range-picker.ts` — `lastMonth` with January:** `month === 0 ? 11 : month - 1` correctly wraps to December.
- **`clearAllFilters()` — resets all state:** Clears year/month/status/search/category selects, `selectedDay`, `dateRange`, and dispatches `date-range-cleared`. Complete.

---

## Unresolved Questions

1. **BUG-2 intent:** Is the ghost-dateRange reactivation on month-chip removal a known/acceptable tradeoff, or an oversight? The `syncYearMonthSelects` approach for `thisMonth`/`lastMonth` suggests awareness of the tension.

2. **ISSUE-3 intent:** Are summary cards (currentMonthAmount etc.) intentionally always showing unfiltered data? If yes, should there be a visual indicator to clarify this to users?

3. **ISSUE-7 metric accuracy:** Is `repeatRate = orders / 12` documented as "average over past year" rather than "average over user's actual data span"? Users with 3-month histories will see misleadingly low rates.

4. **`dayOfMonth === 0` guard in `predictMonthEnd`:** Was this a copy-paste from another context, or is there a code path where `getDate()` could return 0? (It cannot in standard JS — this is confirmed dead code.)

5. **`deliveryDate` format from Shopee API:** Is it always ISO 8601 with a time component? Affects BUG-1 date comparison and EDGE-1 boundary correctness.
