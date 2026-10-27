# Content collector

## Overview

[content.js](./content.js) collects Shopee order history inside the tab's MAIN world. Its async IIFE returns collection results to the extension's script-injection caller; it is not an importable module.

## Interface

- Reads optional `window.__shopeestatxScanId` and includes it in page progress messages: `{ source: 'shopee-stats', type: 'progress', scanId, count }`.
- Returns `{ success: true, data }` with user profile, deduplicated orders, product count, total amount, formatted amount, and fetch timestamp; collection errors return `{ success: false, error }`.
- Reads profile from `mini-session`, falling back to `@shopee/account-basic-info` in Shopee local storage.
- Calls only `https://shopee.vn/api/v4/order/get_all_order_and_checkout_list`, with `limit=20` and offset pagination. Supports current `new_data` and legacy `data.order_data.details_list` response shapes.
- Result data follows shared shapes in `src/types/index.ts`; progress crosses into extension context through `src/bridge/bridge.ts`.

## Invariants

- All declarations stay inside the IIFE so repeated classic-script injections do not redeclare page-global lexical bindings.
- Explicit cursors must be safe integers that advance, or `-1` for completion. Legacy pagination stops on an empty page.
- HTTP errors, Shopee errors, invalid response lists, and detected account changes fail collection rather than return partial success. Account comparison uses shared stable IDs first; username comparison is only a fallback when neither profile has IDs.
- Orders deduplicate by string order ID. Missing info cards or order cards are skipped.
- Monetary source values divide by `100000`. Cancelled/returned order subtotals become zero; their original amount remains in `refundAmount`.
- Split parcels contribute all item groups. Delivery time comes from positive tracking timestamps; cancelled orders have no delivery timestamp. `totalCount` sums product counts, not order count.

## Side Effects

Reads Shopee local storage, performs authenticated page-context fetches, posts progress with `window.postMessage`, and logs profile/collection failures. Does not write extension storage or introduce another Shopee endpoint. Progress count is a collection estimate, not the final deduplicated order count.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify` (includes built injected-script validation). These commands were not run during documentation generation.
