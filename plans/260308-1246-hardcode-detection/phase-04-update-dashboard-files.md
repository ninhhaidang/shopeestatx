# Phase 4: Update Dashboard Files

## Status: Completed

## Overview

- **Priority**: High
- **Effort**: Medium

## Context Links

- Phase 3: `/plans/260308-1246-hardcode-detection/phase-03-update-core-files.md`

## Requirements

### Functional Requirements

1. Cập nhật dashboard files sử dụng config module
2. Thay thế storage keys và event names

## Related Code Files

### Modify

| File | Changes |
|------|---------|
| `src/dashboard/data.ts` | Storage keys, message source, events |
| `src/dashboard/incremental-fetch.ts` | Storage keys |
| `src/dashboard/budget.ts` | Storage key |
| `src/dashboard/theme-config.ts` | Storage key |
| `src/dashboard/table.ts` | Order URL |
| `src/dashboard/filters.ts` | Event names |
| `src/dashboard/charts.ts` | Event names |
| `src/dashboard/shop-loyalty.ts` | Event names |
| `src/dashboard/results.ts` | Event names |
| `src/i18n/index.ts` | Storage key |

## Implementation Steps

### 4.1 Update `src/dashboard/data.ts`

```typescript
// Before
const storage = await chrome.storage.local.get(['shopeeTabId']);
const tabId = storage.shopeeTabId;
await chrome.storage.local.set({ shopeeStats: cacheData });
chrome.storage.local.get(['shopeeStats'], ...)

// After
import { STORAGE_KEYS, getMessageSource, EVENTS } from '../config';
const storage = await chrome.storage.local.get([STORAGE_KEYS.TAB_ID]);
const tabId = storage[STORAGE_KEYS.TAB_ID];
await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: cacheData });
chrome.storage.local.get([STORAGE_KEYS.STATS], ...)

// Event dispatch
document.dispatchEvent(new CustomEvent(EVENTS.APPLY_FILTERS, { detail: ... }));
if (message.source === getMessageSource() && message.type === 'progress')
```

### 4.2 Update `src/dashboard/incremental-fetch.ts`

```typescript
// Before
const storage = await chrome.storage.local.get(['shopeeStats', 'shopeeTabId']);
await chrome.storage.local.set({ shopeeStats: merged });

// After
import { STORAGE_KEYS } from '../config';
const storage = await chrome.storage.local.get([STORAGE_KEYS.STATS, STORAGE_KEYS.TAB_ID]);
await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: merged });
```

### 4.3 Update `src/dashboard/budget.ts`

```typescript
// Before
const STORAGE_KEY = 'shopeestatxBudget';

// After
import { STORAGE_KEYS } from '../config';
const STORAGE_KEY = STORAGE_KEYS.BUDGET;
```

### 4.4 Update `src/dashboard/theme-config.ts`

```typescript
// Before
const stored = localStorage.getItem('shopeestatx-theme');

// After
import { STORAGE_KEYS } from '../config';
const stored = localStorage.getItem(STORAGE_KEYS.THEME);
```

### 4.5 Update `src/dashboard/table.ts`

```typescript
// Before
<td><a href="https://shopee.vn/user/purchase/order/${safeOrderId}" ...>

// After
import { getOrderUrl } from '../config';
<td><a href="${getOrderUrl(safeOrderId)}" ...>
```

### 4.6 Update `src/dashboard/filters.ts`

```typescript
// Before
document.dispatchEvent(new CustomEvent('shopeestatx:date-range-cleared'));

// After
import { EVENTS } from '../config';
document.dispatchEvent(new CustomEvent(EVENTS.DATE_RANGE_CLEARED));
```

### 4.7 Update `src/i18n/index.ts`

```typescript
// Before
localStorage.setItem('shopeestatx-lang', resolved);
localStorage.getItem('shopeestatx-lang')

// After
import { STORAGE_KEYS } from '../config';
localStorage.setItem(STORAGE_KEYS.LANGUAGE, resolved);
localStorage.getItem(STORAGE_KEYS.LANGUAGE)
```

## Success Criteria

- [ ] All dashboard files use config module
- [ ] No hardcoded storage keys remain
- [ ] No hardcoded event names remain

## Risk Assessment

- **Risk**: Medium - Many files modified
- **Mitigation**: Verify each file compiles correctly
