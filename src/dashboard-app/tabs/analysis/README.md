# Analysis components

## Overview

Analysis presentation for insights, shopping activity, repeat shops, current-month budget, and prediction. Domain calculations live in `src/dashboard`; this directory composes React views and budget editing.

## Interface

- [AnalysisTabWarm.tsx](AnalysisTabWarm.tsx): `AnalysisTabWarm()` consumes dashboard context and renders the warm narrative analysis screen.
- [Budget.tsx](Budget.tsx) and [BudgetWarm.tsx](BudgetWarm.tsx): `Budget` / `BudgetWarm({ allOrders: Order[], now: Date })` load/edit budget settings and show current-month spending and predicted month-end totals.
- [Loyalty.tsx](Loyalty.tsx) and [LoyaltyWarm.tsx](LoyaltyWarm.tsx): `Loyalty` / `LoyaltyWarm({ orders: Order[] })` render `analyzeShopLoyalty` results as a table or receipt list.
- [Insights.tsx](Insights.tsx): `Insights({ orders: Order[], now: Date })` renders generated observations or an empty message.
- [Heatmap.tsx](Heatmap.tsx): `Heatmap({ orders: Order[], range: DateRange, now: Date })` renders activity SVG and a table alternative from `heatmapWindow` and `buildHeatmapGrid`.

## Invariants

- Warm tab requires dashboard context. Habits and product rankings use range-filtered orders; insights, loyalty, and budget use complete history.
- Budget and prediction always describe the calendar month containing `now`, independent of the global date filter. Budget views render nothing until settings load.
- Budget edits become component state only after `saveBudgetConfig` succeeds; save failures keep the form visible and show an error. Unmount guards prevent the initial settings load from updating an unmounted view.
- Heatmap uses complete history within the twelve-month window ending at the selected range's last day, not just the already filtered order list.
- Empty filtered orders return the shared range-reset notice before the warm analysis sections render. Rescan detection uses complete history and suppresses stale product rankings.
- Domain modules, not these components, define spending, loyalty, prediction, and heatmap calculations.

## Side Effects

- Budget views read settings on mount through `loadBudgetConfig` and persist explicit saves through `saveBudgetConfig` in `src/dashboard/budget.ts`.
- Forms update local editing state. Shared notices can reset the global range or request a host scan.
- Other analysis rendering derives output from props/context without directly issuing Shopee requests or storing order data.

## Verification

From repository root, run `npm test`; full gate: `npm ci && npm run verify`. No commands were executed while generating this contract.
