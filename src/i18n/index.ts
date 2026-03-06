// Core i18n module — t(), setLocale(), getLocale(), applyTranslations(), initLocale()
import viLocale from './locales/vi.json';
import enLocale from './locales/en.json';

const LOCALES: Record<string, Record<string, string>> = {
  vi: viLocale,
  en: enLocale,
};

let currentLocale: Record<string, string> = viLocale;
let currentLang = 'vi';

export function getLocale(): string {
  return currentLang;
}

/** Switch language, persist to localStorage, re-apply static translations */
export function setLocale(lang: string): void {
  const resolved = LOCALES[lang] ? lang : 'vi';
  currentLocale = LOCALES[resolved];
  currentLang = resolved;
  document.documentElement.lang = resolved;
  localStorage.setItem('shopeestatx-lang', resolved);
  applyTranslations();
}

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

/** Initialize locale from localStorage or browser language preference */
export function initLocale(): void {
  const stored = localStorage.getItem('shopeestatx-lang');
  const browserLang = navigator.language.startsWith('vi') ? 'vi' : 'en';
  setLocale(stored ?? browserLang);
}
