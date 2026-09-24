// Theme toggle — decoupled dual-axis theme system (Mode x Hue)

import { themes, getTheme, getDefaultTheme, type Theme } from './theme-config.js';
import { STORAGE_KEYS } from '../config.js';
import type { ColorMode, ResolvedColorMode } from '../types/index.js';

export type { ColorMode, ResolvedColorMode, Theme };

const THEME_KEY = STORAGE_KEYS.THEME;
const MODE_KEY = STORAGE_KEYS.MODE;

const MODE_LABELS: Record<ResolvedColorMode, string> = {
  light: 'Sáng',
  dark: 'Tối',
};

let mediaQueryList: MediaQueryList | null = null;
let mediaListenerAttached = false;

function handleSystemModeChange(e: MediaQueryListEvent | MediaQueryList): void {
  const currentMode = getMode();
  if (currentMode === 'system') {
    const resolved: ResolvedColorMode = e.matches ? 'dark' : 'light';
    document.documentElement.dataset.mode = resolved;
    updateAppearanceUI();
  }
}

function setupSystemModeListener(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  if (!mediaQueryList) {
    try {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      mediaQueryList = null;
    }
  }
  if (!mediaListenerAttached && mediaQueryList) {
    mediaQueryList.addEventListener?.('change', handleSystemModeChange);
    mediaListenerAttached = true;
  }
}

function detectSystemDark(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      return Boolean(mq?.matches);
    } catch {
      return false;
    }
  }
  return false;
}

/** Get current stored color mode setting ('light' | 'dark' | 'system') */
export function getMode(): ColorMode {
  if (typeof localStorage === 'undefined') return 'system';
  const stored = localStorage.getItem(MODE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/** Get the currently resolved active mode applied to the document ('light' | 'dark') */
export function getResolvedMode(): ResolvedColorMode {
  const currentDatasetMode = document.documentElement?.dataset?.mode;
  if (currentDatasetMode === 'dark' || currentDatasetMode === 'light') {
    return currentDatasetMode;
  }
  const mode = getMode();
  if (mode === 'dark' || mode === 'light') {
    return mode;
  }
  return detectSystemDark() ? 'dark' : 'light';
}

/** Set color mode ('light' | 'dark' | 'system'), persist to localStorage, and update DOM */
export function setMode(mode: ColorMode, onToggle?: () => void): void {
  let resolved: ResolvedColorMode;
  if (mode === 'system') {
    setupSystemModeListener();
    resolved = detectSystemDark() ? 'dark' : 'light';
  } else {
    resolved = mode;
  }

  document.documentElement.dataset.mode = resolved;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MODE_KEY, mode);
  }

  updateAppearanceUI();
  onToggle?.();
}

/** Set theme hue by ID, persist to localStorage */
export function setTheme(themeId: string, onToggle?: () => void): void {
  const theme = getTheme(themeId);
  if (!theme) {
    console.warn(`Theme "${themeId}" not found, using light`);
    document.documentElement.dataset.theme = 'orange';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, 'orange');
    }
    updateAppearanceUI();
    return;
  }

  document.documentElement.dataset.theme = themeId;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, themeId);
  }

  updateAppearanceUI();
  onToggle?.();
}

/** Apply stored or system theme & mode before first paint — call as early as possible */
export function initTheme(): void {
  // 1. Accent Hue (Theme)
  const theme = getDefaultTheme();
  document.documentElement.dataset.theme = theme.id;

  // 2. Color Mode (Dual-axis)
  const mode = getMode();
  let resolved: ResolvedColorMode = 'light';
  if (mode === 'system') {
    setupSystemModeListener();
    resolved = detectSystemDark() ? 'dark' : 'light';
  } else {
    resolved = mode;
  }
  document.documentElement.dataset.mode = resolved;

  updateAppearanceUI();
}

/** Get current theme */
export function getCurrentTheme(): Theme {
  const currentId = document.documentElement?.dataset?.theme || 'orange';
  return getTheme(currentId) || getTheme('orange')!;
}

