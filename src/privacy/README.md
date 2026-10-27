# Privacy policy page

## Overview

[Privacy.tsx](./Privacy.tsx) renders Vietnamese privacy-policy copy, permissions and local-data explanations, contact/source links, and a shared theme toggle. Policy statements describe extension behavior; this component does not implement collection or storage.

## Interface

- `Privacy()` renders the policy without props or a browser-host adapter.
- [main.tsx](./main.tsx) mounts it into `#root` under React `StrictMode` and shared `ThemeProvider`, importing shared application CSS.
- Shared logo/theme components live in `src/ui`; policy links reference `https://github.com/ninhhaidang/shopeestatx`.

## Invariants

- Source explicitly marks wording as legal text that must remain identical to the published policy. Treat copy changes as policy changes, not routine UI cleanup.
- Policy text is embedded Vietnamese content, not translation-key lookup; the entrypoint does not call `initLocale()`.
- Sections have accessible generated heading IDs; permission explanations render as a table with headers.
- The component has no Chrome API, order-fetch, or data-deletion implementation. Those policy claims must stay aligned with their owning subsystems.

## Side Effects

Mounts DOM and shared theme behavior. User-followed links navigate to external resources. The policy component itself does not fetch orders, access Chrome storage, or transmit order data.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`. These commands were not run during documentation generation.
