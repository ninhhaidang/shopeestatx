# Analysis components

## Overview

Analysis presentation for insights, shopping activity, repeat shops, current-month budget, and prediction. Domain calculations live in `src/dashboard`; this directory composes React views and budget editing.

## Interface

- [Budget.tsx](Budget.tsx): `Budget({ allOrders: Order[], now: Date })` loads/edits budget settings and shows current-month spending and predicted month-end totals.
- [Loyalty.tsx](Loyalty.tsx): `Loyalty({ orders: Order[] })` renders `analyzeShopLoyalty` results as a table.
- [Insights.tsx](Insights.tsx): `Insights({ orders: Order[], now: Date })` renders generated observations or an empty message.
- [Heatmap.tsx](Heatmap.tsx): `Heatmap({ orders: Order[], range: DateRange, now: Date })` renders activity SVG and a table alternative from `heatmapWindow` and `buildHeatmapGrid`.

## Invariants

- Budget and prediction always describe the calendar month containing `now`, independent of the global date filter. Budget views render nothing until settings load, and a load-error message when loading fails.
- Budget edits become component state only after `saveBudgetConfig` succeeds; save failures keep the form visible and show an error. Unmount guards prevent the initial settings load from updating an unmounted view.
- Heatmap uses complete history within the twelve-month window ending at the selected range's last day, not just the already filtered order list.
- Domain modules, not these components, define spending, loyalty, prediction, and heatmap calculations.

## Side Effects

- Budget views read settings on mount through `loadBudgetConfig` and persist explicit saves through `saveBudgetConfig` in `src/dashboard/budget.ts`.
- Forms update local editing state. Shared notices can reset the global range or request a host scan.
- Other analysis rendering derives output from props/context without directly issuing Shopee requests or storing order data.

## Verification

From repository root, run `npm test`; full gate: `npm ci && npm run verify`. No commands were executed while generating this contract.
