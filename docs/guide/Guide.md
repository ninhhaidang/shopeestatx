# ShopeeStatX User Guide

The dashboard has three screens in the top navigation: **Overview** (Tổng quan), **Analysis** (Phân tích) and **Orders** (Đơn hàng). On narrow widths (side panel, small windows) the navigation moves to the bottom and the orders table becomes a card list. Pick **Auto / Light / Dark** colors at the top.

## Getting started

1. Log in to [shopee.vn](https://shopee.vn) (or another supported Shopee domain).
2. Click the ShopeeStatX icon in the Chrome toolbar, then **Start analysis**.
3. The dashboard opens in a new tab and shows how many orders have been loaded. Data is cached locally in your browser.

## Date range

The **Time range** picker at the top applies to all three screens: quick choices (All, this month, last month, last 3 months, this year) or a custom **From / To** date. If a range has no orders, use **View all**.

## Overview

- **Net spend**: total of valid orders, with the change against last month.
- Four tiles: orders, average per order, refunds, estimated savings.
- **Spend per month** chart (with a data table) and **Top shops**.
- The share button creates a PNG with aggregate figures only (no shop names, order IDs or product names).

Cancelled and returned orders are not counted as spending. Estimated savings is items total minus amount paid; Shopee does not expose vouchers or free shipping separately (see [docs/shopee-order-api.md](../shopee-order-api.md)). If refunds or savings show "—", the cache comes from an older version: use the re-scan button.

## Orders

- Search by order ID, product or shop (results update as you type).
- Filter by status and shop; sort by delivery date, status or total; paginate; open an order for its product details.
- Export to Excel (.xlsx), CSV or Print / PDF. Exports follow the active range and filters.

## Analysis

- Daily order **heatmap** (up to the latest 12 months of the selected range).
- **Buying habits**: busiest weekday and hour, longest monthly streak, top products.
- Automatic **insights**.
- **Prediction and budget**: set a monthly limit and warning threshold; the end-of-month projection warns if you may exceed it.

## Refreshing data

Click **Refresh** to fetch new orders from Shopee; they are merged into the cache. Keep a logged-in Shopee tab open.

## FAQ

- **Not working?** Make sure you are logged in and opened the popup on a Shopee tab. If progress stalls, reload the Shopee page and retry.
- **Total does not match?** Cancelled and returned orders are excluded; amounts include discounts and vouchers.
- **Where is my data?** Only in your browser's `chrome.storage.local`. Nothing is sent anywhere.

## Support

Open an issue on [GitHub](https://github.com/ninhhaidang/shopeestatx/issues).
