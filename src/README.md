# Extension source

## Overview

Chrome Manifest V3 runtime and shared React presentation layer. Popup selects a Shopee tab; dashboard host injects an isolated progress bridge and a MAIN-world collector. Normalized order snapshots feed local analytics and user-controlled exports. Development uses a mock host instead of authenticated Shopee access.

## Interface

| Boundary | Contract |
| --- | --- |
| [Dashboard application](./dashboard-app/README.md) | Host adapters, scan/cache state, date range, tab selection, and all dashboard views. |
| [Analytics and exports](./dashboard/README.md) | Spend calculations, calendar ranges, budgets, merge, search, downloads, and share cards. |
| [Collector](./content/README.md) | Authenticated order-list collection in the Shopee page's MAIN world. |
| [Progress bridge](./bridge/README.md) | Validated page progress relay into extension runtime messages. |
| [Shared types](./types/README.md) | Normalized orders, cache snapshots, user profile, and date-range types. |
| [Shared UI](./ui/README.md) | Components, independent colour/style preferences, and CSS tokens. |
| [Localization](./i18n/README.md) | Vietnamese messages, DOM localization, currency/date formatting. |
| [Popup](./popup/README.md) | Active-tab check and analysis launcher. |
| [Welcome](./welcome/README.md) | First-install instructions and navigation. |
| [Privacy](./privacy/README.md) | Policy presentation, not collection logic. |
| [Public assets](./public/README.md) | External pre-paint theme initializer. |
| [Development preview](./dev-preview/README.md) | Mock-data dashboard sizing and theme preview; excluded from production entries. |

### Local configuration and entry points

- [config.ts](./config.ts) exports `getActiveDomainUrl`, `getOrderUrl`, `getLoginUrl`, `getHomeUrl`, `getStorageKey`, `STORAGE_KEYS`, and `MESSAGE_SOURCE`. Active market is `vn`; storage names use `shopeestatx-`; progress source is `shopee-stats`.
- [background.ts](./background.ts) registers installation and runtime-message listeners. First install opens `welcome/welcome.html`; `{ type: 'openResults' }` opens `dashboard-app/dashboard.html`.
- [manifest.json](./manifest.json) declares Chrome 116+, popup, background worker, `activeTab`/`storage`/`scripting`, and host access limited to `https://shopee.vn/*`. `vite-env.d.ts` supplies Vite client types. `icons/` contains static images, not a code package.

## Invariants

- UI components depend on injected hosts; Chrome integration stays at adapter boundaries. Mock/demo execution must not fetch Shopee orders.
- Keep collection restricted to the existing order-list endpoint. No extra Shopee requests to enrich missing fields. See repository `docs/shopee-order-api.md` for data provenance and limits.
- Order and supplied seller IDs are strings. Unknown delivery dates stay unknown. Spend excludes cancelled/returned orders; excluded-order amounts are not proof of an actual refund transaction.
- Complete history stays distinct from range-filtered views. Current-month budget uses complete history independently of global range.
- Collection must preserve scan identity, account checks, cursor advancement, and cache-write coordination; failed scans must not become complete snapshots.
- Colour mode and display style remain independent; pre-paint colour resolution mirrors shared theme helpers.
- Manifest filenames must match built outputs. Bridge and collector execute as classic scripts; extension pages allow only self-hosted scripts.

## Side Effects

- Background listeners create browser tabs; importing configuration alone performs no I/O.
- Child adapters read/write Chrome storage, inject scripts, register message listeners, and coordinate cache writes. Collector uses current Shopee login session and posts progress.
- UI children mount React, manage browser preferences/listeners/timers, draw charts, and trigger user-requested downloads or print. No ShopeeStatX backend or telemetry is introduced here.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

Full gate covers typechecking, unused-code detection, coverage tests, production build, and classic injected-script syntax. Real authenticated Chrome/Shopee behavior requires a loaded extension and logged-in Shopee session; mock preview does not establish live API correctness.
