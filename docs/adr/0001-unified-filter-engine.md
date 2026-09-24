---
status: accepted
date: 2026-09-24
---

# Unified FilterEngine and TimeCriteria Discriminated Union

Temporal filtering in the dashboard was previously split across DOM elements (`#filterYear`, `#filterMonth`), global state flags (`state.selectedDay`, `state.dateRange`), and date picker preset heuristics, resulting in "ghost date" reactivation bugs, inconsistent filtering between views, and an active circular event cascade via `EVENTS.APPLY_FILTERS`. We replace this with a pure, in-process `FilterEngine` module that evaluates orders against a unified `FilterCriteria` value object using a discriminated union for `TimeCriteria` (`all | year | month | day | range`).

## Considered Options

- **Normalized `[start, end]` intervals for all temporal queries**: Rejected because it strips user semantic intent (a user selecting year 2024 is expressing a different query intent than an arbitrary 365-day range), forcing charts and filter chips to reverse-engineer intent from timestamps.
- **Stateful Filter Manager retaining DOM scraping**: Rejected because coupling filtering arithmetic to DOM elements and global state flags prevents testing in standard Node/Vitest environments and reproduces circular update cascades.

## Consequences

- **Pure Test Surface**: `FilterEngine.evaluate` can be tested 100% deterministically in Vitest with zero DOM harness or Chrome extension mocks.
- **Single Source of Truth**: `state.ts` replaces fragmented fields (`dateRange`, `selectedDay`, `currentSort`) with a single `criteria: FilterCriteria`.
- **Decoupled Visualizations**: Charts and heatmaps no longer manipulate filter DOM nodes or dispatch custom DOM events; drill-down interactions pass criteria updates via explicit callbacks.
- **Authoritative Date Consistency**: Temporal filtering consistently prioritizes `deliveryDate` with deterministic fallback to order placement date across all filter modes.
