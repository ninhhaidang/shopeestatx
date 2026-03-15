# Phase 1: XSS Prevention

**Priority:** Critical
**Status:** Pending

## Overview

Add `escapeHtml()` to all `innerHTML` calls that insert user data (order names, shop names, etc.). Static strings are safe.

## Files with innerHTML Usage

| File | Line | Data Type | Risk |
|------|------|-----------|------|
| filters.ts | 176 | filter chip labels (user input searchTerm) | Medium |
| table.ts | 44 | order data (name, shopName, status) | High |
| table.ts | 73 | detail row (user data) | High |
| insights.ts | 89 | i18n text only | Low |
| insights.ts | 92 | insights HTML (user-generated) | High |
| budget.ts | 64 | budget config | Medium |
| budget.ts | 75 | budget display | Medium |
| heatmap.ts | 145 | heatmap HTML | Medium |
| date-range-picker.ts | 118 | date range display | Low |
| predictions.ts | 24,33 | prediction values | Low |
| comparison.ts | 72,82 | comparison text | Low |
| shop-loyalty.ts | 59 | static text | Low |
| shop-loyalty.ts | 73 | shop data | Medium |
| results.ts | 115 | theme names | Low |

## Implementation Steps

1. **Verify escapeHtml exists in utils.ts**
   ```typescript
   // src/dashboard/utils.ts should have:
   export function escapeHtml(str: string): string { ... }
   ```

2. **Update filters.ts (line 176)**
   - `chip.label` contains user `searchTerm` - needs escaping

3. **Update table.ts (lines 44, 73)**
   - Already uses `escapeHtml` in most places - verify all user data is escaped
   - Line 56: `detailItems` - verify all user data escaped

4. **Update insights.ts (line 92)**
   - `insights` variable contains user-generated text - needs escaping

5. **Update budget.ts (lines 64, 75)**
   - Budget amounts come from user config - needs escaping

6. **Update heatmap.ts (line 145)**
   - Check if heatmap data contains user values

7. **Update shop-loyalty.ts (line 73)**
   - Shop names from API - needs escaping

## Success Criteria
- [ ] All innerHTML calls with user data use escapeHtml()
- [ ] No console warnings about XSS
- [ ] Unit test confirms escaping works for `<script>` tags

## Risk Assessment
- Existing code in table.ts already uses escapeHtml - extend pattern
- Static strings (i18n) don't need escaping

<!-- Updated: Validation Session 1 - Confirmed: Use escapeHtml (Recommended) -->
