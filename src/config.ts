/**
 * ShopeeStatX Configuration Module
 * Centralized configuration for all hardcoded values
 *
 * This module provides a single source of truth for:
 * - Domain configuration
 * - Storage keys (consistent prefix)
 * - Message source identifier
 */

// ============= Domain Configuration =============

const DOMAIN = 'shopee.vn';

// ============= URL Helpers =============

export function getActiveDomainUrl(): string {
  return DOMAIN;
}

export function getOrderUrl(orderId: string): string {
  return `https://${DOMAIN}/user/purchase/order/${orderId}`;
}

export function getLoginUrl(): string {
  return `https://${DOMAIN}/buyer/login`;
}

export function getHomeUrl(): string {
  return `https://${DOMAIN}`;
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
  BUDGET: getStorageKey('budget'),
} as const;

/** localStorage (shared by extension pages, read synchronously): the token of the scan the popup asked for. */
export const SCAN_REQUEST = getStorageKey('scan-request');

// ============= Message Configuration =============

export const MESSAGE_SOURCE = 'shopee-stats';