/** Get current theme ID */
export function getCurrentThemeId(): string {
  return document.documentElement?.dataset?.theme || 'orange';
}

/** Update appearance popover UI and button elements */
export function updateAppearanceUI(): void {
  if (typeof document === 'undefined') return;

  const currentTheme = getCurrentTheme();
  const resolvedMode = getResolvedMode();
  const currentMode = getMode();

  // 1. Update Appearance Label (#appearanceLabel)
  const appearanceLabel = document.getElementById('appearanceLabel');
  if (appearanceLabel) {
    const modeName = MODE_LABELS[resolvedMode] || 'Sáng';
    const themeName = currentTheme.name || 'Cam';
    appearanceLabel.textContent = `${modeName} • ${themeName}`;
  }

  // 2. Update Theme Dot (.theme-dot)
  const themeDot = document.querySelector('.theme-dot') as HTMLElement | null;
  if (themeDot) {
    themeDot.style.backgroundColor = currentTheme.primaryColor;
  }

  // 3. Update Mode segment buttons (.mode-btn)
  const btnModeLight = document.getElementById('btnModeLight');
  const btnModeDark = document.getElementById('btnModeDark');
  if (btnModeLight) {
    const isLightActive = currentMode === 'light' || (currentMode === 'system' && resolvedMode === 'light');
    btnModeLight.classList.toggle('active', isLightActive);
    btnModeLight.setAttribute('aria-checked', String(isLightActive));
  }
  if (btnModeDark) {
    const isDarkActive = currentMode === 'dark' || (currentMode === 'system' && resolvedMode === 'dark');
    btnModeDark.classList.toggle('active', isDarkActive);
    btnModeDark.setAttribute('aria-checked', String(isDarkActive));
  }

  // 4. Update Swatches (.swatch[data-theme])
  const swatches = document.querySelectorAll('.swatch');
  swatches.forEach(swatch => {
    const el = swatch as HTMLElement;
    const swatchTheme = el.dataset.theme;
    const isActive = swatchTheme === currentTheme.id;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-checked', String(isActive));
  });

  // 5. Update legacy #btnTheme button for backward compatibility
  updateThemeButton();
}

/** Sync legacy theme button with current theme (kept for backwards compatibility) */
export function updateThemeButton(): void {
  if (typeof document === 'undefined') return;
  const btn = document.getElementById('btnTheme');
  if (!btn) return;

  const theme = getCurrentTheme();
  const dot = btn.querySelector('.theme-color-dot') as HTMLElement | null;
  const name = btn.querySelector('.theme-name');

  if (dot) {
    dot.style.backgroundColor = theme.primaryColor;
  }
  if (name) {
    name.textContent = theme.name;
  }
}

/** Get all themes */
export function getThemes(): Theme[] {
  return themes;
}

/** Toggle appearance popover */
export function toggleAppearancePopover(): void {
  if (typeof document === 'undefined') return;
  const popover = document.getElementById('appearancePopover');
  if (popover) {
    popover.classList.toggle('hidden');
    const isExpanded = !popover.classList.contains('hidden');
    const btn = document.getElementById('btnAppearance');
    btn?.setAttribute('aria-expanded', String(isExpanded));
  }
}

/** Close appearance popover */
export function closeAppearancePopover(): void {
  if (typeof document === 'undefined') return;
  const popover = document.getElementById('appearancePopover');
  if (popover) {
    popover.classList.add('hidden');
    const btn = document.getElementById('btnAppearance');
    btn?.setAttribute('aria-expanded', 'false');
  }
}

/** Toggle legacy theme dropdown (backward compatibility) */
export function toggleThemeDropdown(): void {
  if (typeof document === 'undefined') return;
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

/** Close legacy theme dropdown (backward compatibility) */
export function closeThemeDropdown(): void {
  if (typeof document === 'undefined') return;
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}
