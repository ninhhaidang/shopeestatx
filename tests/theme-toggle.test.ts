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
      localStorage.setItem(THEME_KEY, 'forest');
      initTheme();
      expect(document.documentElement.dataset.theme).toBe('forest');
    });

    it('applies light theme when no stored theme and no system preference', () => {
      // Mock matchMedia for no preference
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: light)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      initTheme();
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('does not apply theme when no stored theme and system prefers light', () => {
      // Mock matchMedia for light preference
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: light)',
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
      localStorage.setItem(THEME_KEY, 'rose');
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: light)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      initTheme();
      expect(document.documentElement.dataset.theme).toBe('rose');
    });
  });

  describe('setTheme', () => {
    it('sets theme by ID', () => {
      setTheme('sky');
      expect(document.documentElement.dataset.theme).toBe('sky');
    });

    it('persists theme to localStorage', () => {
      setTheme('lavender');
      expect(localStorage.getItem(THEME_KEY)).toBe('lavender');
    });

    it('falls back to light for unknown theme', () => {
      setTheme('unknown-theme' as any);
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('calls onToggle callback if provided', () => {
      const onToggle = vi.fn();
      setTheme('forest', onToggle);
      expect(onToggle).toHaveBeenCalledOnce();
    });
  });

  describe('getCurrentTheme', () => {
    it('returns current theme object', () => {
      document.documentElement.dataset.theme = 'sky';
      const theme = getCurrentTheme();
      expect(theme.id).toBe('sky');
      expect(theme.primaryColor).toBe('#0ea5e9');
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
      expect(themes.map(t => t.id)).toContain('forest');
      expect(themes.map(t => t.id)).toContain('rose');
      expect(themes.map(t => t.id)).toContain('sky');
      expect(themes.map(t => t.id)).toContain('lavender');
    });
  });

  describe('isDarkMode', () => {
    it('returns false for all light themes', () => {
      expect(isDarkMode()).toBe(false);
    });
  });

  describe('updateThemeButton', () => {
    it('updates button with current theme color and name', () => {
      document.documentElement.dataset.theme = 'forest';
      const btn = document.getElementById('btnTheme') as HTMLElement;

      updateThemeButton();

      const dot = btn.querySelector('.theme-color-dot') as HTMLElement;
      const name = btn.querySelector('.theme-name') as HTMLElement;

      expect(dot.style.backgroundColor).toBe('rgb(34, 197, 94)');
      expect(name.textContent).toBe('Forest');
    });

    it('handles missing button gracefully', () => {
      document.body.innerHTML = '';
      expect(() => updateThemeButton()).not.toThrow();
    });
  });
});
