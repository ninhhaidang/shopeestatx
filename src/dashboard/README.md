# Dashboard analytics and exports

## Overview

This directory transforms normalized cached orders into dashboard figures, date ranges, search results, budget progress, and downloadable reports. Most modules are pure calculations; storage, browser downloads, canvas drawing, and demo-data generation are explicit exceptions. It neither fetches Shopee orders nor renders React screens.

Inputs use `Order`, `OrderData`, `DateRange`, and related types from `src/types/index.ts`. Translation and currency formatting come from `src/i18n`; budget storage keys come from `src/config.ts`. Callers choose which orders to pass: these modules do not apply one implicit global filter to every calculation.

## Interface

| File | Public contract |
| --- | --- |
| [order-status.ts](order-status.ts) | `isExcludedOrder(order)` identifies cancelled (`4`) and returned (`12`) orders. `ORDER_STATUSES` maps supported status codes to translation keys. |
| [month.ts](month.ts) | `OrderMonth`, `localDateKey(date)`, and `monthOf(order)` establish local delivery-calendar dates. `monthSpend(orders, month, year)` and `yearSpend(orders, year)` total included orders; `orderYears(orders)` lists dated years newest first. Months are 1–12. |
| [range.ts](range.ts) | `RangePreset`, `RangeSelection`, and `RANGE_PRESETS` describe user selections. `resolveRange(selection, now)` returns inclusive bounds with null open ends. `filterByRange(orders, range)` filters delivery dates; `rangeEnd(range, now)` caps the anchor at now. |
| [stats.ts](stats.ts) | `computeStats(orders): Stats` returns spend, excluded-order value/count, estimated savings, delivery weekday/hour peaks, month streak, daily spending rate, and top-ten item rankings. `needsRescan(orders)` detects missing `refundAmount`, `itemsTotal`, or `items` fields. |
| [overview.ts](overview.ts) | `computeOverview(orders): Overview` combines `Stats` with included order count, average order value, chronological monthly totals, and five top-spend shops. `monthChange(orders, anchor): MonthChange` and `yearChange(orders, anchor): PeriodChange` compare adjacent calendar periods. |
| [shop.ts](shop.ts) | `shopDisplayName(shopName)` strips the historical username prefix for display. `shopIdentity(order)` groups by seller ID, falling back to the historical username. |
| [shop-loyalty.ts](shop-loyalty.ts) | `analyzeShopLoyalty(allOrders): ShopLoyalty[]` returns up to ten shops with at least three included orders, sorted by order count, with spend, date span, average value, and orders-per-month repeat rate. |
| [heatmap.ts](heatmap.ts) | `heatmapWindow(range, now)` chooses a rolling twelve-month calendar window ending at the range anchor. `buildHeatmapGrid(orders, start, end): HeatmapGrid` returns Sunday-first weekly cells, month labels, nonempty days, and total order count. |
| [insights.ts](insights.ts) | `generateInsights(allOrders, now?)` returns up to five Vietnamese insight strings about calendar-month spend, shops, monthly frequency, peak day, and excluded-order value. |
| [predictions.ts](predictions.ts) | `predictMonthEnd(allOrders, now?)` extrapolates current-calendar-month spend using elapsed days and month length; returns zero before day three or when current spend is zero. |
| [budget.ts](budget.ts) | `BudgetConfig`, `loadBudgetConfig()`, and `saveBudgetConfig(config)` persist monthly settings. `currentMonthSpend(orders, now)` delegates calendar-month spend. `budgetProgress(spent, config, prediction?): BudgetProgress` calculates ratio, rounded percent, color band, alert, and predicted excess. |
| [order-query.ts](order-query.ts) | `sortOrders(orders, field, direction)` returns a sorted copy for delivery date, subtotal, or status code. `matchesStatusAndSearch(order, status, searchTerm)` combines an optional status code with a caller-lowercased search term across ID, product, seller, summary, and status. |
| [merge.ts](merge.ts) | `mergeOrderData(cached, fresh, now)` returns `{ data, added }`: merges by string order ID, keeps fresh values and cached-only orders, and recalculates totals and cache timestamp. |
| [export.ts](export.ts) | `exportToExcel(filtered): Promise<void>` downloads XLSX through lazy-loaded ExcelJS. `exportToCSV(filtered)` downloads UTF-8 BOM CSV. `exportToPDF()` opens browser print; print CSS owns layout. |
| [share-image.ts](share-image.ts) | `drawShareImage(canvas, stats, financialAvailable?)` paints fixed 720×520 artwork. `downloadShareImage(stats, financialAvailable?)` downloads that card as PNG. |
| [mock-data.ts](mock-data.ts) | `mockData: OrderData` supplies forty generated preview/development orders and a demo user outside the extension context. |

