# Theme contracts

## Overview

Browser-backed React preferences for the light/dark colour mode. This package owns preference persistence and the root-element selector consumed by [shared styles](../styles/README.md); it does not own order data or network requests.

## Interface

| Source | Public interface |
| --- | --- |
| [theme.ts](./theme.ts) | `ColorMode = 'light' \| 'dark'`, `isColorMode(value)`, `readMode()`, `writeMode(mode)`, `applyTheme(mode)` |
| [ThemeProvider.tsx](./ThemeProvider.tsx) | `ThemeProvider({ children, initialMode? })`; `useTheme()` returns `{ mode, setMode }`. |

The storage key comes from `src/config.ts` through `getStorageKey('color-mode')`.

## Invariants

- Stored invalid, retired (`auto`) or unavailable colour mode resolves to `light`. There is no system-following mode. Storage writes swallow failures, leaving the in-memory choice usable but not persisted.
- `initialMode` overrides storage only when initializing provider state. The setter persists subsequent choices.
- `applyTheme` writes `light` or `dark` to `<html data-theme>`.
- `useTheme` throws outside `ThemeProvider`. Consumers need browser DOM APIs; these are not server-only utilities.
- Keep colour-mode storage reading aligned with the pre-paint mirror in `src/public/theme-init.js`.

## Side Effects

- Preference reads/writes access `localStorage`; applying preferences mutates `document.documentElement`.
- The provider applies the selector in a layout effect.
- The setter updates React state as well as persistence. An initial override does not itself write storage.
- No network or Chrome extension API calls occur here.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

`verify` covers typechecking, unused-code checks, coverage tests, build, and injected-script checks. Commands are verification guidance, not results of this documentation pass.
