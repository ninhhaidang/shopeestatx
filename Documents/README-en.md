# ShopeeStatX - Shopee Order Statistics

<div align="center">

![Ngôn ngữ](https://img.shields.io/badge/Ngôn_ngữ-gray?style=for-the-badge&logo=googletranslate&logoColor=white)
[![Tiếng Việt](https://img.shields.io/badge/Tiếng_Việt-red?style=for-the-badge)](../README.md)
[![English](https://img.shields.io/badge/English-blue?style=for-the-badge)](#)

---

[![GitHub stars](https://img.shields.io/github/stars/ninhhaidang/shopee-orders-statics?style=for-the-badge&logo=github&label=Star%20this%20repo)](https://github.com/ninhhaidang/shopeestatx/stargazers)

</div>

> **Version 2.1** - Minimalist interface, smart charts

A Chrome extension to track and analyze your Shopee spending in detail with intuitive visualizations.

## Key Features

### 📊 Overview Statistics
- Total orders and products
- Total spending (including discounts, vouchers)
- Compare this month/year vs previous month/year
- Average order value

### 🔍 Filters
- Search by order, product, shop
- Filter by year, month, day (drill-down)
- Filter by status: Completed, Cancelled, Shipping, In Delivery, Pending Payment, Returned
- Quick remove individual filters or clear all

### 📈 Charts
- Auto display by month or day (based on filters)
- Click month column to drill-down, click day column to filter details
- Selected day highlighted in orange, toggle by clicking again
- Top 5 shops by purchase (pie chart)
- Hover to view details

### 📋 Data Table
- Complete display: No., Order ID, Delivery Date, Status, Product, Total Amount
- Sort by column
- Click to view details
- Pagination: 20/50/100 items/page

### 📥 Export Data
- Export to xlsx file with 1 click
- Preserves filtered data

---

## ⚙️ Installation

1. Clone repository:
```bash
git clone https://github.com/your-username/shopee-orders-statics.git
```

2. Open Chrome, go to `chrome://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked" and select the `ShopeeStats` folder

## 📖 User Guide

See detailed guide at [User Guide](Guide.md)

**Quick Start:**
1. Log in to your [Shopee](https://shopee.vn) account
2. Enable ShopeeStatX extension in Chrome toolbar
3. Click "Start Analysis"
4. Use filters and charts to analyze your spending

## 🛠️ Technology

- Chrome Extension API (Manifest V3)
- Vanilla JavaScript
- Chart.js
- SheetJS (XLSX)
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
