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
