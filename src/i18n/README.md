# Vietnamese localization

## Overview

[index.ts](./index.ts) provides Vietnamese translation lookup. [format.ts](./format.ts) provides Vietnamese number and date formatting. Translation data lives in [locales/vi.json](./locales/vi.json); the JSON-only directory has no separate component contract.

## Interface

- `t(key, params?)`: looks up a translation, returning the key when missing. Optional string/number parameters replace `{name}` tokens.
- `initLocale()`: selects Vietnamese, and sets document language to `vi`.
- `formatCurrency(amount, short = false)`: formats VND with `vi-VN`; short mode returns `M` at one million, `K` at one thousand, otherwise the input's string form.
- `formatDate(date)` and `formatDateTime(date)`: use `vi-VN` browser date/time formatting.

## Invariants

- Vietnamese is the only locale; no runtime language selector or locale persistence exists here.
- Each parameter replacement uses string `replace`, replacing only its first matching token; values are inserted literally.
- Date formatting uses browser time-zone defaults, not an explicit time zone. Short currency mode is distinct from full `Intl.NumberFormat` currency output.

## Side Effects

`t` and formatting helpers return strings without DOM/storage writes. `initLocale()` changes document language only.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`. These commands were not run during documentation generation.
