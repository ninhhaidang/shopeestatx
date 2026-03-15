# Phase 3: Chart.js Memory Leak Fix

**Priority:** High
**Status:** Pending

## Overview

Add cleanup for Chart.js instances on page unload to prevent memory leaks.

## Current State

Charts are destroyed before re-render in `charts.ts`:
- Line 90: `if (monthlyChart) monthlyChart.destroy();`
- Line 180: `if (shopChart) shopChart.destroy();`

**Missing:** Cleanup on page unload.

## Implementation

Add cleanup in `src/dashboard/results.ts` or `charts.ts`:

```typescript
// Add at module level
function cleanupCharts(): void {
  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }
  if (shopChart) {
    shopChart.destroy();
    shopChart = null;
  }
}

// Add event listener
window.addEventListener('beforeunload', cleanupCharts);
window.addEventListener('unload', cleanupCharts);
```

## Files to Modify
- `src/dashboard/charts.ts` - add cleanup function and event listeners

## Success Criteria
- [ ] No Chart.js instances in memory after page closes
- [ ] Chrome DevTools shows no retained canvas elements
- [ ] Multiple render cycles don't increase memory usage
