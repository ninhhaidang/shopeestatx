# Dashboard tabs

## Overview

Three dashboard screens consume shared global range/data context. Fintech-style tab entry points live here; child directories hold shared helpers and warm-style counterparts. Style/tab selection belongs to `src/dashboard-app/tabs.tsx`, outside this directory.

## Interface

- [OverviewTab.tsx](OverviewTab.tsx): `OverviewTab()` renders net spend, period comparisons, metric tiles, monthly spending, top shops, and share-image action.
- [OrdersTab.tsx](OrdersTab.tsx): `OrdersTab()` renders searchable, filterable, sortable orders with paging, inline detail, downloads, and print.
- [AnalysisTab.tsx](AnalysisTab.tsx): `AnalysisTab()` composes insights, budget/prediction, habits, product rankings, heatmap, and shop loyalty.

### Child boundaries

| Contract | Responsibility |
| --- | --- |
| [overview](overview/README.md) | Warm overview and comparison text shared by both styles. |
| [orders](orders/README.md) | Warm browser, fintech row/detail/paging helpers, and print sheet. |
| [analysis](analysis/README.md) | Warm analysis plus budget, loyalty, insights, and heatmap views. |

## Invariants

- All tab entry points render beneath `DashboardContext` and accept no props. Context supplies full history, range-filtered orders, resolved range, clock, refresh, and range reset.
- Empty filtered orders show the shared range-reset notice.
- Overview aggregates filtered orders; month/year comparisons use full history anchored to the range end. Cache schema/rescan checks inspect full history.
- Order search, status/shop selection, and sorting operate within the global range before pagination. Exports and print include the entire matching sorted result set.
- Analysis habits/products use filtered orders; insights/loyalty use full history; budget uses the current calendar month; heatmap uses its range-anchored window over full history.
- Business calculations stay in `src/dashboard`; these views own presentation and interaction state.

## Side Effects

- Overview share downloads an image through its domain helper.
- Orders actions initiate CSV/Excel downloads or portal a print sheet into `document.body` and call `window.print()`.
- Budget children load and save budget settings. Shared notices delegate rescan and range reset to context.
- Tabs do not directly call Shopee APIs or persist order caches.

## Verification

From repository root, run `npm test`; full gate: `npm ci && npm run verify`. No commands were executed while generating this contract.
