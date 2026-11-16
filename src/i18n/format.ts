// Locale-aware number, currency, and date formatting — Vietnamese only

const LOCALE = 'vi-VN';
const CURRENCY = 'VND';

export function formatCurrency(amount: number, short = false): string {
  if (short) {
    // "17,2 tr", "682k": the way amounts are said in Vietnamese, with the same decimal comma as the full form.
    const compact = (n: number) => n.toLocaleString(LOCALE, { maximumFractionDigits: 1 });
    if (amount >= 999_950_000) return `${compact(amount / 1_000_000_000)} tỷ`;
    if (amount >= 999_500) return `${compact(amount / 1_000_000)} tr`;
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
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
