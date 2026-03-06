---
title: "Fix heatmap month label alignment"
description: "Fix GitHub-style heatmap where month labels are misaligned with actual month cells"
status: completed
priority: P2
effort: 1h
branch: main
tags: [fix, frontend]
created: 2026-03-06
---

# Fix Heatmap Month Label Alignment

## Overview

Fix the GitHub-style heatmap where month labels (Jan, Feb, Mar...) are misaligned with the actual month cells.

## Problem

**Current behavior:**
- Month labels are placed at column positions based on when `row === 0` and month changes
- This doesn't align with actual first day of each month
- Result: Labels appear in wrong positions, looking "lệch" (skewed)

**Root cause (heatmap.ts lines 106-109):**
```typescript
if (row === 0 && d.getMonth() !== lastMonth) {
  monthLabels += `<text x="${x}" y="12" class="heatmap-label">${MONTHS[d.getMonth()]}</text>`;
  lastMonth = d.getMonth();
}
```

This draws label at ANY column where row=0 AND month changes - not necessarily at the first day of the month.

## Solution

Pre-compute exact column position for each month's first day:

```typescript
// Phase 1: Pre-compute month start positions
const monthStartCols: Record<number, number> = {};

// Scan all dates to find column position of each month's first day
for (let col = 0; col < COLS; col++) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + col * ROWS); // Get first row (Sunday) of each week

  // Check each day in this week to find the 1st of month
  for (let row = 0; row < ROWS; row++) {
    const dayDate = new Date(d);
    dayDate.setDate(d.getDate() + row);
    if (dayDate.getMonth() !== d.getMonth()) continue; // Skip if changed month

    if (dayDate.getDate() === 1) {
      monthStartCols[dayDate.getMonth()] = col;
    }
  }
}

// Phase 2: Draw labels at exact positions
Object.entries(monthStartCols).forEach(([month, col]) => {
  monthLabels += `<text x="${col * step + 24}" y="12" class="heatmap-label">${MONTHS[Number(month)]}</text>`;
});
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/dashboard/heatmap.ts` | Update month label placement logic |

## Implementation Steps

### Step 1: Pre-compute month start columns
- Create a map of month number → column position
- Iterate through all weeks to find exact column of month first day

### Step 2: Draw labels at computed positions
- Replace current label-drawing logic with pre-computed positions
- Ensure labels appear directly above first day of each month

### Step 3: Test alignment
- Verify month labels align with actual month cells
- Check both "last 12 months" and "selected year" modes

## Success Criteria
- [ ] Month labels align with first day of each month
- [ ] No visual misalignment in any month
- [ ] Works with year filter dropdown
- [ ] Build passes
