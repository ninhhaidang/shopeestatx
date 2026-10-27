# Early theme initialization

## Overview

[theme-init.js](./theme-init.js) is a synchronous external classic script intended for document `<head>`. It sets theme before first paint without violating extension CSP's inline-script restriction.

## Interface

- Reads local-storage key `shopeestatx-color-mode`.
- Recognizes stored `light` or `dark`; other values and inaccessible storage fall back to automatic system preference.
- Sets `document.documentElement.dataset.theme` to `light` or `dark`.
- Mirrors theme resolution in `src/ui/theme/theme.ts`; it exports no module symbols.

## Invariants

- All declarations live inside an IIFE; no imports, exports, or top-level lexical bindings are required.
- Explicit light/dark overrides system preference. Automatic mode checks `prefers-color-scheme: dark` when `matchMedia` is available, otherwise resolves light.
- Storage-read failures must not prevent first-paint theme resolution.
- This is a one-time initialization, not a media-query listener or persistent theme controller. Keep resolution semantics aligned with the shared theme module.

## Side Effects

Reads page-origin local storage and media preference, then writes the root theme data attribute. Does not write storage, fetch data, or install listeners.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`. These commands were not run during documentation generation.
