# ShopeeStatX

**Understand what you spend on Shopee.**

ShopeeStatX is a Chrome extension that turns your **Shopee Vietnam** order history into spending trends, searchable orders and a monthly budget — in your browser, without a separate account.

[**Install from the Chrome Web Store**](https://chromewebstore.google.com/detail/shopeestatx/hhcfonmapcabjmaghpapehegbmhdceim) · [User guide](Guide.md) · [Tiếng Việt](../../README.md)

![ShopeeStatX overview showing net spend, monthly comparisons, refunds, estimated savings and spending trends](../../store-assets/screenshots/01-summary-cards.png)

*Screenshots show the current Vietnamese interface with fictional demo data, not real purchases. The published Chrome Web Store build may differ from the source shown here.*

## Your purchases, in perspective

### See where your money goes

- Track **net spend**, order count and average order value, excluding cancelled and returned orders.
- Compare months and years, explore monthly spending and see the shops you spend most with.
- Review refunds and **estimated savings** when the order data supports them.

### Understand habits and plan your budget

- Explore frequently purchased products, high-unit-price items and shops you return to.
- Find patterns with a daily order heatmap and insights from your history.
- Set a monthly limit, choose a warning threshold and see a month-end spending estimate.

![Analysis showing spending insights, monthly budget, shopping habits and product rankings](../../store-assets/screenshots/02-charts.png)

### Find an order, then use your data

- Search by order ID, product, shop or description; filter by date, status and shop.
- Sort, paginate and expand an order to inspect its seller and individual items.
- Export **Excel, CSV or Print / PDF** for all matching results, not just the visible page.
- Create a share image containing aggregate figures only, without account names or order details.

![Expanded order details showing seller, delivery time, total and line items](../../store-assets/screenshots/03-order-details.png)

<details>
<summary>More screenshots: order list and popup</summary>

![Completed orders filtered and sorted by total](../../store-assets/screenshots/04-orders-table.png)

![ShopeeStatX popup on a neutral canvas, explicitly marked as a demo](../../store-assets/screenshots/05-popup.png)

</details>

Choose **Light, Dark or Auto**. On narrow containers, orders become cards while filters and details remain available. The interface is currently in Vietnamese.

## Get started

1. [Install ShopeeStatX](https://chromewebstore.google.com/detail/shopeestatx/hhcfonmapcabjmaghpapehegbmhdceim).
2. Open [shopee.vn](https://shopee.vn) and sign in to Shopee.
3. Open the extension and select **Bắt đầu phân tích**. A new dashboard tab shows the scan progress.

Revisit cached data or select **Làm mới** to refresh it. After switching Shopee accounts, start a new analysis from the popup. See the [user guide](Guide.md) for more detail.

## Privacy by design

- Uses your existing Shopee browser session; you do not enter a password into ShopeeStatX.
- Processes order history in the browser and caches it in `chrome.storage.local`, without syncing it to a ShopeeStatX server.
- No separate ShopeeStatX account, tracking or behavioral analytics.
- Creates exports and share images locally; you decide whether to send them anywhere.
- Uninstalling removes the extension's stored data. Files you downloaded remain on your computer.

Open **Chính sách bảo mật** in the popup to read the full privacy policy, including permissions and data removal.

## Scope and limitations

- Supports **shopee.vn** with Chrome 116+ and a signed-in Shopee session.
- Results depend on what Shopee returns. Shopee changes and expired sessions can interrupt scans.
- Date filters and shopping habits use delivery/receipt dates in the history, not checkout times.
- Savings and forecasts are estimates. Savings do not separately identify vouchers and shipping discounts.
- Budgets always use the current month across the full history, independently of the selected date range.
- Responsive layouts do not imply a Chrome Side Panel launcher; that option is not shipped.

## Build from source

Requires **Node.js 24+**, npm and Chrome 116+.

```bash
git clone https://github.com/ninhhaidang/shopeestatx.git
cd shopeestatx
npm ci
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the generated **`dist/`** directory — not the source directory.

### Develop with demo data

Run `npm run dev`, then open the [demo dashboard](http://localhost:5173/dashboard-app/dashboard.html). No extension or Shopee account is needed; the demo makes no Shopee API requests. Adjust the port if Vite chooses another one.

Use the [wide preview](http://localhost:5173/dev-preview?width=tab&theme=light) or [400px container](http://localhost:5173/dev-preview?width=400&theme=dark) to inspect responsive layouts. These preview routes are dev-only and are not included in the extension package.

Before contributing, run:

```bash
npm ci
npm run verify
```

The CI-equivalent command runs typechecking, Knip unused-code checks, tests with coverage, the production build and injected-script checks.

Built with React 19, Tailwind CSS v4 and Vite, with Chart.js for charts and ExcelJS for XLSX exports. See the [feature inventory](../features.md), [architecture decisions](../adr/), [Shopee API constraints](../shopee-order-api.md) and [screenshot guidelines](../../store-assets/screenshots/README.md).

## Feedback and support

[Report a bug](https://github.com/ninhhaidang/shopeestatx/issues/new) with the extension version, Chrome version and reproduction steps. Never post cookies, tokens, account details or private order history; redact screenshots before sharing.

Created by [Ninh Hải Đăng](https://github.com/ninhhaidang). [Support the project](https://www.buymeacoffee.com/ninhhaidang).

ShopeeStatX is an independent project, not affiliated with or endorsed by Shopee. Released under the [MIT License](../../LICENSE).
