# Welcome page

## Overview

[Welcome.tsx](./Welcome.tsx) renders first-run guidance: extension version, history/analytics/export features, permission explanations, four usage steps, Shopee action, privacy/source links, and theme toggle.

## Interface

- `Welcome({ host })` accepts `WelcomeHost` from [host.ts](./host.ts), exposing `openShopee()` and `openPrivacy()`.
- [chrome-host.ts](./chrome-host.ts) exports the production `chromeHost`, using configured Shopee home URL and extension privacy URL.
- [main.tsx](./main.tsx) initializes Vietnamese locale and mounts the page under React `StrictMode` and shared `ThemeProvider`; [welcome.html](./welcome.html) provides its HTML entry.
- Version comes from `src/manifest.json`; copy comes from `src/i18n`, with shared components/theme from `src/ui`.

## Invariants

- Browser integration is host-injected; the page component does not call Chrome APIs directly.
- Permission explanations cover `activeTab`, `storage`, `scripting`, and `shopee.vn`.
- Semantic sections use `useId()` headings and `aria-labelledby`; usage steps remain an ordered list.
- Privacy navigation prevents the anchor's default action and invokes the host, keeping Chrome routing in the adapter.

## Side Effects

Chrome host opens new tabs for Shopee home and the extension privacy page. Rendering includes external navigation links and shared theme controls. Entrypoint initializes locale, applies shared styling/theme, and mounts the React tree. No order collection or cache writes originate in this page component.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`. These commands were not run during documentation generation.
