---
title: "Remove budget widget, move heatmap to summary cards"
description: "Remove the monthly budget card from summary section and move heatmap to that position"
status: completed
priority: P2
effort: 1h
branch: main
tags: [feature, frontend]
created: 2026-03-06
---

# Remove Budget Widget, Move Heatmap

## Overview

Remove the "Ngân sách tháng" (Monthly Budget) card from the summary cards section and move the heatmap to appear above the comparison cards.

## Context

Current layout:
```
[Summary Cards: Orders | Products | Total Spent]
[Comparison Cards: This Month | This Year | Avg Order | Budget]
[Heatmap]
```

New layout:
```
[Summary Cards: Orders | Products | Total Spent]
[Heatmap]
[Comparison Cards: This Month | This Year | Avg Order]
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/dashboard/results.html` | Remove budget card HTML, move heatmap section above comparison cards |

## Implementation

### Step 1: Remove budget card from comparison-cards div

Remove lines 148-151:
```html
<div class="comparison-card">
  <div class="card-title" data-i18n="comparison.budget">Ngân sách tháng</div>
  <div id="budgetWidget" class="budget-widget-inner"></div>
</div>
```

### Step 2: Move heatmap section

Move heatmap section (lines 154-158) to after summary cards (after line 139), before comparison-cards div.

### Step 3: Optional - Remove budget dialog

Keep or remove the budget dialog (lines 304-320) - if no longer used, can remove entirely.

## Success Criteria
- [ ] Budget card removed from summary section
- [ ] Heatmap moved to above comparison cards
- [ ] Layout still works correctly
- [ ] Build passes
