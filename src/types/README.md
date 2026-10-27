# Shared data types

## Overview

[index.ts](./index.ts) defines TypeScript data contracts shared by order collection, storage, and UI code. It contains no runtime validation or behavior.

## Interface

- `StatusCode`: `0 | 3 | 4 | 7 | 8 | 9 | 12`.
- `SortDirection`: `'asc' | 'desc'`.
- `UserProfile`: required `username` and `avatar`; optional account, display-name, and shop identifiers.
- `Order`: order identity, product count, amounts, status, shop display name, product summary, and nullable delivery date/month/year; optional seller ID, refund amount, item total, and line items.
- `OrderData`: orders, total product count, total amount and formatted amount, fetch timestamp, optional user and cache timestamp.
- `DateRange`: nullable `Date` bounds named `start` and `end`.

## Invariants

- `Order.shopId`, `refundAmount`, and `itemsTotal` may be absent in older caches. Callers must preserve this backward-compatible optionality.
- `Order.deliveryDate`, `orderMonth`, and `orderYear` explicitly allow `null`.
- Line items have `name`, `quantity`, and `unitPrice`; their internal `OrderItem` interface is not exported separately.
- These declarations describe shapes only; external or persisted data still needs validation at its owning boundary.

## Side Effects

None. Type declarations do not fetch data, mutate storage, or touch the DOM.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`, including TypeScript checks. These commands were not run during documentation generation.
