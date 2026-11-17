# Product screenshots

Five **1280 × 800 PNG** images show the current dashboard and popup. They are shared by the Vietnamese/English READMEs and the Chrome Web Store listing. All images use fictional demo orders; never capture a real account or order history.

## Current set

Captured from the 3.5.0 source after the November 2026 redesign. These images describe the source build, not a claim that this build has already been published to the Store.

| File | Captured state |
| --- | --- |
| `01-summary-cards.png` | Overview: net spend, same-period month/year comparisons, refunds, estimated savings, monthly chart with average line and top shops |
| `02-charts.png` | Analysis: spending insights, enabled monthly budget, daily heatmap, habits; repeat shops and products continue below the viewport |
| `03-order-details.png` | Orders: grouped by month, one completed order expanded with line items and estimated savings |
| `04-share-image.png` | Overview with the share dialog open: Vận đơn template, square ratio, aggregate figures only |
| `05-popup.png` | Actual 380px popup centered on a neutral 1280 × 800 canvas; Start enabled and cached-orders summary through a mock host, with an explicit demo caption |

## Capture rules

1. Run `npm run dev`; open `http://localhost:5173/dashboard-app/dashboard.html`. Outside the extension, the dashboard uses mock data and makes no Shopee requests.
2. Use a **1280 × 800 CSS-pixel viewport at device scale factor 1**, Light mode, normal zoom. Confirm the saved PNG is also 1280 × 800; a high-DPI screenshot is not the same size as its viewport.
3. Use deterministic fictional data. This set uses 69 orders (three a month) from fictional products/shops, delivery dates from January 2025 through mid-November 2026, synthetic order IDs beginning `251202000100001`, and account `demo_user`. Fix the dashboard clock to 17 November 2026, 20:30. Set a 3,000,000₫ monthly budget at an 80% warning threshold so the budget and forecast have representative content.
4. Use real components and host seams to provide the fixture. Do not change production UI, hide controls, alter calculations or paint data onto the screenshot. Give the demo orders item totals above the paid amount to demonstrate estimated savings; keep line-item totals consistent with those values.
5. Wait for fonts, data and charts to render. Keep the dashboard at the top of its scroll region for this set. Remove transient refresh notices by opening a clean cached-data session, not by hiding the notice element.
6. Capture Orders with a real expanded row, and the share dialog opened from Overview with its default template. Keep labels and amounts readable; do not include private data or browser credentials.
7. For the popup, mock the Chrome host's active-tab lookup rather than opening an authenticated Shopee page. Center the actual popup on a neutral canvas and label it **Dữ liệu minh họa · Không phải tài khoản Shopee thật**. Do not imply a live session.
8. Inspect every saved PNG, check dimensions and paths, and verify the images render in both READMEs. These are source screenshots, so recapture after visible UI changes before submitting a Store update.

The capture fixture and framing belong to the screenshot session only. Do not ship fake data or screenshot-only styling in the extension.
