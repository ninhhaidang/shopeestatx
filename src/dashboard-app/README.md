# Dashboard application

## Overview

React dashboard entry point, host boundary, order-loading state machine, global date range, and tab composition. Domain calculations and exports live in `src/dashboard`; reusable visual controls/themes live in `src/ui`; localized text comes from `src/i18n`.

## Interface

- [main.tsx](main.tsx) initializes locale and mounts `Dashboard` in React strict mode beneath theme/style providers. Chrome host is selected when Chrome storage and scripting APIs exist; otherwise mock host is used. Development-only `?mock=1` forces mock data.
- [Dashboard.tsx](Dashboard.tsx): `Dashboard({ host: DashboardHost, now?: () => Date })` manages selected tab, range selection, clock, and loading/empty/error/ready presentation.
- [host.ts](host.ts): `DashboardHost` exposes `scanOnOpen`, `loadCached(): Promise<OrderData | null>`, and `refresh(onProgress, mode: 'replace' | 'merge'): Promise<{ data: OrderData; added: number }>`.
- [chrome-host.ts](chrome-host.ts) exports `chromeHost`, backed by extension storage, script injection, runtime progress messages, and Web Locks. `?fetch=true` requests an initial scan.
- [mock-host.ts](mock-host.ts) exports `mockHost`, lazily loading demo order data without Chrome APIs.
- [useOrderData.ts](useOrderData.ts): `useOrderData(host)` returns `OrderDataState` and `refresh`. State includes phase, retained data, scan progress, stall status, background-refresh status, notices, and errors.
- [context.ts](context.ts) exports `DashboardContext`, `DashboardContextValue`, and `useDashboard()`: full `data`, filtered `orders`, resolved `range`, `selection`, `resetRange`, `now`, and `refresh`.
- [tabs.tsx](tabs.tsx) exports `TabId`, `TabDef`, `TABS`, and `resolveTabComponent(tabId, style)`. Tab order is overview, analysis, orders; each has fintech/warm renderers.
- [RangePicker.tsx](RangePicker.tsx): `RangePicker({ value, onChange, years, now })` emits range selections. [AccountChip.tsx](AccountChip.tsx) presents a `UserProfile`; [OverviewSkeleton.tsx](OverviewSkeleton.tsx) presents loading state.
- [format.ts](format.ts) exports `money` and `shortMoney`; [updated.ts](updated.ts) exports `formatUpdated(timestamp, now)` for localized elapsed-time text.

### Child boundaries

| Contract | Responsibility |
| --- | --- |
| [components](components/README.md) | Shared range-empty and rescan notices delegating actions to context. |
| [tabs](tabs/README.md) | Overview, analysis, and order screens, including style-specific child views. |

## Invariants

- `useDashboard()` throws outside its provider. Full history and globally filtered orders remain separate; tabs do not independently resolve the global range.
- Host and domain modules own acquisition/persistence and calculations respectively. Dashboard views do not add Shopee request types.
- Loader permits one scan at a time per hook. Initial scan uses replace mode; refresh with retained data uses merge mode and keeps existing content on screen. Background failures become notices rather than replacing ready content with an error screen.
- A scan with no progress for 30 seconds is marked stalled; progress re-arms that timer. Cache-first loading is bypassed when `scanOnOpen` is true.
- Chrome host serializes per-tab script handoff and cache writes with Web Locks. Progress requires matching source, tab, scan token, nonnegative safe-integer count, and current scan state.
- Cache scan epochs/sequences reject superseded work and protect newer per-order results. Replace mode or an identified account change replaces prior-account history; same-account merge retains older orders through `mergeOrderData`.
- Global range defaults to all time. Clock refreshes each minute and on focus/visibility events. Tab navigation supports arrow keys, Home, and End.

## Side Effects

- Entry point initializes locale, imports global styles, and mounts React into `#root`.
- Chrome host reads/writes extension storage, registers scoped runtime listeners, injects `bridge.js` and `content.js` into the stored Shopee tab, and passes a scan token into MAIN world. Scan implementation uses the existing order-list read.
- Loader creates stall timers; dashboard creates clock interval and focus/visibility listeners with cleanup. Avatar rendering can load a remote image and hides it on failure.
- Descendant actions can initiate scans, downloads, print dialogs, and budget-setting persistence; those boundaries are documented in child contracts.

## Verification

From repository root, run `npm test`; full gate: `npm ci && npm run verify`. No commands were executed while generating this contract.
