# ShopeeStatX User Guide

## 📊 View Spending Overview

### To see how much you've spent
After loading, you'll immediately see:
- **Order Count**: Total number of orders placed
- **Total Products**: Total number of products in orders
- **Total Spent**: Total spending (completed orders only)

### To compare spending trends
- **This Month vs Last Month**: See if you're spending more or less
- **This Year vs Last Year**: Track long-term spending trends
- **Average Order Value**: Know how much you spend per purchase

---

## 🔍 Search & Filter Data

### To find a specific order
- Type **order ID**, **product name**, or **shop name** in the search box
- Results display instantly (no need to press Enter)
- **Shortcuts**: Press `/` → focus search box, `Escape` → clear search

### To view spending by time
**By year:**
- Select year from dropdown → Display all orders from that year

**By month:**
- Select month → View detailed orders for the month
- Chart automatically switches to daily view

**By day (drill-down):**
- After filtering by month, click on a day column in the chart
- Chart still shows all days, selected day highlighted in orange
- Data table only shows orders from that day
- Click again to deselect

### To filter by order status
Select status from dropdown:
- Completed
- Cancelled
- Shipping
- In Delivery
- Pending Payment
- Returned

### To clear filters
- Click **×** button on filter chip → Remove individual filter
- Click "Clear All" → Reset all filters

---

## 📈 Analyze with Charts

### To view spending trends over time
**Column Chart:**
- Default displays spending by **month**
- When filtering by month, automatically switches to **daily** view

**Chart Interaction:**
- **Click on column** → Automatically filter by that month/day
  - Click month column → Filter by month (chart switches to daily view)
  - Click day column → Filter by specific day
  - Selected day highlighted in orange
- **Hover** → View detailed amount
- Chart automatically updates when filters change

### To see which shops you buy from most
**Top Shops Pie Chart:**
- Default displays **Top 5** shops

**Shop count options:**
- Select dropdown next to title: **3**, **5**, **10**, or **15** shops
- Number in title automatically updates

**Statistics type options:**
- **Total Amount**: Shops you spent the most money on
- **Order Count**: Shops you ordered from most frequently
- **Product Count**: Shops you bought the most products from

**Interaction:**
- **Click on shop segment** → Automatically search and filter all orders from that shop
- **Hover** → View details (total amount/order count/product count depending on selected statistics type)

---

## 📋 Manage Data Table

### To sort orders
- Click column header: **Delivery Date**, **Status**, or **Total Amount**
- Click again → Reverse order
- Arrow on column header shows current sort direction

### To view order details
- Click on any row in the table
- Will display complete information:
  - Order ID
  - Product Name
  - Product Quantity
  - Total Amount
  - Status (clickable to filter)
  - Seller (clickable to filter)
  - Delivery Date (clickable to filter)
  - Product Details

### To quick filter from order details
When viewing order details, click on these fields to automatically apply filters:
- **Status**: Click to filter all orders with similar status
- **Seller**: Click to search all orders from that shop
- **Delivery Date**: Click to filter orders delivered on that day

### To navigate between pages
- Select items/page: **20**, **50**, **100**, or **All**
- Use buttons: **«** (first page), **‹** (previous), **›** (next), **»** (last page)
- Click page number → Jump to specific page

---

## 📥 Export Data

### To save purchase history to Excel file
1. Click **"Export xlsx"** button in top-right corner
2. File will automatically download as `shopee-stats-YYYY-MM-DD.xlsx`
3. Data includes:
   - No., Order ID, Delivery Date
   - Status, Product Name, Quantity
   - Total Amount, Seller, Details

> **Note**: Excel file only exports filtered data, not all data

---

## 🔄 Update Data

### To reload latest data from Shopee
- Click **↻** (Refresh) button in top corner
- Or press `r` key on keyboard
- Data will be reloaded from scratch

---

## 💡 Tips for Effective Use

### Analyze spending trends
- View chart by month → Know **which month you spent the most**
- **Click on month column** → Automatically filter and view detailed orders
- Chart automatically switches to daily view
- **Click on day column** → View orders from specific day
- Compare with previous month → **Better spending control**

### Find favorite shops
- View **Top Shops** chart with different statistics types:
  - **Total Amount**: Shops you spent most money on → Budget management
  - **Order Count**: Most frequently purchased shops → Know familiar shops
  - **Product Count**: Shops with most items purchased → Analyze habits
- Increase shop count to **10** or **15** → See broader overview
- **Click on shop segment** → Automatically filter and view all orders from that shop

### Quick filter from order details
- Click on **any order** → View complete details
- **Clickable fields** (shown with orange underline):
  - **Status**: Click → Filter by that status
  - **Seller**: Click → Search shop
  - **Delivery Date**: Click → Filter by specific date
- Helps analyze quickly without manually selecting filters

### Store history
- Export xlsx file → Long-term storage
- Easily compare between time periods
- Open in Excel/Google Sheets → Further analysis

### View specific day details
**Method 1: From chart**
- Click on month column in chart → Filter by month
- Chart automatically switches to daily view
- Click on day column → Filter by specific day

**Method 2: From order details**
- Click on any order → View details
- Click on **Delivery Date** → Automatically filter by that day

### Keyboard shortcuts
- **/** → Focus on search box
- **Escape** → Clear search
- **r** → Refresh data

---

## ❓ Frequently Asked Questions

### Extension not working?
**Causes:**
- Not logged into Shopee
- Not on Shopee page

**Solutions:**
- Ensure you're logged into [shopee.vn](https://shopee.vn)
- Try refreshing Shopee page and extension

### Data incomplete?
**Solutions:**
- Click **↻** button → Reload data
- Check internet connection
- Ensure logged into correct account

### Total amount doesn't match what I remember?
**Reasons:**
- Extension **only counts completed orders**
- **Cancelled** and **returned** orders are not counted
- Total amount includes **discounts** and **vouchers**

### Is data stored anywhere?
- **No**, data only displays in current session
- Extension does not store or send data anywhere
- Each time you open, data needs to be loaded from Shopee

---

## 🆘 Support

If you encounter issues or have feedback, please create an issue at [GitHub](https://github.com/ninhhaidang/shopee-orders-statics)
