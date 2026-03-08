# Phase 1: Audit & Catalog Hardcodes

## Status: Completed

## Overview

- **Priority**: Critical
- **Effort**: Low

## Context Links

- Plan: `/plans/260308-1246-hardcode-detection/plan.md`

## Requirements

### Functional Requirements

1. Tìm và catalog tất cả các loại hardcode trong codebase:
   - Domain URLs (shopee.vn, api endpoints)
   - Storage keys
   - Event names
   - External URLs (GitHub, portfolio, donation)

### Non-Functional Requirements

- Không thay đổi code, chỉ catalog

## Key Insights

1. Domain `shopee.vn` xuất hiện nhiều lần trong code
2. Storage keys không nhất quán (`shopeestatx-lang`, `shopeeStats`, `shopeestatxBudget`)
3. Event names sử dụng prefix `shopeestatx:` nhưng không统一

## Hardcode Catalog

### 1.1 Domain URLs (Critical)

| # | File | Line | Hardcoded Value |
|---|------|------|-----------------|
| 1 | `src/content/content.js` | 18 | `https://shopee.vn/api/v4/order/get_all_order_and_checkout_list` |
| 2 | `src/manifest.json` | 17 | `https://shopee.vn/*` |
| 3 | `src/popup/popup.ts` | 13 | `url.includes('shopee.vn')` |
| 4 | `src/welcome/welcome.ts` | 7 | `chrome.tabs.create({ url: 'https://shopee.vn' })` |
| 5 | `src/dashboard/table.ts` | 45 | `https://shopee.vn/user/purchase/order/${orderId}` |
| 6 | `src/popup/popup.html` | 29 | `https://shopee.vn/user/purchase` |
| 7 | `src/dashboard/results.html` | 307 | `https://shopee.vn` |
| 8 | `src/privacy.html` | 79 | `https://shopee.vn/*` |

### 1.2 Storage Keys (Medium)

| # | File | Key | Recommended |
|---|------|-----|------------|
| 1 | `src/i18n/index.ts` | `shopeestatx-lang` | `{PREFIX}-lang` |
| 2 | `src/dashboard/theme-config.ts` | `shopeestatx-theme` | `{PREFIX}-theme` |
| 3 | `src/dashboard/budget.ts` | `shopeestatxBudget` | `{PREFIX}-budget` |
| 4 | `src/dashboard/data.ts` | `shopeeStats` | `{PREFIX}-stats` |
| 5 | `src/dashboard/data.ts` | `shopeeTabId` | `{PREFIX}-tabId` |
| 6 | `src/dashboard/incremental-fetch.ts` | `shopeeStats`, `shopeeTabId` | `{PREFIX}-stats`, `{PREFIX}-tabId` |

### 1.3 Event Names (Low)

| # | Event Name | Files |
|---|------------|-------|
| 1 | `shopeestatx:apply-filters` | `filters.ts`, `data.ts`, `results.ts` |
| 2 | `shopeestatx:date-range-cleared` | `filters.ts`, `results.ts`, `charts.ts` |
| 3 | `shopeestatx:filter-by-shop` | `shop-loyalty.ts`, `results.ts` |
| 4 | `shopeestatx:date-range-selected` | Multiple |

### 1.4 Message Source (Medium)

| # | File | Value |
|---|------|-------|
| 1 | `src/bridge/bridge.ts` | `shopee-stats` |
| 2 | `src/content/content.js` | `shopee-stats` |
| 3 | `src/dashboard/data.ts` | `shopee-stats` |

## Next Steps

- [ ] Phase 2: Create config module
