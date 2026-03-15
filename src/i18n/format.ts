// Locale-aware number, currency, and date formatting — Vietnamese only

const LOCALE = 'vi-VN';
const CURRENCY = 'VND';

export function formatCurrency(amount: number, short = false): string {
  if (short) {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return String(amount);
  }
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(amount);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(LOCALE);
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString(LOCALE);
}
