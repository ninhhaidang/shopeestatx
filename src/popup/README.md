# Popup launcher

## Overview

[Popup.tsx](./Popup.tsx) renders the extension launcher: cached greeting, analysis action, Shopee warning, external links, help/privacy actions, and shared theme toggle. Chrome behavior stays behind a host interface.

## Interface

- `Popup({ host })` consumes `PopupHost` from [host.ts](./host.ts).
- `PopupHost` exposes `getUser()`, `isOnShopee()`, `startAnalysis()`, `openLogin()`, `openHelp()`, and `openPrivacy()`; `PopupUser` contains name and optional avatar.
- [chrome-host.ts](./chrome-host.ts) exports `chromeHost`, backed by Chrome tabs, runtime URLs, and local storage.
- [main.tsx](./main.tsx) initializes Vietnamese locale and mounts the popup under React `StrictMode` and shared `ThemeProvider`. [popup.html](./popup.html) is the HTML entry.
- Shared rendering dependencies live in `src/ui`; domain and storage-key configuration lives in `src/config.ts`.

## Invariants

- Analysis remains disabled until `isOnShopee()` resolves `true`. The warning appears only after an explicit `false`, avoiding an initial warning flash.
- Active-tab detection accepts HTTP(S) on the configured hostname or its subdomains; malformed/missing URLs return false.
- Async user/tab results are ignored after component cleanup.
- Cached user lookup prefers `username` over `name`; missing data or storage errors produce no greeting.
- The component delegates browser actions to its host rather than accessing `chrome.*` directly. The host assumes Chrome returns an active tab when starting analysis.

## Side Effects

Chrome host reads cached stats and queries active tabs. Starting analysis saves the tab ID, opens `dashboard-app/dashboard.html?fetch=true`, then closes the popup. Login opens configured Shopee login and closes the popup; help/privacy open extension pages. External anchors open new tabs with `noopener noreferrer`; avatar rendering may load its image URL. Shared locale/theme initialization affects DOM and theme behavior.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`. These commands were not run during documentation generation.
