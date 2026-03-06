# Phase 1: Modify Heatmap to Show Order Count

## Overview
- **Status:** Complete
- **Effort:** 1h

## Context
- Current heatmap shows spending amount with tooltip: `${dateStr}: ${formatVND(day.amount)} (${day.orderCount} đơn)`
- New heatmap should show order count with tooltip: `${dateStr}: ${day.orderCount} đơn`

## Requirements

### Functional
1. Change intensity calculation from amount-based to count-based
2. Update tooltip to show only order count (not amount)
3. Keep existing color scheme (darker = more orders)

### Implementation

**Modify `src/dashboard/heatmap.ts`:**

```typescript
// Change intensity calculation - use orderCount quartiles instead of amount
const counts = Object.values(dayMap).map(v => v.count).sort((a, b) => a - b);
const q = (p: number) => counts[Math.floor(counts.length * p)] ?? 0;
const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];

const toIntensity = (c: number): 0 | 1 | 2 | 3 | 4 => {
  if (c === 0) return 0;
  if (c <= q1) return 1;
  if (c <= q2) return 2;
  if (c <= q3) return 3;
  return 4;
};

// Update tooltip
const tooltipText = day
  ? `${dateStr}: ${day.orderCount} đơn`
  : dateStr;
```

## Success Criteria
- [ ] Tooltip shows only order count
- [ ] Intensity based on order count (more orders = darker color)
