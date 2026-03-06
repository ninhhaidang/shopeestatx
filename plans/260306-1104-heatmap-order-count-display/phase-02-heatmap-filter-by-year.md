# Phase 2: Filter Heatmap by Selected Year

## Overview
- **Status:** Complete
- **Effort:** 1h

## Context
- Current: Heatmap always shows 12 months (last year from today)
- New: Heatmap shows full year matching filterYear dropdown

## Requirements

### Functional
1. Read selected year from filterYear dropdown
2. Display 12 months of that year (Jan 1 - Dec 31)
3. If no year selected, fallback to current behavior (last 12 months)

### Implementation

**Modify `src/dashboard/heatmap.ts`:**

```typescript
export function renderHeatmap(container: HTMLElement, orders: Order[]): void {
  // Get selected year from filter
  const filterYear = (document.getElementById('filterYear') as HTMLSelectElement).value;
  const selectedYear = filterYear ? parseInt(filterYear) : null;

  // Determine date range
  let startDate: Date, endDate: Date;
  if (selectedYear) {
    // Show full year
    startDate = new Date(selectedYear, 0, 1);
    endDate = new Date(selectedYear, 11, 31);
  } else {
    // Fallback: last 12 months
    endDate = new Date();
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());
  }

  // Filter orders to selected year
  const filteredOrders = orders.filter(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return false;
    if (!order.deliveryDate) return false;
    const orderYear = new Date(order.deliveryDate).getFullYear();
    return selectedYear ? orderYear === selectedYear : true;
  });

  // Build day index from filtered orders
  const dayIndex = buildDayIndex(filteredOrders, startDate, endDate);
  // ... rest of render logic
}
```

**Modify `buildDayIndex` function:**

```typescript
function buildDayIndex(
  orders: Order[],
  startDate: Date,
  endDate: Date
): Record<string, HeatmapDay> {
  const dayMap: Record<string, { amount: number; count: number }> = {};

  orders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;
    if (!order.deliveryDate) return;
    const dateStr = order.deliveryDate.substring(0, 10);
    const d = new Date(dateStr);
    // Only include orders within the date range
    if (d < startDate || d > endDate) return;
    // ... rest of logic
  });
  // ... intensity calculation
}
```

## Success Criteria
- [ ] Heatmap shows data for selected year when filterYear is set
- [ ] Falls back to last 12 months when no year selected
- [ ] Works with existing year filter dropdown