## Invariants

- Spend calculations exclude only status codes `4` and `12`; they do not require completed status `3`. Excluded-order `refundAmount` totals are available source values, not verified refund transactions. Estimated savings sum positive `itemsTotal - subTotal` differences where that source field exists.
- Calendar grouping uses the local delivery date, not legacy `orderMonth`/`orderYear` fields. `monthOf` rejects absent or invalid dates. Undated included orders still count in overall spend and order totals, but not date-based buckets or the dated-spend daily rate.
- Resolved date bounds are inclusive. A fully open range returns the original order array; bounded ranges remove orders without a delivery date. `filterByRange` does not validate malformed nonempty date strings or custom-range input, so callers must supply valid dates and selections.
- Statistics use included orders' valid delivery dates for peak weekday/hour and consecutive-month streak. Weekday ties prefer Monday through Sunday; hour ties prefer earlier hours. Daily rate uses the inclusive first-to-last dated calendar span. Item rankings use available `items`, group by item name, and break equal values by name.
- Period-change percentages are rounded to one decimal and are null when previous spend is not positive. Overview average order value is zero for no included orders.
- Shop identity is independent of display-name stripping. Loyalty counts all included shop orders, uses valid dates for first/last dates, and divides order count by an inclusive month span clamped to 1–12; absent dates produce empty date strings.
- Heatmap cells count included orders, not products or spend. Intensities are 0–4 using quartiles of nonempty-day counts; out-of-window cells are null. Its window follows the global range end, not its start, so callers should pass whole history rather than prefiltering to that range. Leap-day window starts are clamped before advancing one day.
- Budget defaults are disabled, VND 5,000,000 monthly limit, and 0.8 alert threshold. Loaded JSON is not schema-validated. Progress ratios are not capped at 1; `alert` depends on the threshold even when disabled, while `predictedOver` requires an enabled positive limit. Callers control whether disabled budget UI is shown.
- Merge normalizes IDs to strings and deduplicates each input by ID. Fresh records replace cached records rather than merging individual fields; fresh user data falls back to cached user data. `totalCount` sums product quantities, not order count. Merge returns data but does not persist it.
- Export functions consume caller-selected orders without excluding statuses or reapplying date/search filters. CSV escapes quotes and prefixes formula-like merchant text with an apostrophe; order IDs remain text in XLSX. Dates in tabular downloads use `vi-VN` formatting.
- Share cards include aggregate figures only: no order IDs, shop names, or product names. `financialAvailable = false` hides savings and excluded-order value, not net spend. The artwork is fixed rather than theme-dependent and requires a working 2D canvas context.

## Side Effects

- `loadBudgetConfig` and `saveBudgetConfig` use `chrome.storage.local` when available, otherwise `localStorage`. Chrome read errors log and return defaults; fallback read/parse failures return defaults. Chrome write errors log and reject; fallback writes may throw.
- XLSX and CSV exports create Blob/object URLs and trigger anchor downloads, then revoke those URLs. Excel export alerts on empty input and logs/alerts on failures; CSV can download headers for an empty array. PDF invokes `window.print()`.
- Share-image drawing resizes and paints the supplied canvas. Downloading creates a canvas, converts it to a PNG data URL, and clicks a download anchor.
- Importing `mock-data.ts` generates data immediately using randomness and the current timestamp; its results are not deterministic.
- Other modules do not access storage, perform network requests, or mutate the DOM. Optional `now` defaults in insights/predictions read the current clock; formatting depends on shared i18n state.

## Verification

Run commands from the repository root, not this directory:

```sh
npm test
npm ci && npm run verify
```

`npm test` runs Vitest. The full gate runs typechecking, Knip, coverage tests, the Vite build, and the injected-script check. These commands are documented targets; they were not run while generating this contract.
