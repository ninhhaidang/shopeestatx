# Phase 3: Update Core Files

## Status: Completed

## Overview

- **Priority**: Critical
- **Effort**: Medium

## Context Links

- Phase 2: `/plans/260308-1246-hardcode-detection/phase-02-create-config.md`

## Requirements

### Functional Requirements

1. Cập nhật các file core sử dụng config module
2. Thay thế hardcode bằng config values

## Related Code Files

### Modify

| File | Changes |
|------|---------|
| `src/content/content.js` | API URL, message source |
| `src/manifest.json` | host_permissions for multi-domain |
| `src/popup/popup.ts` | Domain check |
| `src/welcome/welcome.ts` | URL |
| `src/bridge/bridge.ts` | Message source |

## Implementation Steps

### 3.1 Update `src/content/content.js`

```javascript
// Before
let url = "https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=" + limit + "&offset=" + offset;
source: 'shopee-stats'

// After
import { getApiBaseUrl, getMessageSource } from './config.js';
let url = getApiBaseUrl() + "?limit=" + limit + "&offset=" + offset;
source: getMessageSource()
```

### 3.2 Update `src/manifest.json`

```json
// Before
"host_permissions": ["https://shopee.vn/*"]

// After
"host_permissions": [
  "https://shopee.vn/*",
  "https://shopee.co.id/*",
  "https://shopee.co.th/*",
  "https://shopee.ph/*",
  "https://shopee.com.my/*",
  "https://shopee.sg/*",
  "https://shopee.tw/*"
]
```

### 3.3 Update `src/popup/popup.ts`

```typescript
// Before
if (!url.includes('shopee.vn'))

// After
import { getActiveDomain } from '../config';
if (!url.includes(getActiveDomain()))
```

### 3.4 Update `src/welcome/welcome.ts`

```typescript
// Before
chrome.tabs.create({ url: 'https://shopee.vn' });

// After
import { getHomeUrl } from '../config';
chrome.tabs.create({ url: getHomeUrl() });
```

### 3.5 Update `src/bridge/bridge.ts`

```typescript
// Before
if (!event.data || event.data.source !== 'shopee-stats') return;

// After
import { getMessageSource } from '../config';
if (!event.data || event.data.source !== getMessageSource()) return;
```

## Success Criteria

- [ ] All core files use config module
- [ ] No hardcoded domain values remain
- [ ] Build passes without errors

## Risk Assessment

- **Risk**: Medium - Multiple files modified
- **Mitigation**: Test each file individually before build
