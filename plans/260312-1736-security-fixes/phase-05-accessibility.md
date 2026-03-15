# Phase 5: Accessibility - ARIA Labels

**Priority:** Medium
**Status:** Pending

## Overview

Add ARIA labels to dropdown select elements for screen reader accessibility.

## Current State

Only export button has ARIA attributes (results.ts:148-152):
```typescript
btnExport.setAttribute('aria-haspopup', 'true');
btnExport.setAttribute('aria-expanded', 'false');
```

## Missing ARIA Labels

| Dropdown | ID | Required ARIA |
|----------|-----|---------------|
| Filter Year | filterYear | aria-label or aria-labelledby |
| Filter Month | filterMonth | aria-label or aria-labelledby |
| Filter Status | filterStatus | aria-label or aria-labelledby |
| Filter Category | filterCategory | aria-label or aria-labelledby |
| Shop Count | shopCount | aria-label |
| Shop Metric | shopMetric | aria-label |
| Page Size | pageSize | aria-label |

## Implementation

### Option 1: Add aria-label to HTML

Update `src/dashboard/results.html`:
```html
<select id="filterYear" aria-label="Lọc theo năm">
<select id="filterMonth" aria-label="Lọc theo tháng">
<select id="filterStatus" aria-label="Lọc theo trạng thái">
<select id="filterCategory" aria-label="Lọc theo danh mục">
<select id="shopMetric" aria-label="Chỉ số hiển thị">
<select id="shopCount" aria-label="Số shop hiển thị">
<select id="pageSize" aria-label="Số dòng mỗi trang">
```

### Option 2: Add via JavaScript

Add in `src/dashboard/results.ts` init function:
```typescript
(document.getElementById('filterYear') as HTMLElement).setAttribute('aria-label', 'Lọc theo năm');
```

## Files to Modify
- `src/dashboard/results.html` OR
- `src/dashboard/results.ts`

## Success Criteria
- [ ] All dropdowns have aria-label
- [ ] Screen reader announces dropdown purpose
- [ ] No ARIA validation errors in accessibility audit
