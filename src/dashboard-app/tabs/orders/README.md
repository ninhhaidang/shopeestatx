# Order views and controls

## Overview

Order receipt/table helpers, pagination, detail expansion, print sheet, and complete warm-style order browser. Filtering and sorting rules come from `src/dashboard/order-query.ts`; export generation comes from `src/dashboard/export.ts`.

## Interface

- [OrdersTabWarm.tsx](OrdersTabWarm.tsx): `OrdersTabWarm()` consumes dashboard context and owns search, status/shop filters, sorting, paging, expanded receipts, export, and print state.
- [OrderRow.tsx](OrderRow.tsx): `OrderRow({ order, expanded, onToggle })` renders the fintech row/card and its optional detail region.
- [OrderDetail.tsx](OrderDetail.tsx) and [OrderDetailWarm.tsx](OrderDetailWarm.tsx): `OrderDetail` / `OrderDetailWarm({ order, id, excluded })` render seller, delivery time, total, and item detail.
- [Pagination.tsx](Pagination.tsx): `Pagination({ page, pages, onPage })` renders previous/next and numbered controls; caller provides valid one-based page bounds.
- [PageButton.tsx](PageButton.tsx): `PageButton({ label, current?, disabled?, onClick, children })` supplies accessible labels and current-page semantics.
- [PrintSheet.tsx](PrintSheet.tsx): `PrintSheet({ orders: Order[] })` renders the print-only `orders-print` table.

## Invariants

- Warm browser starts with range-filtered context orders. Shop identity is distinct from display name; a shop selection missing from current options is ignored.
- Search/status/shop filters and sorting precede paging. Page sizes are 20, 50, 100, or all; page count is at least one and displayed page is clamped to available pages.
- Export and print use every matching sorted order, not just the current page. Empty matching results disable export/print controls.
- Excluded orders retain visible refund/exclusion information. Detail uses structured items when present, otherwise `productSummary || name`.
- Expansion buttons identify their detail regions through `aria-expanded` and `aria-controls`; Shopee links open with `noopener noreferrer`.
- Empty global-range orders use the shared range-reset notice; local-filter emptiness offers a local filter reset.

## Side Effects

- Browser actions initiate CSV/Excel downloads through export helpers.
- Print action portals the sheet into `document.body`, invokes `window.print()` after rendering, then clears print state. Print visibility depends on `src/ui/styles/app.css`.
- Order links navigate to Shopee in a new tab. Expansion, filters, sorting, and paging otherwise change local React state only.

## Verification

From repository root, run `npm test`; full gate: `npm ci && npm run verify`. No commands were executed while generating this contract.
