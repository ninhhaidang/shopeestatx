# Shared UI component contracts

## Overview

Reusable React presentation primitives for dashboard and popup surfaces: actions, loading and empty/error states, branding, preference controls, and a bar chart with a companion data table. Business data and fetching remain caller responsibilities.

## Interface

| Source | Public interface |
| --- | --- |
| [Button.tsx](./Button.tsx) | `Button` accepts native button attributes plus `variant?: 'primary' \| 'outline' \| 'link' \| 'quiet'`. Defaults to `variant='primary'` and `type='button'`; appends caller `className`. |
| [Logo.tsx](./Logo.tsx) | `Logo({ className? })` renders the `ShopeeStatX` wordmark. |
| [Skeleton.tsx](./Skeleton.tsx) | `Skeleton({ className? })` renders a decorative loading block; callers supply dimensions. |
| [StateMessage.tsx](./StateMessage.tsx) | `StateMessage({ title, message?, tone?, action? })`; `message` accepts a React node, `tone` is `neutral` or `error`, and `action` contains `label` and `onClick`. |
| [ThemeToggle.tsx](./ThemeToggle.tsx) | `ThemeToggle()` selects `auto`, `light`, or `dark` through the theme context. |
| [StyleToggle.tsx](./StyleToggle.tsx) | `StyleToggle()` selects `fintech` or `warm` through the style context. |
| [BarChart.tsx](./BarChart.tsx) | Exports `BarChartProps` and `BarChart({ title, labels, values, labelHeader, valueHeader, formatValue, formatTick })`. Labels and values are arrays; formatters accept numbers and return strings. |

Theme and style consumers rely on [providers](../theme/README.md). Visual classes rely on [shared styles](../styles/README.md). Toggle labels and chart accessibility text use `src/i18n/index.ts`; Radix Toggle Group supplies single-selection interaction, and Chart.js supplies canvas rendering.

## Invariants

- `Button` always renders an actual button, including link-like variants; it does not perform navigation itself.
- Neutral `StateMessage` uses `role='status'`; error tone uses `role='alert'`. Optional action delegates to caller callback.
- `Skeleton` is `aria-hidden`; callers remain responsible for communicating overall loading state.
- Preference toggles reject invalid values and the empty selection emitted when clicking an active Radix item, preserving the current choice. They require their corresponding providers.
- `BarChart` requires `ThemeProvider`. It renders a named canvas plus an expandable table with caption, column headers, row headers, and formatted values.
- Chart callers must provide labels and values in matching order and lengths; rows index directly into `values` without validation. Labels also serve as React row keys and should be unique.
- Chart colours are read from root CSS tokens when its effect runs, with fixed fallbacks. Re-creation depends on labels, values, value header, and resolved colour theme, not display style alone. Formatter refs update without independently re-creating the chart.
- Chart animation is disabled when the reduced-motion query matches at creation.

## Side Effects

- Importing `BarChart.tsx` registers its bar controller, element, scales, and tooltip with Chart.js.
- Mounted charts read computed root styles and browser media preferences, create Chart.js canvas instances, and destroy instances when effect dependencies change or on unmount.
- Toggle interactions invoke provider setters, which update preference state, browser storage, and root selectors. Action buttons invoke caller callbacks.
- These components do not fetch data or call Chrome extension APIs.

## Verification

Run from repository root:

```sh
npm test
npm ci && npm run verify
```

`verify` covers typechecking, unused-code checks, coverage tests, build, and injected-script checks. Commands are verification guidance, not results of this documentation pass.
