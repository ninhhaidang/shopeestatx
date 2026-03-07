// Theme toggle — multi-theme support with system preference detection

import { themes, getTheme, getDefaultTheme, type Theme } from './theme-config.js';

const THEME_KEY = 'shopeestatx-theme';

/** Apply stored or system theme before first paint — call as early as possible */
export function initTheme(): void {
  const theme = getDefaultTheme();
  document.documentElement.dataset.theme = theme.id;
}

/** Set theme by ID, persist to localStorage */
export function setTheme(themeId: string, onToggle?: () => void): void {
  const theme = getTheme(themeId);
  if (!theme) {
    console.warn(`Theme "${themeId}" not found, using light`);
    document.documentElement.dataset.theme = 'light';
    localStorage.setItem(THEME_KEY, 'light');
    return;
  }

  document.documentElement.dataset.theme = themeId;
  localStorage.setItem(THEME_KEY, themeId);

  // Update button
  updateThemeButton();

  onToggle?.();
}

/** Get current theme */
export function getCurrentTheme(): Theme {
  const currentId = document.documentElement.dataset.theme || 'light';
  return getTheme(currentId) || getTheme('light')!;
}

/** Get current theme ID */
export function getCurrentThemeId(): string {
  return document.documentElement.dataset.theme || 'light';
}

/** Check if current theme is dark mode (legacy support) */
export function isDarkMode(): boolean {
  const theme = getCurrentTheme();
  return theme.isDark;
}

/** Sync theme button with current theme */
export function updateThemeButton(): void {
  const btn = document.getElementById('btnTheme');
  if (!btn) return;

  const theme = getCurrentTheme();
  const dot = btn.querySelector('.theme-color-dot') as HTMLElement;
  const name = btn.querySelector('.theme-name');

  if (dot) {
    dot.style.backgroundColor = theme.primaryColor;
  }
  if (name) {
    name.textContent = theme.nameEn;
  }
}

/** Get all themes for dropdown */
export function getThemes(): Theme[] {
  return themes;
}

/** Toggle theme dropdown */
export function toggleThemeDropdown(): void {
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    const isOpen = dropdown.classList.contains('open');
    if (isOpen) {
      dropdown.classList.remove('open');
    } else {
      dropdown.classList.add('open');
    }
  }
}

/** Close theme dropdown */
export function closeThemeDropdown(): void {
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}
