# Chrome Web Store Submission Checklist

## Pre-submission

- [ ] Verify `manifest.json` version = `2.1.0`
- [ ] Verify icon files exist at correct sizes:
  - `ShopeeStatX/icons/icon16.png` (16×16)
  - `ShopeeStatX/icons/icon48.png` (48×48)
  - `ShopeeStatX/icons/icon128.png` (128×128)
- [ ] Enable GitHub Pages in repo settings → confirm privacy policy URL loads:
  - `https://ninhhaidang.github.io/shopeestatx/privacy.html`
- [ ] Take 5 screenshots at **1280×800px** (see `screenshots/README.md`)

## Screenshots Required (1280×800px PNG)

| File | Content |
|------|---------|
| `screenshots/01-summary-cards.png` | Summary cards — tổng quan chi tiêu |
| `screenshots/02-charts.png` | Charts — biểu đồ theo tháng và top shop |
| `screenshots/03-order-details.png` | Order details — chi tiết đơn hàng mở rộng |
| `screenshots/04-orders-table.png` | Orders table — bảng dữ liệu với filter |
| `screenshots/05-popup.png` | Popup UI trên shopee.vn |

**How to capture:**
```bash
npm run dev
# Open http://localhost:3000/results.html (uses mock data automatically)
# Set Chrome window to exactly 1280×800
# Use Chrome DevTools → Cmd+Shift+P → "Capture screenshot"
```

## Submission Package

```bash
# Create zip of ShopeeStatX/ contents (not the folder itself)
cd /path/to/shopeestatx/ShopeeStatX
zip -r ../shopeestatx-v2.1.0.zip . --exclude "*.DS_Store" --exclude "*.map"
```

## Chrome Web Store Steps

1. **Create developer account**
   - Go to https://chrome.google.com/webstore/devconsole
   - One-time $5 registration fee

2. **New item**
   - Click "New Item"
   - Upload `shopeestatx-v2.1.0.zip`

3. **Store listing — Product details**
   - Name: `ShopeeStatX`
   - Category: `Shopping` (or `Productivity`)
   - Language: Vietnamese (primary), English (secondary)
   - Short description: paste from `description-vi.md`
   - Detailed description: paste from `description-vi.md`
   - Upload 5 screenshots from `store-assets/screenshots/`
   - Primary icon: `ShopeeStatX/icons/icon128.png`

4. **Privacy practices**
   - Privacy policy URL: `https://ninhhaidang.github.io/shopeestatx/privacy.html`
   - Data usage: No user data collected/sold/shared
   - Permissions justification: see `store-assets/permissions-justification.md`

5. **Distribution**
   - Visibility: Public
   - Distribution: All regions
   - Price: Free

6. **Submit for review**
   - Review typically takes 1–7 business days
   - May receive email with questions about `scripting` permission

## Permissions Justification (for review questions)

**scripting**: Required to inject a script into the active Shopee tab running in MAIN world context. This is necessary because Chrome Extensions run in ISOLATED world by default, which cannot access the page's cookies. Injecting in MAIN world allows the script to use the browser's existing Shopee session (cookies) to call the Shopee order API — without requiring users to enter credentials or without routing data through a third-party server.

**activeTab**: Required to read the current tab's URL to verify the user is on shopee.vn before enabling the extension's main button.

**storage**: Required to cache order data locally in chrome.storage.local so users don't need to re-fetch data every time they open the extension.

**host_permissions (shopee.vn)**: Scoped to shopee.vn only — the extension has no access to any other websites.

## Post-publication

- [ ] Update README.md with Chrome Web Store badge + install link
- [ ] Tag release on GitHub: `git tag v2.1.0 && git push --tags`
- [ ] Create GitHub Release with changelog
