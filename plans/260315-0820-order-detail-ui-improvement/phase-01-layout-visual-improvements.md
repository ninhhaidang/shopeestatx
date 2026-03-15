# Phase 1: Layout & Visual Improvements

**Priority:** HIGH
**Estimated Effort:** 1-2 days

---

## Overview

Implement UI improvements using existing data fields only. No backend/parser changes needed.

## Requirements

### 1.1 Two-Column Layout
- Split detail content into two columns: Order Info (left) | Product Details (right)
- Use CSS Grid or Flexbox
- Responsive: Stack vertically on mobile (<768px)

### 1.2 Add Order Date Display
- Use existing `orderMonth` and `orderYear` fields
- Display as "Month Year" format (e.g., "January 2026")
- Show "Days to deliver" = deliveryDate - orderDate

### 1.3 Status Badge Enhancement
- Add subtle background tint using `--status-bg` color
- Ensure consistent with fixed theme colors

### 1.4 Expand/Collapse Animation
- Chevron rotation indicator
- Keep existing 0.3s expand animation

---

## Architecture

### CSS Structure (src/styles/table.css)
```css
/* Two-column layout */
.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
}

/* Section styling */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-header {
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}

/* Status badge with background */
.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--status-bg);
  color: var(--status-color);
}

/* Chevron rotation */
.order-row .expand-icon {
  transition: transform 0.2s ease;
}
.order-row.expanded .expand-icon {
  transform: rotate(180deg);
}
```

### HTML Structure (src/dashboard/table.ts)
```typescript
// Left column: Order Info
const orderInfoItems = [
  { label: t('table.detail.orderId'), value: safeOrderId },
  { label: t('table.detail.status'), value: order.status, isStatus: true },
  { label: 'Order Date', value: formatOrderDate(order.orderMonth, order.orderYear) },
  { label: t('table.detail.deliveryDate'), value: fullDate, clickable: true },
  { label: t('table.detail.seller'), value: order.shopName, clickable: true },
];

// Right column: Product Details
const productItems = [
  { label: t('table.detail.productName'), value: order.name },
  { label: t('table.detail.quantity'), value: String(order.productCount) },
  { label: t('table.detail.total'), value: order.subTotalFormatted },
  { label: t('table.detail.productDetail'), value: order.productSummary },
];

// Calculate days to deliver
const daysToDeliver = calculateDaysToDeliver(order.orderMonth, order.orderYear, order.deliveryDate);
if (daysToDeliver !== null) {
  orderInfoItems.push({ label: 'Days to Deliver', value: `${daysToDeliver} days` });
}
```

---

## Implementation Steps

### Step 1: Update table.ts
1. Add import for new formatting function
2. Create `formatOrderDate(month, year)` function
3. Create `calculateDaysToDeliver()` function
4. Modify `renderCurrentPage()` to use two-column layout
5. Separate data into orderInfo and productDetails arrays

### Step 2: Update table.css
1. Add `.detail-content` grid layout
2. Add `.detail-section` and `.detail-section-header` styles
3. Add `.status-badge` background tint
4. Add expand icon rotation CSS
5. Add responsive breakpoint for mobile

### Step 3: Add i18n keys
Add new translation keys for:
- "Order Date" / "Ngày đặt hàng"
- "Days to Deliver" / "Ngày giao hàng"
- Section headers (optional)

---

## Key Functions to Add

```typescript
// src/dashboard/table.ts

export function formatOrderDate(month: number | null, year: number | null): string {
  if (!month || !year) return '-';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[month - 1]} ${year}`;
}

export function calculateDaysToDeliver(
  orderMonth: number | null,
  orderYear: number | null,
  deliveryDate: string | null
): number | null {
  if (!orderMonth || !orderYear || !deliveryDate) return null;

  const orderDate = new Date(orderYear, orderMonth - 1, 1);
  const delivery = new Date(deliveryDate);
  const diffTime = delivery.getTime() - orderDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}
```

---

## Todo List

- [x] Add `formatOrderDate()` function
- [x] Add `calculateDaysToDeliver()` function
- [x] Update `table.ts` HTML generation for two columns
- [x] Add two-column grid styles in `table.css`
- [x] Add section header styles
- [x] Add status badge background tint
- [x] Add expand icon rotation
- [x] Add mobile responsive breakpoint
- [x] Add i18n keys for new labels
- [ ] Test on all 5 themes
- [ ] Test responsive on mobile width

---

## Success Criteria

- [x] Two-column layout displays on desktop (≥768px)
- [x] Single column stacks on mobile (<768px)
- [x] Order date shows as "Month Year" format
- [x] Days to deliver shows number (if calculable)
- [x] Status badge has subtle background color
- [x] Expand animation smooth (0.2-0.3s)
- [ ] No visual regression on orange, forest, rose, sky, lavender themes
