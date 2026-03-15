// Core i18n module — simplified to Vietnamese only
import viLocale from './locales/vi.json';

let currentLocale: Record<string, string> = viLocale;

/** Translate a key with optional {param} interpolation. Returns the key if not found. */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = currentLocale[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/** Apply translations to all [data-i18n], [data-i18n-placeholder], [data-i18n-title] elements */
export function applyTranslations(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n!);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach(el => {
    (el as HTMLInputElement).placeholder = t(el.dataset.i18nPlaceholder!);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle!);
  });
}

/** Initialize locale — set Vietnamese as default */
export function initLocale(): void {
  currentLocale = viLocale;
  document.documentElement.lang = 'vi';
  applyTranslations();
}
