# Theme and display-style contracts

## Overview

Browser-backed React preferences for two independent presentation axes: light/dark/auto colour mode and fintech/warm display style. This package owns preference persistence and the root-element selectors consumed by [shared styles](../styles/README.md); it does not own order data or network requests.

## Interface

| Source | Public interface |
| --- | --- |
| [theme.ts](./theme.ts) | `ColorMode = 'light' \| 'dark' \| 'auto'`, `ResolvedTheme = 'light' \| 'dark'`, `DARK_QUERY`, `isColorMode(value)`, `readMode()`, `writeMode(mode)`, `resolveTheme(mode)`, `applyTheme(theme)` |
| [ThemeProvider.tsx](./ThemeProvider.tsx) | `ThemeProvider({ children, initialMode? })`; `useTheme()` returns `{ mode, theme, setMode }`. |
| [style.ts](./style.ts) | `DisplayStyle = 'fintech' \| 'warm'`, `isDisplayStyle(value)`, `readStyle()`, `writeStyle(style)`, `applyStyle(style)` |
| [StyleProvider.tsx](./StyleProvider.tsx) | `StyleProvider({ children, initialStyle? })`; `useStyle()` returns `{ style, setStyle }`. |

Storage keys come from `src/config.ts` through `getStorageKey('color-mode')` and `getStorageKey('display-style')`.

## Invariants

- Stored invalid or unavailable colour mode resolves to `auto`; stored invalid or unavailable display style resolves to `fintech`. Storage writes swallow failures, leaving the in-memory choice usable but not persisted.
- `auto` resolves through `(prefers-color-scheme: dark)`; absent optional media-query support in `resolveTheme` falls back to light. The provider's auto-mode effect itself requires `window.matchMedia` and its change-listener API.
- `initialMode` and `initialStyle` override storage only when initializing provider state. Setters persist subsequent choices.
- Colour mode and display style remain independent. `applyTheme` writes resolved `light` or `dark` to `<html data-theme>`; `applyStyle` toggles only `<html class="style-warm">`.
- `useTheme` and `useStyle` throw outside their matching providers. Consumers need browser DOM APIs; these are not server-only utilities.
- Keep colour-mode storage reading and resolution aligned with the pre-paint mirror in `src/public/theme-init.js`. Display style has no equivalent pre-paint mirror.

## Side Effects

- Preference reads/writes access `localStorage`; applying preferences mutates `document.documentElement`.
- Providers apply selectors in layout effects. Auto colour mode subscribes to system preference changes and removes its listener on mode change or unmount.
- Setters update React state as well as persistence. Initial overrides do not themselves write storage.
- No network or Chrome extension API calls occur here.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

`verify` covers typechecking, unused-code checks, coverage tests, build, and injected-script checks. Commands are verification guidance, not results of this documentation pass.
