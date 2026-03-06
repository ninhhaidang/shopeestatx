---
title: "Heatmap Order Count Display"
description: "Change heatmap from showing amount to showing order count, filter by selected year instead of fixed 12 months"
status: completed
priority: P2
effort: 2h
branch: main
tags: [feature, frontend]
created: 2026-03-06
---

# Heatmap Order Count Display

## Overview

Change heatmap from displaying spending amount to displaying order count, and make it filter by the currently selected year instead of fixed 12 months.

## Context

- Current: Heatmap shows spending amount, always displays 12 months (last year)
- Requested: Heatmap shows order count, displays data for the filtered year

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Modify heatmap to show order count | Pending | 1h | [phase-01](./phase-01-heatmap-order-count.md) |
| 2 | Filter by selected year | Pending | 1h | [phase-02](./phase-02-heatmap-filter-by-year.md) |

## Key Files

| Action | File |
|--------|------|
| Modify | `src/dashboard/heatmap.ts` |

## Changes Required

1. **Display order count instead of amount**
   - Current: tooltip shows `${amount} (${count} đơn)`
   - New: tooltip shows `${count} đơn` and intensity based on count not amount

2. **Filter by selected year**
   - Current: Always shows last 12 months
   - New: Shows full year that matches filterYear dropdown
   - If no year selected, fallback to current behavior

3. **Intensity calculation**
   - Use orderCount quartiles instead of amount quartiles
