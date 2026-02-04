# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-04
**Tech Stack:** Chrome Extension (Manifest V3) | Vanilla JS | Chart.js | SheetJS

## OVERVIEW

Chrome Extension thống kê chi tiêu Shopee. Fetch data từ Shopee API → cache local → visualize với charts và tables. Sử dụng Main World injection để bypass CORS.

## STRUCTURE

```
shopeestatx/
├── ShopeeStats/           # Extension core (load vào Chrome)
│   ├── manifest.json      # Entry point - Manifest V3
│   ├── background.js      # Service worker - mở results tab
│   ├── popup.js           # Click icon → trigger analysis
│   ├── content.js         # MAIN world - fetch Shopee API
│   ├── bridge.js          # ISOLATED world - message relay
│   ├── results.js         # Dashboard logic (~1000 lines)
│   ├── results.html/css   # Dashboard UI
│   ├── popup.html/css     # Popup UI
│   ├── chart.min.js       # Vendored Chart.js
│   ├── xlsx.min.js        # Vendored SheetJS
│   └── icons/             # Extension icons
├── Documents/             # Multi-language docs (vi/en)
└── Screenshots/           # UI previews
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Modify data fetching | `ShopeeStats/content.js` | `getOrders()` function, runs in MAIN world |
| Add new charts | `ShopeeStats/results.js` | `renderCharts()` ~line 638 |
| Change filters | `ShopeeStats/results.js` | `applyFilters()` ~line 255 |
| Add permissions | `ShopeeStats/manifest.json` | `permissions` / `host_permissions` |
| Export logic | `ShopeeStats/results.js` | `exportToExcel()` ~line 871 |
| New Shopee regions | `ShopeeStats/manifest.json` | Add to `host_permissions` |

## ARCHITECTURE

### Data Flow
```
popup.js (click) 
  → results.html?fetch=true
    → inject bridge.js (ISOLATED)
    → inject content.js (MAIN)
      → fetch Shopee API (uses browser cookies)
      → postMessage → bridge → chrome.runtime
        → results.js receives data
          → cache to chrome.storage.local
          → render charts + table
```

### Dual-World Pattern (CRITICAL)
- **content.js**: Runs in MAIN world → access page's fetch context & cookies
- **bridge.js**: Runs in ISOLATED world → relay messages to extension
- **Why**: Bypass CORS, leverage user's authenticated session

## CONVENTIONS

### Code Style
- Vanilla JS (ES6+), no framework
- No build step, no npm
- Libraries vendored as `.min.js`
- Vietnamese UI strings hardcoded

### Currency Handling
```javascript
// Shopee API returns amount * 100000
const actualVND = apiAmount / 100000;
```

### Order Status Codes
| Code | Status | Include in Total |
|------|--------|------------------|
| 3 | Hoàn thành | YES |
| 4 | Đã hủy | NO |
| 7 | Vận chuyển | YES |
| 8 | Đang giao | YES |
| 9 | Chờ thanh toán | YES |
| 12 | Trả hàng | NO |

## ANTI-PATTERNS (THIS PROJECT)

### NEVER
- Store/transmit user data externally → extension is stateless
- Include cancelled (4) or returned (12) orders in spending totals
- Bypass Shopee authentication → requires user login
- Use CDN for libraries → must be vendored locally

### ALWAYS
- Divide API amounts by 100000 for VND
- Use `chrome.scripting.executeScript` for dynamic injection
- Validate timestamps (2020-2030 range) when parsing order_id

### Timestamp Fallbacks (content.js:80-104)
```
Priority: shipping.tracking_info.ctime
       → status.update_time
       → order_id first 10 digits (validate year)
```

## COMMANDS

```bash
# Install extension
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → select ShopeeStats/

# No build/test commands - vanilla JS project
```

## NOTES

- No test suite: Manual testing in browser
- No CI/CD: Manual release via GitHub Releases
- Shopee API: `v4/order/get_all_order_and_checkout_list` (may change)
- Data scope: Only displays in current session, not persisted
- Excel export: Only exports filtered data, not all data
