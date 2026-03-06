---
title: "ShopeeStatX v2.5-v3.1 Major Overhaul"
description: "4-phase upgrade: Foundation (Vite+TS), Polish (dark mode, incremental fetch), Insights (heatmap, categories, budget), Global (i18n)"
status: completed
priority: P1
effort: 80h
branch: main
tags: [feature, refactor, infra, frontend]
created: 2026-03-05
---

# ShopeeStatX v2.5 → v3.1 Major Overhaul

## Overview

Transform ShopeeStatX from a vanilla JS Chrome extension into a modern, typed, tested, feature-rich spending intelligence tool. 4 sequential phases, each shippable as independent release.

## Context

- Brainstorm: [brainstorm report](../reports/brainstorm-260305-1710-shopeestatx-upgrade-proposals.md)
- Current: v2.1.0, vanilla JS, 17 files, no build system, no tests
- Target: v3.1 with Vite+TS, dark mode, analytics, i18n

## Phases

| # | Phase | Version | Status | Effort | Link |
|---|-------|---------|--------|--------|------|
| 1 | Foundation — Vite + TypeScript + Tests + CI/CD | v2.5 | Complete | 28h | [phase-01](./phase-01-foundation-vite-typescript-tests.md) |
| 2 | Polish — Dark Mode + Incremental Fetch + Export | v2.6 | Complete | 12h | [phase-02](./phase-02-polish-dark-mode-fetch-export.md) |
| 3 | Insights — Heatmap + Categories + Budget + Trends | v3.0 | Complete | 28h | [phase-03](./phase-03-insights-heatmap-categories-budget.md) |
| 4 | Global — i18n + Date Range Picker | v3.1 | Complete | 12h | [phase-04](./phase-04-global-i18n-date-range-picker.md) |

## Dependencies

- Phase 1 must complete before Phase 2 (build system needed)
- Phase 2 independent of Phase 3 content-wise but sequential for release
- Phase 3 benefits from Phase 1 TypeScript types
- Phase 4 independent of Phase 3 but sequential for release order

## Key Decisions (Validated)

1. **Stay vanilla** — no React/Svelte/Preact. Current architecture is clean enough.
2. **Manual Vite config** (not @crxjs) — full control, no third-party plugin dependency risk
3. **content.js stays IIFE** — MAIN world has no ES module support
4. **Chart.js: pin exact version** — match vendored chart.min.js version, upgrade separately later
5. **Incremental fetch: stop-on-known-ID** — fetch newest-first, stop at first cached orderId
6. **Categories: auto + manual override** — keyword classifier + user can correct via click
7. **Currency: Intl.NumberFormat per locale** — VND always, but format adapts to locale conventions
8. **Keyword-based categorization** — no ML, keep bundle small
9. **CSS split, no Tailwind** — existing custom properties work well

## Risk Summary

| Risk | Mitigation |
|------|-----------|
| Manual Vite config complexity | Well-documented rollupOptions; Chrome ext examples available |
| content.js IIFE build | Separate Rollup entry point in vite.config.ts |
| Chart.js version mismatch | Pin exact version from vendored header; test all charts |
| Shopee API changes | Existing dual-parser (new+old API) pattern covers this |
| Category misclassification | Manual override UI; user corrections persist in storage |
