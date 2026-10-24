# ShopeeStatX - Shopee Order Statistics

<div align="center">

![Ngôn ngữ](https://img.shields.io/badge/Ngôn_ngữ-gray?style=for-the-badge&logo=googletranslate&logoColor=white)
[![Tiếng Việt](https://img.shields.io/badge/Tiếng_Việt-red?style=for-the-badge)](../README.md)
[![English](https://img.shields.io/badge/English-blue?style=for-the-badge)](#)

---

[![GitHub stars](https://img.shields.io/github/stars/ninhhaidang/shopee-orders-statics?style=for-the-badge&logo=github&label=Star%20this%20repo)](https://github.com/ninhhaidang/shopeestatx/stargazers)

</div>

> **Version 3.1** - React + Tailwind UI, Light/Dark

A Chrome extension to track and analyze your Shopee spending in detail with intuitive visualizations.

## 📸 Screenshots

### Popup Interface
![Popup Interface](../../store-assets/screenshots/05-popup.png)

### Analysis Interface
![Analysis Interface 1](../../store-assets/screenshots/02-charts.png)

![Analysis Interface 2](../../store-assets/screenshots/04-orders-table.png)

## Key Features

### 📊 Overview
- **Net spend** (cancelled and returned orders excluded), compared with last month
- Order count, average per order, refunds, estimated savings
- Spend per month chart (with a data table) and top shops
- Share image containing aggregate figures only

### 🗓️ Global date range
- One range picker applies to Overview, Analysis and Orders

### 📋 Orders
- Search by product, shop or order ID; filter by status and shop; sort; paginate
- Order details; on narrow widths the table becomes a card list
- Export to Excel (.xlsx), CSV or Print / PDF, matching the active filters

### 🔎 Analysis
- Daily order heatmap, buying habits, top products, automatic insights
- End-of-month prediction and a monthly budget with warnings

### 🎨 Interface
- One adaptive UI for tab, side panel and popup; Light / Dark / Auto

---

## ⚙️ Installation

### From the Chrome Web Store (recommended)

[Install ShopeeStatX](https://chromewebstore.google.com/detail/shopeestatx/hhcfonmapcabjmaghpapehegbmhdceim).

### Manual install (Developer mode)

1. Download source code:
   - **Download ZIP file**: Download from [Releases](https://github.com/ninhhaidang/shopeestatx/releases) and extract
   - **Or Clone repository**:
   ```bash
   git clone https://github.com/ninhhaidang/shopeestatx.git
   ```

2. Open Chrome, go to `chrome://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked" and select the `ShopeeStatX` folder

## 📖 User Guide

See detailed guide at [User Guide](Guide.md)

**Quick Start:**
1. Log in to your [Shopee](https://shopee.vn) account
2. Enable ShopeeStatX extension in Chrome toolbar
3. Click "Start Analysis"
4. Use filters and charts to analyze your spending

## 🛠️ Technology

- Chrome Extension API (Manifest V3)
- React 19, Radix UI, Tailwind CSS v4, Vite
- Chart.js
- ExcelJS (XLSX)
- Shopee API: `v4/order/get_all_order_and_checkout_list`

## ⚠️ Notes

- Extension only works when logged into Shopee
- Data fetched directly from Shopee API
- Delivery date: When order was successfully delivered/received
- Cancelled orders: No delivery date
- Total spending excludes cancelled and returned orders
- Data only displays in current session, not stored

## License

[MIT License](../LICENSE)

## 👨‍💻 Author

<div align="center">

**Developed by [Ninh Hải Đăng](https://github.com/ninhhaidang)**

[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://ninhhaidang.dev)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ninhhaidang)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ninhhaidang)

</div>

---

**Note**: This extension is not affiliated with official Shopee. It's an independent tool to analyze your personal data.
