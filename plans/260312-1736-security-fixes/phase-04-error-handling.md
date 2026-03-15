# Phase 4: Error Handling

**Priority:** High
**Status:** Pending

## Overview

Add try-catch to chrome.storage and API operations that lack proper error handling.

## Current State (Missing try-catch)

| File | Operation | Risk |
|------|-----------|------|
| data.ts:90 | chrome.storage.local.get | High - no callback error handling |
| budget.ts:23 | chrome.storage.local.get | High |
| budget.ts:40 | chrome.storage.local.set | High |
| incremental-fetch.ts:16 | chrome.storage.local.get | Medium |
| incremental-fetch.ts:62 | chrome.storage.local.set | Medium |

## Implementation

### data.ts (loadDataFromStorage)
```typescript
export function loadDataFromStorage(): void {
  chrome.storage.local.get([STORAGE_KEYS.STATS], function (result) {
    try {  // ADD
      document.getElementById('loading')!.classList.add('hidden');
      const data = result[STORAGE_KEYS.STATS];
      if (!data || !data.orders || data.orders.length === 0) {
        document.getElementById('noData')!.classList.remove('hidden');
        return;
      }
      state.allOrdersData = data;
      initializeUI(data);
      updateLastUpdatedTime(data.cachedAt);
    } catch (error) {  // ADD
      console.error('Storage load error:', error);
      document.getElementById('loading')!.classList.add('hidden');
      document.getElementById('noData')!.classList.remove('hidden');
    }  // ADD
  });
}
```

### budget.ts (lines 23, 40)
Wrap callbacks in try-catch, add error feedback to UI.

### incremental-fetch.ts
Already has try-catch at line 15 - verify all operations wrapped.

## Files to Modify
- `src/dashboard/data.ts`
- `src/dashboard/budget.ts`

## Success Criteria
- [ ] All chrome.storage operations have try-catch
- [ ] User sees error message if storage fails
- [ ] No unhandled promise rejections in console

<!-- Updated: Validation Session 1 - Confirmed: i18n System -->
