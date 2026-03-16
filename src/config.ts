/**
 * ShopeeStatX Configuration Module
 * Centralized configuration for all hardcoded values
 *
 * This module provides a single source of truth for:
 * - Domain configuration (multi-market support)
 * - Storage keys (consistent prefix)
 * - Event names (consistent prefix)
 * - Message source identifier
 */

// ============= Domain Configuration =============

export const DOMAINS = {
  vn: 'shopee.vn',
  id: 'shopee.co.id',
  th: 'shopee.co.th',
  ph: 'shopee.ph',
  my: 'shopee.com.my',
  sg: 'shopee.sg',
  tw: 'shopee.tw',
} as const;

export type Domain = keyof typeof DOMAINS;

// Default active domain - can be changed programmatically
let activeDomain: Domain = 'vn';

export function setActiveDomain(domain: Domain): void {
  activeDomain = domain;
}

export function getActiveDomain(): Domain {
  return activeDomain;
}

export function getActiveDomainUrl(): string {
  return DOMAINS[activeDomain];
}

// ============= URL Helpers =============

export function getApiBaseUrl(): string {
  return `https://${DOMAINS[activeDomain]}/api/v4/order/get_all_order_and_checkout_list`;
}

export function getOrderUrl(orderId: string): string {
  return `https://${DOMAINS[activeDomain]}/user/purchase/order/${orderId}`;
}

export function getPurchaseUrl(): string {
  return `https://${DOMAINS[activeDomain]}/user/purchase`;
}

export function getLoginUrl(): string {
  return `https://${DOMAINS[activeDomain]}/buyer/login`;
}

export function getHomeUrl(): string {
  return `https://${DOMAINS[activeDomain]}`;
}

// ============= Storage Configuration =============

export const STORAGE_PREFIX = 'shopeestatx';

export function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}-${key}`;
}

// Pre-defined storage keys for consistency
export const STORAGE_KEYS = {
  STATS: getStorageKey('stats'),
  TAB_ID: getStorageKey('tabId'),
  THEME: getStorageKey('theme'),
  BUDGET: getStorageKey('budget'),
} as const;

// ============= Event Configuration =============

export const EVENT_PREFIX = 'shopeestatx';

export function getEventName(event: string): string {
  return `${EVENT_PREFIX}:${event}`;
}

// Pre-defined event names for consistency
export const EVENTS = {
  APPLY_FILTERS: getEventName('apply-filters'),
  DATE_RANGE_CLEARED: getEventName('date-range-cleared'),
  DATE_RANGE_SELECTED: getEventName('date-range-selected'),
  FILTER_BY_SHOP: getEventName('filter-by-shop'),
} as const;

// ============= Message Configuration =============

export const MESSAGE_SOURCE = 'shopee-stats';

export function getMessageSource(): string {
  return MESSAGE_SOURCE;
}
