// Locale-aware number, currency, and date formatting
import { getLocale } from './index.js';

// Shopee VN always uses VND — locale only affects number formatting style
const LOCALE_MAP: Record<string, { locale: string; currency: string }> = {
  vi: { locale: 'vi-VN', currency: 'VND' },
  en: { locale: 'en-US', currency: 'VND' },
};

function getLocaleConfig() {
  return LOCALE_MAP[getLocale()] ?? LOCALE_MAP.vi;
}

export function formatCurrency(amount: number, short = false): string {
  if (short) {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return String(amount);
  }
  const { locale, currency } = getLocaleConfig();
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatDate(date: Date): string {
  const { locale } = getLocaleConfig();
  return date.toLocaleDateString(locale);
}

export function formatDateTime(date: Date): string {
  const { locale } = getLocaleConfig();
  return date.toLocaleString(locale);
}
