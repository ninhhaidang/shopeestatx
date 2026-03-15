# UI/UX Design Recommendations: Order Detail View

**Date:** 2026-03-15
**Context:** Shopee order analytics dashboard - expandable table row

---

## 1. Additional Information to Display

### Financial Data
- **Profit Margin** - calculated from cost vs selling price
- **Discount Applied** - coupon/promotion value
- **Shipping Fee** - breakdown of shipping costs
- **Payment Method** - how customer paid

### Product Details
- **SKU** - stock keeping unit
- **Product Category** - for sales analysis
- **Product Image Thumbnail** - visual confirmation
- **Variant Info** - size, color, etc.

### Fulfillment Data
- **Order Date** - when order was placed
- **Processing Time** - time from order to shipment
- **Tracking Number** - with carrier info
- **Shipping Method** - e.g., J&T, GHN, Shopee Express

### Customer Insights
- **Buyer Username** - for customer history
- **Shipping Address (Masked)** - city/region for analytics
- **Order Source** - app/web/platform)

---

## 2. UI/UX Improvements

### Layout
- **Two-column layout** in expanded row: key metrics left, product details right
- **Collapsible sections** for grouped info (Order Info, Product, Shipping, Financials)
- **Sticky header** within expanded row for long content

### Visual Hierarchy
- **Primary:** Order ID, Total Amount, Status (bold, larger)
- **Secondary:** Product name, dates
- **Tertiary:** SKU, tracking, payment method (muted color)

### Interactions
- **Chevron indicator** rotation on expand/collapse
- **Smooth animation** for row expansion (200-300ms)
- **Click anywhere** on row to expand (not just button)
- **Keyboard support** - Enter to toggle

### Visual Enhancements
- **Status badges** with color coding (green=delivered, yellow=processing, red=cancelled)
- **Progress indicator** for order stages
- **Compact data chips** for tags like "Free Shipping"

---

## 3. Missing Information for E-commerce Analysis

| Category | Missing Data | Why It Matters |
|----------|--------------|----------------|
| **Performance** | Days to deliver | Identify shipping bottlenecks |
| **Revenue** | Revenue per order | AOV analysis |
| **Product** | Return/Refund rate | Product quality indicator |
| **Customer** | Repeat purchase count | Customer lifetime value |
| **Fulfillment** | Is COD | Cash flow planning |

---

## Quick Wins (Priority Order)

1. Add **Status badge** with color - immediate visual improvement
2. Show **Order Date** + **Delivery Date** - calculate processing time
3. Add **Product thumbnail** - faster recognition
4. Group into **collapsible sections** - better scannability
5. Add **profit margin** if cost data available - business critical
