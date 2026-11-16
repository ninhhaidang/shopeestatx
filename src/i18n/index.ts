// Core i18n module — simplified to Vietnamese only
import viLocale from './locales/vi.json';

let currentLocale: Record<string, string> = viLocale;

/** Translate a key with optional {param} interpolation. Returns the key if not found. */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = currentLocale[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, () => String(v)); // a function: `$&` in a value stays literal
    }
  }
  return text;
}

/** Initialize locale — set Vietnamese as default */
export function initLocale(): void {
  currentLocale = viLocale;
  document.documentElement.lang = 'vi';
}
