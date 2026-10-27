# Overview components

## Overview

Warm-style overview presentation and shared period-comparison text. Financial calculations belong to `src/dashboard/overview.ts`; these components render their results.

## Interface

- [OverviewTabWarm.tsx](OverviewTabWarm.tsx): `OverviewTabWarm()` reads dashboard context and renders net spend, order/refund/savings summaries, monthly SVG chart with a table alternative, top-shop breakdown, and share-image action.
- [ChangeLine.tsx](ChangeLine.tsx): `ChangeLine({ unit, change, testId })` accepts `unit: 'month' | 'year'`, a `PeriodChange`, and a test identifier. Used by both overview styles.

## Invariants

- Components requiring context render beneath `DashboardContext`; `orders` is range-filtered, while `data.orders` is complete history.
- Overview totals use filtered orders. Month/year comparisons use complete history anchored by `rangeEnd(range, now)`, not the range-total amount.
- Empty filtered orders render the shared range-reset message. Cache rescan detection examines complete history; stale refund/savings values display unavailable text.
- `ChangeLine` treats a null percentage as no prior-period comparison, not zero change, and names both comparison periods.
- Top-shop percentages use the sum of displayed top-shop amounts as denominator.

## Side Effects

- Share action calls `downloadShareImage` with overview data, initiating image download.
- Shared empty/rescan notices can reset the global range or invoke host refresh. Rendering and comparison formatting do not persist data.

## Verification

From repository root, run `npm test`; full gate: `npm ci && npm run verify`. No commands were executed while generating this contract.
