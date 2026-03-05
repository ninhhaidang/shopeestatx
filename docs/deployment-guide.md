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
├── background.js       # Service worker (onInstalled listener)
├── popup.html/js/css
├── welcome.html/js/css # First-run onboarding
├── privacy.html        # In-extension privacy policy
├── results.html/js/css # Analytics dashboard
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

Files outside `ShopeeStatX/` (docs/, plans/, Documents/, public/, store-assets/, etc.) are not included in the extension.

## Updating the Extension

After code changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on ShopeeStatX card
3. Reload any open results pages

## GitHub Pages (Privacy Policy)

Public privacy policy is served via GitHub Pages:
1. `privacy.html` at repo root contains the privacy policy
2. `.nojekyll` at root disables Jekyll processing
3. GitHub Pages source: branch `main`, folder `/` (root)
4. Public URL: `https://ninhhaidang.github.io/shopeestatx/privacy.html`
5. Referenced in store listing and popup footer links

To update:
- Edit `privacy.html` and `ShopeeStatX/privacy.html` (keep in sync)
- Push to repository (pages auto-rebuild ~1 min)

## Chrome Web Store

**Status: Submitted for review** (v2.1.0, submitted 2026-03-05)

Submission package:
```bash
cd ShopeeStatX && zip -r ../shopeestatx-v2.1.0.zip . --exclude "*.DS_Store" --exclude "*.map"
```

For future releases:
1. Update version in `manifest.json`
2. Create new ZIP from `ShopeeStatX/` contents
3. Upload via Chrome Developer Dashboard → existing item
4. Review typically 3-7 business days

See `store-assets/submission-checklist.md` for permissions justification and store copy.

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
