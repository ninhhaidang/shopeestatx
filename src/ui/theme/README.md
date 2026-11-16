# Theme contracts

## Overview

Browser-backed React preferences for the light/dark/auto colour mode. This package owns preference persistence and the root-element selector consumed by [shared styles](../styles/README.md); it does not own order data or network requests.

## Interface

| Source | Public interface |
| --- | --- |
| [theme.ts](./theme.ts) | `ColorMode = 'light' \| 'dark' \| 'auto'`, `ResolvedTheme = 'light' \| 'dark'`, `DARK_QUERY`, `isColorMode(value)`, `readMode()`, `writeMode(mode)`, `resolveTheme(mode)`, `applyTheme(theme)` |
| [ThemeProvider.tsx](./ThemeProvider.tsx) | `ThemeProvider({ children, initialMode? })`; `useTheme()` returns `{ mode, theme, setMode }`. |

The storage key comes from `src/config.ts` through `getStorageKey('color-mode')`.

## Invariants

- Stored invalid or unavailable colour mode resolves to `auto`. Storage writes swallow failures, leaving the in-memory choice usable but not persisted.
- `auto` resolves through `(prefers-color-scheme: dark)`; absent optional media-query support in `resolveTheme` falls back to light. The provider's auto-mode effect itself requires `window.matchMedia` and its change-listener API.
- `initialMode` overrides storage only when initializing provider state. The setter persists subsequent choices.
- `applyTheme` writes resolved `light` or `dark` to `<html data-theme>`.
- `useTheme` throws outside `ThemeProvider`. Consumers need browser DOM APIs; these are not server-only utilities.
- Keep colour-mode storage reading and resolution aligned with the pre-paint mirror in `src/public/theme-init.js`.

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
