import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initTheme, toggleTheme, isDarkMode, syncThemeButton } from '../src/dashboard/theme-toggle';

const THEME_KEY = 'shopeestatx-theme';

describe('Theme Toggle', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.dataset.theme = '';
    document.body.innerHTML = '<button id="btnTheme"></button>';
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = '';
  });

  describe('initTheme', () => {
    it('applies stored theme from localStorage', () => {
      localStorage.setItem(THEME_KEY, 'dark');
      initTheme();
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('applies system dark preference when no stored theme', () => {
      // Mock matchMedia for dark preference
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      initTheme();
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('does not apply theme when no stored theme and system prefers light', () => {
      // Mock matchMedia for light preference
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      initTheme();
      expect(document.documentElement.dataset.theme).not.toBe('dark');
    });

    it('prioritizes stored theme over system preference', () => {
      localStorage.setItem(THEME_KEY, 'light');
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: true, // System prefers dark
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      initTheme();
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      document.documentElement.dataset.theme = 'light';
      toggleTheme();
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('toggles from dark to light', () => {
      document.documentElement.dataset.theme = 'dark';
      toggleTheme();
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('persists toggled theme to localStorage', () => {
      document.documentElement.dataset.theme = 'light';
      toggleTheme();
      expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('updates theme button icon to sun (☀️) when toggling to dark', () => {
      document.documentElement.dataset.theme = 'light';
      const btn = document.getElementById('btnTheme') as HTMLElement;
      btn.textContent = '🌙'; // Initial light mode icon

      toggleTheme();

      expect(btn.textContent).toBe('☀️');
    });

    it('updates theme button icon to moon (🌙) when toggling to light', () => {
      document.documentElement.dataset.theme = 'dark';
      const btn = document.getElementById('btnTheme') as HTMLElement;
      btn.textContent = '☀️'; // Initial dark mode icon

      toggleTheme();

      expect(btn.textContent).toBe('🌙');
    });

    it('ignores button update if button does not exist', () => {
      document.body.innerHTML = ''; // Remove button
      document.documentElement.dataset.theme = 'light';

      expect(() => toggleTheme()).not.toThrow();
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('calls onToggle callback if provided', () => {
      const onToggle = vi.fn();
      document.documentElement.dataset.theme = 'light';

      toggleTheme(onToggle);

      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('does not call onToggle callback if not provided', () => {
      document.documentElement.dataset.theme = 'light';

      expect(() => toggleTheme()).not.toThrow();
    });
  });

  describe('isDarkMode', () => {
    it('returns true when theme is dark', () => {
      document.documentElement.dataset.theme = 'dark';
      expect(isDarkMode()).toBe(true);
    });

    it('returns false when theme is light', () => {
      document.documentElement.dataset.theme = 'light';
      expect(isDarkMode()).toBe(false);
    });

    it('returns false when theme is not set', () => {
      document.documentElement.dataset.theme = '';
      expect(isDarkMode()).toBe(false);
    });
  });

  describe('syncThemeButton', () => {
    it('sets button icon to sun (☀️) when in dark mode', () => {
      document.documentElement.dataset.theme = 'dark';
      const btn = document.getElementById('btnTheme') as HTMLElement;

      syncThemeButton();

      expect(btn.textContent).toBe('☀️');
    });

    it('sets button icon to moon (🌙) when in light mode', () => {
      document.documentElement.dataset.theme = 'light';
      const btn = document.getElementById('btnTheme') as HTMLElement;

      syncThemeButton();

      expect(btn.textContent).toBe('🌙');
    });

    it('does nothing if button does not exist', () => {
      document.body.innerHTML = ''; // Remove button
      document.documentElement.dataset.theme = 'dark';

      expect(() => syncThemeButton()).not.toThrow();
    });

    it('updates button on second call', () => {
      const btn = document.getElementById('btnTheme') as HTMLElement;
      document.documentElement.dataset.theme = 'dark';

      syncThemeButton();
      expect(btn.textContent).toBe('☀️');

      document.documentElement.dataset.theme = 'light';
      syncThemeButton();
      expect(btn.textContent).toBe('🌙');
    });
  });
});
