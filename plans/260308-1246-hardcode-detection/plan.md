# Plan: Hardcode Detection & Removal

## Overview

| Item | Detail |
|------|--------|
| **Plan ID** | 260308-1246-hardcode-detection |
| **Created** | 2026-03-08 |
| **Status** | In Progress |
| **Priority** | High |

## Purpose

Kiểm tra toàn bộ codebase để tìm và loại bỏ các hardcode, đảm bảo extension có thể hỗ trợ nhiều domain Shopee (vn, id, th, ph, my, sg...).

---

## Phase 1: Audit & Catalog Hardcodes

### 1.1 Domain Hardcodes (Critical)

| File | Line | Current Value | Proposed Fix |
|------|------|---------------|--------------|
| `src/content/content.js` | 18 | `https://shopee.vn/api/v4/...` | `API_BASE_URL` const |
| `src/manifest.json` | 17 | `https://shopee.vn/*` | Configurable |
| `src/popup/popup.ts` | 13 | `shopee.vn` | `SHOPEE_DOMAIN` const |
| `src/welcome/welcome.ts` | 7 | `https://shopee.vn` | `SHOPEE_DOMAIN` const |
| `src/dashboard/table.ts` | 45 | `https://shopee.vn/user/purchase/order/` | `ORDER_URL_TEMPLATE` |
| `src/popup/popup.html` | 29 | `https://shopee.vn/user/purchase` | Configurable |
| `src/dashboard/results.html` | 307 | `https://shopee.vn` | Configurable |

### 1.2 Storage Keys (Medium)

| File | Key | Proposed |
|------|-----|----------|
| `src/i18n/index.ts` | `shopeestatx-lang` | `APP_PREFIX + 'lang'` |
| `src/dashboard/theme-config.ts` | `shopeestatx-theme` | `APP_PREFIX + 'theme'` |
| `src/dashboard/budget.ts` | `shopeestatxBudget` | `APP_PREFIX + 'budget'` |
| `src/dashboard/data.ts` | `shopeeStats` | `APP_PREFIX + 'stats'` |
| `src/dashboard/data.ts` | `shopeeTabId` | `APP_PREFIX + 'tabId'` |
| `src/dashboard/incremental-fetch.ts` | `shopeeStats`, `shopeeTabId` | Use `APP_PREFIX` |

### 1.3 Event Names (Low)

| File | Event Name |
|------|------------|
| Multiple | `shopeestatx:*` events → `APP_PREFIX + ':'*` |

### 1.4 External URLs (Info Only)

- Buy Me a Coffee: `cdn.buymeacoffee.com` - OK to keep (user donation)
- Portfolio: `ninhhaidang.github.io` - OK to keep (author link)
- GitHub: Various - OK to keep (project links)

---

## Phase 2: Create Config Module

### 2.1 Create `src/config.ts`

```typescript
// src/config.ts
export const CONFIG = {
  // Domain configuration
  DOMAINS: {
    vn: 'shopee.vn',
    id: 'shopee.co.id',
    th: 'shopee.co.th',
    ph: 'shopee.ph',
    my: 'shopee.com.my',
    sg: 'shopee.sg',
    tw: 'shopee.tw',
  } as const,

  // Current active domain (default: vn)
  ACTIVE_DOMAIN: 'vn',

  // Storage keys prefix
  STORAGE_PREFIX: 'shopeestatx',

  // Event prefix
  EVENT_PREFIX: 'shopeestatx',
} as const;

export function getActiveDomain(): string {
  return CONFIG.DOMAINS[CONFIG.ACTIVE_DOMAIN as keyof typeof CONFIG.DOMAINS];
}

export function getApiBaseUrl(): string {
  return `https://${getActiveDomain()}/api/v4/order/get_all_order_and_checkout_list`;
}

export function getOrderUrl(orderId: string): string {
  return `https://${getActiveDomain()}/user/purchase/order/${orderId}`;
}

export function getStorageKey(key: string): string {
  return `${CONFIG.STORAGE_PREFIX}-${key}`;
}

export function getEventName(event: string): string {
  return `${CONFIG.EVENT_PREFIX}:${event}`;
}
```

---

## Phase 3: Update Files

### 3.1 Priority 1 - Core Files

| File | Changes |
|------|---------|
| `src/content/content.js` | Use config for API URL |
| `src/manifest.json` | Update to support all domains via host_permissions |
| `src/popup/popup.ts` | Use config for domain check |
| `src/welcome/welcome.ts` | Use config for URL |

### 3.2 Priority 2 - Dashboard Files

| File | Changes |
|------|---------|
| `src/dashboard/table.ts` | Use config for order link |
| `src/dashboard/data.ts` | Use config for storage keys |
| `src/dashboard/incremental-fetch.ts` | Use config for storage keys |
| `src/dashboard/budget.ts` | Use config for storage key |
| `src/dashboard/theme-config.ts` | Use config for storage key |
| `src/i18n/index.ts` | Use config for storage key |

### 3.3 Priority 3 - UI Updates

| File | Changes |
|------|---------|
| `src/popup/popup.html` | Dynamic domain links |
| `src/dashboard/results.html` | Dynamic domain links |

---

## Phase 4: Update Manifest for Multi-Domain

### 4.1 New host_permissions

```json
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

---

## Phase 5: Testing

- Verify extension works on shopee.vn
- Verify all storage keys work correctly
- Verify all event listeners work
- Build and verify no errors

---

## Success Criteria

1. All domain hardcodes removed and centralized in config
2. All storage keys use consistent prefix
3. Extension supports multi-domain (future-ready)
4. No breaking changes to existing functionality
5. Build passes without errors

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| API endpoint changes | Medium | Config allows quick updates |
| Storage migration | Low | Keep backward compatibility |
| Manifest permissions | Low | Additional domains are additive |

---

## Phases

| Phase | Title | Status |
|-------|-------|--------|
| 1 | [Audit & Catalog Hardcodes](phase-01-audit-hardcodes.md) | Completed |
| 2 | [Create Config Module](phase-02-create-config.md) | Completed |
| 3 | [Update Core Files](phase-03-update-core-files.md) | Completed |
| 4 | [Update Dashboard Files](phase-04-update-dashboard-files.md) | Completed |
| 5 | [Update UI Files](phase-05-update-ui-files.md) | Completed |
| 6 | [Build and Test](phase-06-build-and-test.md) | Completed |
| 7 | [Update Documentation](phase-07-update-docs.md) | Pending |

---

## Dependencies

- None - pure refactoring

## Unresolved Questions

1. Should we add a UI to select domain, or auto-detect from current tab?
2. Should we store the active domain in localStorage for persistence?
