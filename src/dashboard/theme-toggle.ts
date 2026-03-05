// Theme toggle — dark/light mode with system preference detection and persistence

const THEME_KEY = 'shopeestatx-theme';

/** Apply stored or system theme before first paint — call as early as possible */
export function initTheme(): void {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) {
    document.documentElement.dataset.theme = stored;
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.dataset.theme = 'dark';
  }
}

/** Toggle between dark and light, persist to localStorage */
export function toggleTheme(onToggle?: () => void): void {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);

  // Update button icon
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';

  onToggle?.();
}

/** Get current theme */
export function isDarkMode(): boolean {
  return document.documentElement.dataset.theme === 'dark';
}

/** Sync theme button icon with current theme */
export function syncThemeButton(): void {
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = isDarkMode() ? '☀️' : '🌙';
}
