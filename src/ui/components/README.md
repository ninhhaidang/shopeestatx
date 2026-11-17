# Shared UI component contracts

## Overview

Reusable React presentation primitives for dashboard and popup surfaces: actions, loading and empty/error states, branding, a colour-mode control, and a bar chart with a companion data table. Business data and fetching remain caller responsibilities.

## Interface

| Source | Public interface |
| --- | --- |
| [Button.tsx](./Button.tsx) | `Button` accepts native button attributes plus `variant?: 'primary' \| 'outline' \| 'link' \| 'quiet'`. Defaults to `variant='primary'` and `type='button'`; appends caller `className`. |
| [Logo.tsx](./Logo.tsx) | `Logo({ className? })` renders the `ShopeeStatX` wordmark. |
| [Skeleton.tsx](./Skeleton.tsx) | `Skeleton({ className? })` renders a decorative loading block; callers supply dimensions. |
| [StateMessage.tsx](./StateMessage.tsx) | `StateMessage({ title, message?, tone?, action? })`; `message` accepts a React node, `tone` is `neutral` or `error`, and `action` contains `label` and `onClick`. |
| [ThemeToggle.tsx](./ThemeToggle.tsx) | `ThemeToggle()` selects `auto`, `light`, or `dark` through the theme context. |
| [MonthChart.tsx](./MonthChart.tsx) | Exports `MonthPoint`, `MonthChart({ title, points, active, onSelect, formatValue, formatTick })` (SVG bars, one per calendar month) and `MonthMatrix({ title, points, formatTick })` (the same figures as a year-by-month table). |
| [RankList.tsx](./RankList.tsx) | Exports `RankList({ label, rows })`: a ranked list with a scale bar per row. |

Theme consumers rely on the [provider](../theme/README.md). Visual classes rely on [shared styles](../styles/README.md). Toggle labels and chart accessibility text use `src/i18n/index.ts`; Radix Toggle Group supplies single-selection interaction.

## Invariants

- `Button` always renders an actual button, including link-like variants; it does not perform navigation itself.
- Neutral `StateMessage` uses `role='status'`; error tone uses `role='alert'`. Optional action delegates to caller callback.
- `Skeleton` is `aria-hidden`; callers remain responsible for communicating overall loading state.
- `ThemeToggle` rejects invalid values and the empty selection emitted when clicking an active Radix item, preserving the current choice. It requires `ThemeProvider`.
- `MonthChart` renders a named SVG; hovering or arrowing to a month shows its figure, Enter or a click reports it through `onSelect`. `MonthMatrix` is its table alternative.
- Chart callers must provide labels and values in matching order and lengths; rows index directly into `values` without validation. Labels also serve as React row keys and should be unique.
- Chart colours are read from root CSS tokens when its effect runs, with fixed fallbacks. Re-creation depends on labels, values, value header, and resolved colour theme. Formatter refs update without independently re-creating the chart.
- Chart animation is disabled when the reduced-motion query matches at creation.

## Side Effects

- Mounted charts read computed root styles and browser media preferences, create Chart.js canvas instances, and destroy instances when effect dependencies change or on unmount.
- Toggle interactions invoke the provider setter, which updates preference state, browser storage, and the root selector. Action buttons invoke caller callbacks.
- These components do not fetch data or call Chrome extension APIs.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

`verify` covers typechecking, unused-code checks, coverage tests, build, and injected-script checks. Commands are verification guidance, not results of this documentation pass.
