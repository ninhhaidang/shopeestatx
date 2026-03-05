# ShopeeStatX — Project Overview & PDR

## Summary

ShopeeStatX is a Chrome Extension (Manifest V3) that automatically fetches the complete Shopee order history of a logged-in user, then visualizes it with interactive charts, smart filters, and exportable data tables. No server, no account, no data leaves the user's machine.

## Problem

Shopee provides zero spending analytics to users — no history summaries, no export options, no charts. Users cannot know how much they've spent or identify purchasing patterns.

## Solution

A Chrome Extension that:
1. Uses the browser's existing Shopee session (no credentials stored)
2. Calls Shopee's private order API to fetch full history
3. Renders an analytics dashboard entirely in the browser

## Target Users

Vietnamese Shopee users who want visibility into their spending history.

## Core Features

| Feature | Description |
|---------|-------------|
| Summary cards | Total orders, total spend, avg per order |
| Time comparison | This month vs last month, this year vs last year |
| Bar chart | Monthly or daily spending/order count/product count |
| Pie chart | Top shops by spend or order count |
| Drill-down | Click bar chart month → daily view → filter table |
| Smart filters | Year, month, status, text search, filter chips |
| Sortable table | All columns, expandable rows, click-to-filter values |
| Pagination | 20/50/100/all items per page |
| Excel export | Filtered data → .xlsx with Vietnamese headers |
| Keyboard shortcuts | `/` search, `Esc` clear, `R` refresh |
| Cache | Data persists in chrome.storage.local with age display |
| Demo mode | Mock data when running outside extension (localhost) |

## Status Codes

| Code | Vietnamese | Description |
|------|-----------|-------------|
| 3 | Hoàn thành | Completed |
| 4 | Da huy | Cancelled (excluded from spend) |
| 7 | Cho van chuyen | Pending shipment |
| 8 | Dang giao | In transit |
| 9 | Cho thanh toan | Pending payment |
| 12 | Tra hang | Returned (excluded from spend) |

## Privacy & Security

- No server — all processing is local
- No external requests except to `shopee.vn` API
- Uses browser session only (no stored credentials)
- Permissions: `activeTab`, `storage`, `scripting` + host `shopee.vn`
- Cancelled (code 4) and returned (code 12) orders excluded from spend totals
