# Deployment Guide

## Local Development

```bash
npm run dev
# Starts: python -m http.server 3000 --directory ShopeeStatX
# Open: http://localhost:3000/results.html
```

Demo mode activates automatically when `isExtensionContext()` returns false (no `chrome.storage` or `chrome.scripting`). Loads `mock-data.js` instead of calling Shopee API.

## Installing as Chrome Extension (Unpacked)

1. Clone or download the repository
2. Open `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `ShopeeStatX/` directory (not the repo root)
6. Extension icon appears in toolbar

The manifest points to `ShopeeStatX/` as the extension root — only files inside that directory are loaded by Chrome.

## Directory Structure for Chrome

Chrome only sees `ShopeeStatX/`:
```
ShopeeStatX/
├── manifest.json       # Required — extension config
├── background.js       # Service worker
├── popup.html/js/css
├── results.html/js/css
├── content.js
├── bridge.js
├── chart.min.js
├── xlsx.min.js
├── mock-data.js
├── state.js
├── data.js
├── filters.js
├── table.js
├── charts.js
├── comparison.js
├── export.js
├── utils.js
└── icons/
```

Files outside `ShopeeStatX/` (docs/, plans/, Documents/, etc.) are not included in the extension.

## Updating the Extension

After code changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on ShopeeStatX card
3. Reload any open results pages

## Chrome Web Store (Future)

Not yet published. To prepare a store package:
1. Zip the contents of `ShopeeStatX/` (not the directory itself)
2. Submit via Chrome Developer Dashboard
3. Required: store listing assets (screenshots, description)
4. Review: typically 1-3 business days

## Version Bumping

Update version in `ShopeeStatX/manifest.json`:
```json
{ "version": "1.0.0" }
```

Note: `package.json` version is separate and only used for dev tooling.

## Permissions Justification (for Store Review)

| Permission | Reason |
|-----------|--------|
| `activeTab` | Read current tab URL to check if on shopee.vn |
| `storage` | Cache order data in chrome.storage.local |
| `scripting` | Inject content.js (MAIN world) and bridge.js (ISOLATED world) into Shopee tab |
| `https://shopee.vn/*` | Host permission required for scripting injection |
