# Shared UI blueprint

## Overview

Shared browser presentation layer for React surfaces. This directory is an architectural grouping, not a source module or barrel export. Its children separate reusable widgets, preference lifecycle, and stylesheet contracts from dashboard-specific behavior and extension data access.

## Interface

| Child boundary | Responsibility and entry points |
| --- | --- |
| [Components](./components/README.md) | `Button`, `Logo`, `Skeleton`, `StateMessage`, `ThemeToggle`, `BarChart`, and `BarChartProps`; caller-driven rendering and interactions. |
| [Theme](./theme/README.md) | Colour-mode types, validation/storage/application helpers, and `ThemeProvider`/`useTheme`. |
| [Styles](./styles/README.md) | Global `app.css` entry, `tokens.css` palettes and Tailwind mappings, plus `card` and `control` class-string exports. |

Consumers import concrete child modules; there is no `src/ui` aggregate entry point. Configuration/storage-key naming comes from `src/config.ts`; localized labels come from `src/i18n/index.ts`.

## Invariants

- Theme state, CSS tokens, and visual widgets are separate boundaries. The provider manages the browser preference; styles consume root selectors; widgets render caller-supplied data.
- Colour mode is `light`, `dark`, or `auto`. Only resolved light/dark values reach `data-theme`.
- `useTheme` requires `ThemeProvider`; `BarChart` and `ThemeToggle` require theme context.
- Surfaces import the shared CSS entry once. Browser DOM, storage, media-query APIs, and canvas rendering are intentional runtime dependencies, not server-rendering abstractions.
- Accessibility contracts include native buttons, visible focus, state announcement roles, decorative skeletons, an accompanying chart table, and reduced-motion handling. Callers still own meaningful text and correctly aligned chart data.
- No child owns order fetching, extension messaging, or domain calculations.

## Side Effects

- Theme helpers and the provider access `localStorage`, mutate the `<html>` `data-theme` selector, and subscribe to system colour preference changes in auto mode.
- Shared CSS affects document-level appearance, focus, motion, and order-print visibility.
- Charts register Chart.js components at module load and manage canvas instances during React effects; user actions delegate to supplied callbacks or the colour-mode setter.
- This grouping introduces no additional runtime effects beyond its child modules.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

`verify` covers typechecking, unused-code checks, coverage tests, build, and injected-script checks. Commands are verification guidance, not results of this documentation pass.
