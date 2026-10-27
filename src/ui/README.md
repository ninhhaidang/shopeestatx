# Shared UI blueprint

## Overview

Shared browser presentation layer for React surfaces. This directory is an architectural grouping, not a source module or barrel export. Its children separate reusable widgets, preference lifecycle, and stylesheet contracts from dashboard-specific behavior and extension data access.

## Interface

| Child boundary | Responsibility and entry points |
| --- | --- |
| [Components](./components/README.md) | `Button`, `Logo`, `Skeleton`, `StateMessage`, `ThemeToggle`, `StyleToggle`, `BarChart`, and `BarChartProps`; caller-driven rendering and interactions. |
| [Theme](./theme/README.md) | Colour-mode and display-style types, validation/storage/application helpers, `ThemeProvider`/`useTheme`, and `StyleProvider`/`useStyle`. |
| [Styles](./styles/README.md) | Global `app.css` entry, `tokens.css` palettes and Tailwind mappings, plus `card` and `control` class-string exports. |

Consumers import concrete child modules; there is no `src/ui` aggregate entry point. Configuration/storage-key naming comes from `src/config.ts`; localized labels come from `src/i18n/index.ts`.

## Invariants

- Theme state, CSS tokens, and visual widgets are separate boundaries. Providers manage browser preferences; styles consume root selectors; widgets render caller-supplied data.
- Colour mode (`light`, `dark`, `auto`) and display style (`fintech`, `warm`) remain independent. Only resolved light/dark values reach `data-theme`; warm style uses a root class.
- Hooks require their matching providers; `BarChart` requires theme context, and each preference toggle requires its corresponding context.
- Surfaces import the shared CSS entry once. Browser DOM, storage, media-query APIs, and canvas rendering are intentional runtime dependencies, not server-rendering abstractions.
- Accessibility contracts include native buttons, visible focus, state announcement roles, decorative skeletons, an accompanying chart table, and reduced-motion handling. Callers still own meaningful text and correctly aligned chart data.
- No child owns order fetching, extension messaging, or domain calculations.

## Side Effects

- Theme helpers/providers access `localStorage`, mutate `<html>` selectors, and subscribe to system colour preference changes in auto mode.
- Shared CSS affects document-level appearance, focus, motion, and order-print visibility.
- Charts register Chart.js components at module load and manage canvas instances during React effects; user actions delegate to supplied callbacks or preference setters.
- This grouping introduces no additional runtime effects beyond its child modules.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

`verify` covers typechecking, unused-code checks, coverage tests, build, and injected-script checks. Commands are verification guidance, not results of this documentation pass.
