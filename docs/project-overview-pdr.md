# ShopeeStatX — Project Overview & PDR

## Summary

ShopeeStatX is a Chrome Extension (Manifest V3, v3.4.0) that automatically fetches the complete Shopee order history of a logged-in user, then visualizes it with interactive charts, smart filters, and exportable data tables. No server, no account, no data leaves the user's machine.

## Problem

Shopee provides zero spending analytics to users — no history summaries, no export options, no charts. Users cannot know how much they've spent or identify purchasing patterns.

## Solution

A Chrome Extension that:
1. Uses the browser's existing Shopee session (no credentials stored)
2. Calls Shopee's private order API to fetch full history
3. Renders an analytics dashboard entirely in the browser
4. Supports 7 Shopee marketplaces (vn/id/th/ph/my/sg/tw)

## Target Users

Vietnamese Shopee users who want visibility into their spending history. Architecture is multi-market ready (config.ts DOMAINS), but i18n is currently vi-only.

## Core Features

| Feature | Description |
|---------|-------------|
| Summary cards | Total orders, total spend, avg per order |
| Time comparison | This month vs last month, this year vs last year |
| Bar chart | Monthly or daily spending/order count/product count |
| Doughnut chart | Top shops by spend or order count |
| Drill-down | Click bar chart month → daily view → filter table |
| Smart filters | Year, month, status, text search, filter chips |
| Date range picker | Presets (7d/this/last/3m/this year) + custom range |
| Sortable table | All columns, expandable rows, click-to-filter values |
| Pagination | 20/50/100/all items per page |
| Excel export | ExcelJS, filtered data → .xlsx with Vietnamese headers |
| CSV export | UTF-8 BOM, proper encoding |
| PDF export | window.print() integration |
| Keyboard shortcuts | `/` search, `Esc` clear, `R` refresh |
| Cache | `chrome.storage.local` (`shopeestatx-stats`) with age display |
| Demo mode | Mock data when running outside extension (localhost) |
| **Heatmap** | 52-week GitHub-style SVG calendar, year filter |
| **Categories** | 12-bucket keyword classifier (word-boundary regex) |
| **Predictions** | Linear extrapolation for next-month forecast |
| **Shop loyalty** | Repeat rate, loyalty tier (3+ orders threshold) |
| **Auto insights** | Max-5 auto-generated insight cards |
| **Budget tracking** | Progress ring + threshold toast alert |
| **Incremental fetch** | Cache merge by orderId, no page reload |
| **5 themes** | orange / forest / rose / sky / lavender |
| **Multi-domain** | 7 Shopee marketplaces via config.ts |
| **Collapsible toolbar** | Search + date always visible, filters collapsible |
| **Popup greeting** | Avatar + name welcome message in popup |
| **Vietnamese-only i18n** | vi.json (8.4KB), en.json removed (v3.4.0) |

## Status Codes

| Code | Vietnamese | Description |
|------|-----------|-------------|
| 0 | Khong ro | Unknown |
| 3 | Hoàn thành | Completed |
| 4 | Da huy | Cancelled (excluded from spend) |
| 7 | Cho van chuyen | Pending shipment |
| 8 | Dang giao | In transit |
| 9 | Cho thanh toan | Pending payment |
| 12 | Tra hang | Returned (excluded from spend) |

`StatusCode` type currently enumerates `{0, 3, 4, 7, 8, 9, 12}`. Real Shopee data may include other codes (1, 2, 5, 6, 10, 11); unknown codes default to neutral badge.

## Privacy & Security

- No server — all processing is local
- No external requests except to Shopee API (7 supported domains)
- Uses browser session only (no stored credentials)
- Permissions: `activeTab`, `storage`, `scripting` + 7 host permissions (shopee.vn / .co.id / .co.th / .ph / .com.my / .sg / .tw)
- Cancelled (code 4) and returned (code 12) orders excluded from spend totals

### Security Measures

| Measure | Implementation |
|---------|---------------|
| XSS Prevention | `escapeHtml()` sanitizes all rendered user data |
| CSP | Strict Content-Security-Policy in manifest.json |
| Memory Safety | Chart.js cleanup via `destroyAllCharts()` on unload |
| Error Handling | try-catch guards in data.ts, budget.ts |
| Accessibility | aria-labels on all interactive elements |

## Success Metrics

| Metric | Target |
|--------|--------|
| Chrome Web Store users | 1k+ active installs within 6 months of launch |
| Time-to-interactive (dashboard) | < 2s on cached data, < 8s on first fetch (1000 orders) |
| Data-on-device guarantee | 100% (no network calls outside Shopee API) |
| Memory footprint | < 100MB with 5k orders loaded |
| Test coverage | > 80% statements, > 70% branches |
| Permission surface | 3 permissions + 7 host_permissions (no `<all_urls>`) |

## Performance Budget

| Resource | Budget |
|----------|--------|
| Dashboard bundle (results.js + chunks) | < 500KB gzipped |
| CSS total (11 modules + aggregator) | < 100KB |
| Initial render (cached data) | < 2s |
| First fetch (1000 orders) | < 8s |
| Memory with 5k orders | < 100MB |
| Chart.js instance count | ≤ 4 active at any time |

## Data Retention

- **Storage**: `chrome.storage.local` only, key `shopeestatx-stats` (per `STORAGE_KEYS.STATS`)
- **No TTL**: data persists until user clears via extension settings or `chrome://extensions` storage panel
- **No telemetry**: no analytics, no remote logging
- **No backup**: data lives only in the user's Chrome profile

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | Supported (primary) | MV3 native, manifest v3 |
| Edge | Supported | Chromium-based, MV3 compatible |
| Brave | Supported | Chromium-based, MV3 compatible |
| Arc | Supported | Chromium-based, MV3 compatible |
| Opera | Should work | Chromium-based, not actively tested |
| Firefox | Not yet | MV2/MV3 differences, requires separate port |
| Safari | Not yet | WebExtension API differences, requires separate port |

## Out of Scope (current version)

- No server-side component
- No user accounts or authentication
- No multi-account support (single Shopee session per install)
- No real-time sync between devices
- No product-level analytics (only order-level)
- No category manual override UI
- No dark theme (5 colored themes only)
- No English UI (Vietnamese-only)
- No Firefox/Safari ports
