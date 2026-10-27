# Shared style contracts

## Overview

Global stylesheet entry, design tokens, and reusable class strings for React surfaces. This is a component package because it exports TypeScript values alongside CSS. Preference state and root-element selectors belong to [theme](../theme/README.md).

## Interface

| Source | Contract |
| --- | --- |
| [classes.ts](./classes.ts) | Exports `card` and `control`, shared Tailwind class strings for bordered card surfaces and compact controls. |
| [app.css](./app.css) | Surface entry stylesheet: imports Tailwind and `tokens.css`; supplies body defaults, visible keyboard focus, `num` tabular-digit utility, print handling, and reduced-motion rules. Import once from each surface's `main.tsx`. |
| [tokens.css](./tokens.css) | Defines base light and `[data-theme='dark']` tokens, `.style-warm` token families, and `@theme inline` mappings to Tailwind colour and font utilities. |

## Invariants

- `data-theme` is resolved `light` or `dark`, not `auto`. Base `:root` values provide the light palette.
- Display style is independent of colour mode. Warm tokens use `--w-*` and `warm-*` utilities; the warm class does not replace the base token family.
- Dark-warm overrides use `[data-theme='dark'].style-warm`: both selectors belong on the same root element, not nested elements.
- Text-bearing accent utilities `accent-solid` and `accent-text` map to `--accent-strong`; decorative `accent` maps to `--accent`. Keep this distinction when changing palette mappings.
- `card` and `control` are static strings, not stateful components or class-building functions.
- Token CSS declares text/surface contrast as an accessibility contract; this documentation does not independently certify contrast values.

## Side Effects

- Importing `app.css` applies document-wide body styling and focus-visible outlines for links, buttons, radio-role elements, and form controls.
- Reduced-motion media rules shorten animation and transition durations and disable smooth scrolling globally.
- During printing, `body:has(#orders-print) > #root` is hidden so an orders print sheet can be shown separately.
- Importing `classes.ts` alone performs no DOM, storage, network, or extension API work.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

`verify` covers typechecking, unused-code checks, coverage tests, build, and injected-script checks. Commands are verification guidance, not results of this documentation pass.
