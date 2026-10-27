# Browser dashboard preview

## Overview

[main.tsx](./main.tsx) mounts a development-only dashboard preview with `src/dashboard-app/mock-host.ts`, allowing UI inspection without extension APIs. [index.html](./index.html) and [preview.css](./preview.css) provide its HTML entry and width styling.

## Interface

- Loads `Dashboard` from `src/dashboard-app/Dashboard.tsx` with `mockHost`.
- Query parameter `width=tab` selects tab layout; every other value selects `400` width mode.
- Query parameter `theme=dark` selects dark mode; every other value selects light.
- Mounts within React `StrictMode`, shared `ThemeProvider`, and `StyleProvider`, after Vietnamese locale initialization.

## Invariants

- Preview initialization runs only when `import.meta.env.DEV` is true. Source identifies this HTML entry as dev-only, not a production Rollup input or public asset.
- Preview uses the mock host, not the Chrome production adapter; it is not an authenticated Shopee collection path.
- Width is stored in `document.documentElement.dataset.previewWidth`; initial theme is supplied to `ThemeProvider`.

## Side Effects

In development, mutates document language, preview-width attribute, and title; mounts dashboard DOM and shared styling/theme. Dashboard behavior comes from its supplied mock host and shared components rather than a direct Chrome integration here.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`. For manual UI inspection, `npm run dev` serves `src/dev-preview/index.html` with optional width/theme query parameters. These commands were not run during documentation generation.
