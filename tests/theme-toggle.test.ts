import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initTheme, setTheme, getCurrentTheme, getCurrentThemeId, getThemes, isDarkMode, updateThemeButton } from '../src/dashboard/theme-toggle';

const THEME_KEY = 'shopeestatx-theme';

describe('Theme Toggle', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.dataset.theme = '';
    document.body.innerHTML = '<button id="btnTheme"><span class="theme-color-dot"></span><span class="theme-name"></span></button>';
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = '';
  });

  describe('initTheme', () => {
    it('applies stored theme from localStorage', () => {
      localStorage.setItem(THEME_KEY, 'dark-obsidian');
      initTheme();
      expect(document.documentElement.dataset.theme).toBe('dark-obsidian');
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
      expect(document.documentElement.dataset.theme).toBe('dark-obsidian');
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
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('prioritizes stored theme over system preference', () => {
      localStorage.setItem(THEME_KEY, 'midnight-frost');
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
      expect(document.documentElement.dataset.theme).toBe('midnight-frost');
    });
  });

  describe('setTheme', () => {
    it('sets theme by ID', () => {
      setTheme('dark-obsidian');
      expect(document.documentElement.dataset.theme).toBe('dark-obsidian');
    });

    it('persists theme to localStorage', () => {
      setTheme('royal-purple');
      expect(localStorage.getItem(THEME_KEY)).toBe('royal-purple');
    });

    it('falls back to light for unknown theme', () => {
      setTheme('unknown-theme' as any);
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('calls onToggle callback if provided', () => {
      const onToggle = vi.fn();
      setTheme('slate', onToggle);
      expect(onToggle).toHaveBeenCalledOnce();
    });
  });

  describe('getCurrentTheme', () => {
    it('returns current theme object', () => {
      document.documentElement.dataset.theme = 'midnight-frost';
      const theme = getCurrentTheme();
      expect(theme.id).toBe('midnight-frost');
      expect(theme.primaryColor).toBe('#06b6d4');
    });

    it('defaults to light theme for unknown', () => {
      document.documentElement.dataset.theme = '';
      const theme = getCurrentTheme();
      expect(theme.id).toBe('light');
    });
  });

  describe('getThemes', () => {
    it('returns all available themes', () => {
      const themes = getThemes();
      expect(themes.length).toBe(5);
      expect(themes.map(t => t.id)).toContain('light');
      expect(themes.map(t => t.id)).toContain('dark-obsidian');
      expect(themes.map(t => t.id)).toContain('midnight-frost');
      expect(themes.map(t => t.id)).toContain('royal-purple');
      expect(themes.map(t => t.id)).toContain('slate');
    });
  });

  describe('isDarkMode', () => {
    it('returns true for dark themes', () => {
      document.documentElement.dataset.theme = 'dark-obsidian';
      expect(isDarkMode()).toBe(true);

      document.documentElement.dataset.theme = 'midnight-frost';
      expect(isDarkMode()).toBe(true);

      document.documentElement.dataset.theme = 'royal-purple';
      expect(isDarkMode()).toBe(true);
    });

    it('returns false for light theme', () => {
      document.documentElement.dataset.theme = 'light';
      expect(isDarkMode()).toBe(false);
    });
  });

  describe('updateThemeButton', () => {
    it('updates button with current theme color and name', () => {
      document.documentElement.dataset.theme = 'dark-obsidian';
      const btn = document.getElementById('btnTheme') as HTMLElement;

      updateThemeButton();

      const dot = btn.querySelector('.theme-color-dot') as HTMLElement;
      const name = btn.querySelector('.theme-name') as HTMLElement;

      expect(dot.style.backgroundColor).toBe('rgb(245, 158, 11)'); // #f59e0b
      expect(name.textContent).toBe('Dark (Obsidian)');
    });

    it('handles missing button gracefully', () => {
      document.body.innerHTML = '';
      expect(() => updateThemeButton()).not.toThrow();
    });
  });
});
