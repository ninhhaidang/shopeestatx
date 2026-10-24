/**
 * ShopeeStatX Configuration Module
 * Centralized configuration for all hardcoded values
 *
 * This module provides a single source of truth for:
 * - Domain configuration (multi-market support)
 * - Storage keys (consistent prefix)
 * - Message source identifier
 */

// ============= Domain Configuration =============

const DOMAINS = {
  vn: 'shopee.vn',
  id: 'shopee.co.id',
  th: 'shopee.co.th',
  ph: 'shopee.ph',
  my: 'shopee.com.my',
  sg: 'shopee.sg',
  tw: 'shopee.tw',
} as const;

type Domain = keyof typeof DOMAINS;

const activeDomain: Domain = 'vn';

// ============= URL Helpers =============

export function getActiveDomainUrl(): string {
  return DOMAINS[activeDomain];
}

export function getOrderUrl(orderId: string): string {
  return `https://${DOMAINS[activeDomain]}/user/purchase/order/${orderId}`;
}

export function getLoginUrl(): string {
  return `https://${DOMAINS[activeDomain]}/buyer/login`;
}

export function getHomeUrl(): string {
  return `https://${DOMAINS[activeDomain]}`;
}

// ============= Storage Configuration =============

const STORAGE_PREFIX = 'shopeestatx';

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

// ============= Message Configuration =============

export const MESSAGE_SOURCE = 'shopee-stats';
