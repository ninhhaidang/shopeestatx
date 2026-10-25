# Shopee order-list API

Source of truth for what ShopeeStatX can read. Verified 2026-10-24 against a live response, captured from the page's own request (no extra call).

Endpoint: `/api/v4/order/get_all_order_and_checkout_list` (the only Shopee request; `tests/shopee-requests.test.ts` enforces this).

## What an order carries

- `info_card` has only `order_id`, `order_list_cards`, `product_count`, `subtotal`, `final_total`. No voucher, shipping fee or refund field. In sampled orders `subtotal` equals `final_total`.
- Amounts are in units of 1/100000 đ.
- An item has `item_price`, `order_price`, `amount`; some also have `price_before_discount`.
- A cancelled order keeps its `subtotal`, so the original amount survives (stored as `refundAmount`).
- Cancelled orders have no `shipping`, so no delivery time.
- A split shipment spreads items across `parcel_cards`; legacy shape keeps them on `product_info`.

## Consequences

- Voucher and freeship savings cannot be separated; `Tiết kiệm ước tính` is items total minus paid (see `GLOSSARY.md`).
- Only delivery/receipt time exists, not order time.
- Fixtures: `tests/fixtures/shopee-order-page*.json` carry the real field layout with arbitrary amounts.

## Collection and provenance

- `new_data.next_offset` is authoritative, including short/empty intermediate pages and a nonempty final page with `-1`. Legacy responses without this field retain limit/offset pagination. Invalid or nonadvancing cursors fail rather than persist a partial snapshot as complete.
- Order IDs and supplied shop IDs are normalized as strings. Repeated order IDs use the last occurrence in a scan, and money/product totals are recomputed from unique rows.
- A delivery date requires the supplied delivery/receipt tracking timestamp. Neither order-ID digits nor an arbitrary status `update_time` establish delivery. Missing dates stay null; old inferred cache dates require a fresh analysis rather than another heuristic.
- Local account identity is captured before collection and checked during/after fetching. A detectable change rejects the scan without saving partial data. Missing/noncomparable identities are not proof of a change; undetectable transitions remain a limitation.
- Cache writes use an extension-origin Web Lock plus scan generations/order versions. A replacement fences older results; a slower merge preserves orders and newer per-order values already committed by another dashboard. The bridge forwards only scan-tagged progress; the host checks its tab and generation.

## Origin investigation (2026-10-25)

Popup acceptance remains HTTP(S) `shopee.vn` and subdomains; this remediation does not narrow that published behavior or expand permissions. The reliable documented usage remains the logged-in buyer page at `https://shopee.vn`.

- Permanent host permission covers `https://shopee.vn/*`; `activeTab` can temporarily authorize the user-invoked source tab. Opening a dashboard does not revoke that grant; navigating to a different origin or closing the source tab can revoke it ([Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)).
- The collector runs in MAIN and uses canonical `https://shopee.vn` with default `credentials: same-origin`. A request from HTTP or a subdomain is cross-origin and omits cookies under that mode ([Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)).
- Profile localStorage is origin-scoped; another origin cannot read the canonical page's storage, although it may maintain its own keys ([localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)).
- Exact Shopee redirects, CORS headers and authenticated outcomes on those origins were not verified. No Shopee API probe was sent. Passive inspection of the buyer site's own requests/storage is the next evidence source; do not assume a particular HTTP error or empty storage on every subdomain.
- Recommendation for a separate product decision: make the accepted-origin promise match proven buyer-origin support. Do not silently change acceptance, widen host permissions or add cross-origin credentials here. Credentials alone do not force a CORS preflight and do not establish server support.

## Dependency investigation (2026-10-25)

`npm audit --omit=dev` reports four entries: high `brace-expansion` and `tmp`; moderate `uuid` and `exceljs` through `uuid`. Installed versions are ExcelJS 4.4.0, uuid 8.3.2, tmp 0.2.5 and brace-expansion 1.1.12/2.0.2.

- ExcelJS declares the browser entry `dist/exceljs.min.js`. Its shipped source map lists 534 sources: neither tmp nor brace-expansion is present; their Node filesystem/archive dependency paths are outside that browser bundle.
- uuid is bundled, including v3/v5 implementations. ExcelJS's only uuid import in that source map is the conditional-formatting transform, which calls v4 without an output buffer. The reported [uuid buffer advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq) concerns v3/v5/v6 with caller-supplied buffers, not that call. ShopeeStatX writes a new in-memory workbook; it does not import arbitrary workbooks or invoke those UUID methods.
- Upstream warnings remain real for affected Node consumers: [tmp path traversal](https://github.com/advisories/GHSA-ph9p-34f9-6g65), [brace-expansion resource exhaustion](https://github.com/advisories/GHSA-mh99-v99m-4gvg). Bundle reachability evidence is not a universal security guarantee.
- Decision: retain current dependencies and the existing CI audit policy for this bounded remediation; no reachable instance of these reported paths was established in the current browser export. Do not blindly downgrade ExcelJS to satisfy npm's major-version suggestion. Reassess before adding Node execution, workbook import, UUID buffer calls or changing browser entry resolution.
