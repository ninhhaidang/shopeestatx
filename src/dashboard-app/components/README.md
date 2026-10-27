# Shared dashboard notices

## Overview

Context-aware notices reused across dashboard tabs. Components delegate actions to dashboard state rather than managing orders themselves.

## Interface

- [NoOrdersInRange.tsx](NoOrdersInRange.tsx): `NoOrdersInRange()` renders a localized empty-range message and action.
- [RescanBanner.tsx](RescanBanner.tsx): `RescanBanner({ className? })` renders a localized cache-rescan warning and link-style button; extra classes default to an empty string.

## Invariants

- Both components require `DashboardContext`, accessed through `useDashboard()`; use outside the provider throws.
- Empty-range action calls `resetRange`, not a local filter reset.
- Rescan banner presents `role="status"`. Caller decides when cache data needs a rescan; the banner does not inspect cache schema itself.
- Copy comes from `src/i18n`; shared controls come from `src/ui/components`.

## Side Effects

- Empty-range action invokes context `resetRange`.
- Rescan action invokes context `refresh`, which can scan Shopee through the selected dashboard host.
- Neither component reads storage or fetches orders directly.

## Verification

From repository root, run `npm test`; full gate: `npm ci && npm run verify`. No commands were executed while generating this contract.
