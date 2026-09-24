import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initTheme,
  setTheme,
  setMode,
  getMode,
  getResolvedMode,
  getCurrentTheme,
  getCurrentThemeId,
  getThemes,
  updateThemeButton,
  updateAppearanceUI,
  toggleAppearancePopover,
  closeAppearancePopover,
  type ColorMode
} from '../src/dashboard/theme-toggle';

const THEME_KEY = 'shopeestatx-theme';
const MODE_KEY = 'shopeestatx-mode';

describe('Theme Toggle', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.dataset.theme = '';
    document.documentElement.dataset.mode = '';
    document.body.innerHTML = `
      <button id="btnTheme"><span class="theme-color-dot"></span><span class="theme-name"></span></button>
      <button id="btnAppearance">
        <span class="theme-dot"></span>
        <span id="appearanceLabel"></span>
      </button>
      <div id="appearancePopover" class="hidden">
        <div class="mode-segments">
          <button class="mode-btn" id="btnModeLight" data-mode="light">☀️ Sáng</button>
          <button class="mode-btn" id="btnModeDark" data-mode="dark">🌙 Tối</button>
        </div>
        <div class="color-swatches">
          <button class="swatch" data-theme="orange"></button>
          <button class="swatch" data-theme="forest"></button>
          <button class="swatch" data-theme="rose"></button>
          <button class="swatch" data-theme="sky"></button>
          <button class="swatch" data-theme="lavender"></button>
        </div>
      </div>
    `;
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = '';
    document.documentElement.dataset.mode = '';
  });

  describe('initTheme', () => {
    it('applies stored theme from localStorage', () => {
      localStorage.setItem(THEME_KEY, 'forest');
      initTheme();
      expect(document.documentElement.dataset.theme).toBe('forest');
    });

    it('applies orange theme when no stored theme and no system preference', () => {
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
      expect(document.documentElement.dataset.theme).toBe('orange');
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
      expect(document.documentElement.dataset.theme).toBe('orange');
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

    it('falls back to orange for unknown theme', () => {
      setTheme('unknown-theme' as any);
      expect(document.documentElement.dataset.theme).toBe('orange');
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

    it('defaults to orange theme for unknown', () => {
      document.documentElement.dataset.theme = '';
      const theme = getCurrentTheme();
      expect(theme.id).toBe('orange');
    });
  });

  describe('getThemes', () => {
    it('returns all available themes', () => {
      const themes = getThemes();
      expect(themes.length).toBe(5);
      expect(themes.map(t => t.id)).toContain('orange');
      expect(themes.map(t => t.id)).toContain('forest');
      expect(themes.map(t => t.id)).toContain('rose');
      expect(themes.map(t => t.id)).toContain('sky');
      expect(themes.map(t => t.id)).toContain('lavender');
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
      expect(name.textContent).toBe('Rừng');
    });

    it('handles missing button gracefully', () => {
      document.body.innerHTML = '';
      expect(() => updateThemeButton()).not.toThrow();
    });
  });

  describe('Dual-Axis Theme System Independence', () => {
    it('changes mode without overriding active theme', () => {
      setTheme('forest');
      expect(document.documentElement.dataset.theme).toBe('forest');

      setMode('dark');
      expect(document.documentElement.dataset.mode).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('forest');

      setMode('light');
      expect(document.documentElement.dataset.mode).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('forest');
    });

    it('changes theme without overriding active mode', () => {
      setMode('dark');
      expect(document.documentElement.dataset.mode).toBe('dark');

      setTheme('rose');
      expect(document.documentElement.dataset.theme).toBe('rose');
      expect(document.documentElement.dataset.mode).toBe('dark');

      setTheme('sky');
      expect(document.documentElement.dataset.theme).toBe('sky');
      expect(document.documentElement.dataset.mode).toBe('dark');
    });

    it('persists mode and theme independently to localStorage', () => {
      setTheme('lavender');
      setMode('dark');

      expect(localStorage.getItem(THEME_KEY)).toBe('lavender');
      expect(localStorage.getItem(MODE_KEY)).toBe('dark');
    });
  });

  describe('setMode', () => {
    it('sets mode to dark and updates dataset.mode', () => {
      setMode('dark');
      expect(document.documentElement.dataset.mode).toBe('dark');
      expect(localStorage.getItem(MODE_KEY)).toBe('dark');
    });

    it('sets mode to light and updates dataset.mode', () => {
      setMode('light');
      expect(document.documentElement.dataset.mode).toBe('light');
      expect(localStorage.getItem(MODE_KEY)).toBe('light');
    });

    it('resolves system mode using prefers-color-scheme media query', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList);

      setMode('system');
      expect(document.documentElement.dataset.mode).toBe('dark');
      expect(localStorage.getItem(MODE_KEY)).toBe('system');
      expect(getMode()).toBe('system');
      expect(getResolvedMode()).toBe('dark');
    });

    it('calls onToggle callback if provided', () => {
      const onToggle = vi.fn();
      setMode('dark', onToggle);
      expect(onToggle).toHaveBeenCalledOnce();
    });
  });

  describe('updateAppearanceUI', () => {
    it('updates appearance label, dot, mode buttons, and swatches', () => {
      document.documentElement.dataset.theme = 'forest';
      document.documentElement.dataset.mode = 'dark';
      localStorage.setItem(MODE_KEY, 'dark');

      updateAppearanceUI();

      const label = document.getElementById('appearanceLabel');
      expect(label?.textContent).toBe('Tối • Rừng');

      const dot = document.querySelector('.theme-dot') as HTMLElement;
      expect(dot?.style.backgroundColor).toBe('rgb(34, 197, 94)');

      const btnDark = document.getElementById('btnModeDark');
      const btnLight = document.getElementById('btnModeLight');
      expect(btnDark?.classList.contains('active')).toBe(true);
      expect(btnLight?.classList.contains('active')).toBe(false);

      const activeSwatch = document.querySelector('.swatch[data-theme="forest"]');
      expect(activeSwatch?.classList.contains('active')).toBe(true);
    });

    it('handles missing elements gracefully', () => {
      document.body.innerHTML = '';
      expect(() => updateAppearanceUI()).not.toThrow();
    });
  });

  describe('Appearance Popover Toggle', () => {
    it('toggles appearance popover visibility', () => {
      const popover = document.getElementById('appearancePopover')!;
      expect(popover.classList.contains('hidden')).toBe(true);

      toggleAppearancePopover();
      expect(popover.classList.contains('hidden')).toBe(false);

      toggleAppearancePopover();
      expect(popover.classList.contains('hidden')).toBe(true);
    });

    it('closes appearance popover', () => {
      const popover = document.getElementById('appearancePopover')!;
      popover.classList.remove('hidden');

      closeAppearancePopover();
      expect(popover.classList.contains('hidden')).toBe(true);
    });
  });
});
