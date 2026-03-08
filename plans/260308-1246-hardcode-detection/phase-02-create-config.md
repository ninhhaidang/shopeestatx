# Phase 2: Create Config Module

## Status: Completed

## Overview

- **Priority**: Critical
- **Effort**: Medium

## Context Links

- Phase 1: `/plans/260308-1246-hardcode-detection/phase-01-audit-hardcodes.md`

## Requirements

### Functional Requirements

1. Tạo module config tập trung
2. Export constants và helper functions
3. Hỗ trợ multi-domain

## Architecture

### File: `src/config.ts`

```typescript
/**
 * ShopeeStatX Configuration Module
 * Centralized configuration for all hardcoded values
 */

export const CONFIG = {
  // Domain configuration - extendable for future markets
  DOMAINS: {
    vn: 'shopee.vn',
    id: 'shopee.co.id',
    th: 'shopee.co.th',
    ph: 'shopee.ph',
    my: 'shopee.com.my',
    sg: 'shopee.sg',
    tw: 'shopee.tw',
  } as const,

  // Current active domain
  ACTIVE_DOMAIN: 'vn',

  // Storage keys - consistent prefix
  STORAGE_PREFIX: 'shopeestatx',

  // Event names - consistent prefix
  EVENT_PREFIX: 'shopeestatx',

  // Message source identifier
  MESSAGE_SOURCE: 'shopee-stats',
} as const;

export type Domain = keyof typeof CONFIG.DOMAINS;

// ============= Helper Functions =============

export function getActiveDomain(): string {
  return CONFIG.DOMAINS[CONFIG.ACTIVE_DOMAIN as Domain];
}

export function getApiBaseUrl(): string {
  return `https://${getActiveDomain()}/api/v4/order/get_all_order_and_checkout_list`;
}

export function getOrderUrl(orderId: string): string {
  return `https://${getActiveDomain()}/user/purchase/order/${orderId}`;
}

export function getPurchaseUrl(): string {
  return `https://${getActiveDomain()}/user/purchase`;
}

export function getHomeUrl(): string {
  return `https://${getActiveDomain()}`;
}

export function getStorageKey(key: string): string {
  return `${CONFIG.STORAGE_PREFIX}-${key}`;
}

export function getEventName(event: string): string {
  return `${CONFIG.EVENT_PREFIX}:${event}`;
}

export function getMessageSource(): string {
  return CONFIG.MESSAGE_SOURCE;
}

// ============= Storage Key Constants =============

export const STORAGE_KEYS = {
  STATS: getStorageKey('stats'),
  TAB_ID: getStorageKey('tabId'),
  THEME: getStorageKey('theme'),
  LANGUAGE: getStorageKey('lang'),
  BUDGET: getStorageKey('budget'),
} as const;

// ============= Event Names =============

export const EVENTS = {
  APPLY_FILTERS: getEventName('apply-filters'),
  DATE_RANGE_CLEARED: getEventName('date-range-cleared'),
  DATE_RANGE_SELECTED: getEventName('date-range-selected'),
  FILTER_BY_SHOP: getEventName('filter-by-shop'),
} as const;
```

## Related Code Files

### Create

- `src/config.ts` - New file

## Implementation Steps

1. Create `src/config.ts` with all config values
2. Export helper functions for common operations
3. Define storage key constants
4. Define event name constants

## Success Criteria

- [ ] Config module created with all hardcoded values
- [ ] Helper functions work correctly
- [ ] TypeScript compiles without errors

## Risk Assessment

- **Risk**: None - pure addition, no breaking changes
