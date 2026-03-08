# Phase 5: Update UI Files

## Status: Completed

## Overview

- **Priority**: Medium
- **Effort**: Low

## Context Links

- Phase 4: `/plans/260308-1246-hardcode-detection/phase-04-update-dashboard-files.md`

## Requirements

### Functional Requirements

1. Cập nhật HTML files với dynamic domain links
2. Thay thế hardcoded URLs bằng JavaScript-generated links

## Related Code Files

### Modify

| File | Changes |
|------|---------|
| `src/popup/popup.html` | Dynamic shopee links |
| `src/dashboard/results.html` | Dynamic shopee links |

## Implementation Steps

### 5.1 Update `src/popup/popup.html`

```html
<!-- Before -->
Vui lòng mở <a href="https://shopee.vn/user/purchase" target="_blank">Shopee</a>

<!-- After - sử dụng JavaScript trong popup.ts để set href -->
Vui lòng mở <a href="#" id="shopee-link" target="_blank">Shopee</a>
```

Trong `popup.ts`:
```typescript
import { getPurchaseUrl, getHomeUrl } from '../config';
document.getElementById('shopee-link').href = getPurchaseUrl();
```

### 5.2 Update `src/dashboard/results.html`

```html
<!-- Before -->
<a href="https://shopee.vn" target="_blank" data-i18n="nodata.link">Mở Shopee</a>

<!-- After -->
<a href="#" id="shopee-home-link" target="_blank" data-i18n="nodata.link">Mở Shopee</a>
```

Trong `results.ts`:
```typescript
import { getHomeUrl } from '../config';
document.getElementById('shopee-home-link').href = getHomeUrl();
```

## Notes

- HTML files không thể import TypeScript trực tiếp
- Cần sử dụng JavaScript để set dynamic URLs
- Các external links (GitHub, Portfolio, Buy Me a Coffee) giữ nguyên vì đây là project info, không phải app config

## Success Criteria

- [ ] All shopee.vn links are dynamic
- [ ] External links (GitHub, etc.) remain unchanged

## Risk Assessment

- **Risk**: Low - Simple find/replace
