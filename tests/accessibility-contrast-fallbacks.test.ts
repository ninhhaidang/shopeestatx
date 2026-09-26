import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_AVATAR_SVG, setupAvatarFallback } from '../src/dashboard/utils.js';
const resultsHtmlPath = path.resolve(__dirname, '../src/dashboard/results.html');

describe('Ticket #22: Form Accessibility, Color Contrast & Image Fallbacks', () => {
  describe('Seam 1: Accessible Form Controls & Screen Reader Names', () => {
    it('provides accessible aria-label attributes on standalone <select> dropdown controls in results.html', () => {
      const html = fs.readFileSync(resultsHtmlPath, 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const requiredSelects = [
        { id: 'shopCount', minDesc: 'shop' },
        { id: 'shopMetric', minDesc: 'chỉ số' },
        { id: 'filterYear', minDesc: 'năm' },
        { id: 'filterMonth', minDesc: 'tháng' },
        { id: 'pageSize', minDesc: 'trang' },
      ];

      for (const { id, minDesc } of requiredSelects) {
        const select = doc.getElementById(id) as HTMLSelectElement | null;
        expect(select, `Select element with id #${id} must exist in results.html`).not.toBeNull();
        expect(select?.tagName.toLowerCase()).toBe('select');

        const ariaLabel = select?.getAttribute('aria-label');
        expect(
          ariaLabel,
          `Select #${id} must have a non-empty aria-label attribute for WCAG Level A compliance`
        ).toBeTruthy();
        expect(ariaLabel?.trim().length).toBeGreaterThan(0);
        expect(
          ariaLabel?.toLowerCase(),
          `Select #${id} aria-label "${ariaLabel}" should describe its purpose containing "${minDesc}"`
        ).toContain(minDesc);
        // Ensure the control is not excluded from screen readers by aria-hidden="true" on itself or an ancestor
        expect(select?.closest('[aria-hidden="true"]'), `Select #${id} must not be inside aria-hidden="true"`).toBeNull();
        expect(select?.style.display, `Select #${id} must not use display:none (use .visually-hidden instead)`).not.toBe('none');
      }
    });
  });
  describe('Seam 2: Color Contrast of Interactive Date Links & Status Text on Light Surfaces', () => {
    const variablesCssPath = path.resolve(__dirname, '../src/styles/variables.css');
    const themesCssPath = path.resolve(__dirname, '../src/styles/themes.css');
    const tableCssPath = path.resolve(__dirname, '../src/styles/table.css');

    function parseHex(hex: string): [number, number, number] {
      const clean = hex.replace('#', '').trim();
      if (clean.length === 3) {
        return [
          parseInt(clean[0] + clean[0], 16),
          parseInt(clean[1] + clean[1], 16),
          parseInt(clean[2] + clean[2], 16),
        ];
      }
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
      ];
    }

    function getLuminance(r: number, g: number, b: number): number {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        const val = c / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function getContrastRatio(hex1: string, hex2: string): number {
      const lum1 = getLuminance(...parseHex(hex1));
      const lum2 = getLuminance(...parseHex(hex2));
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    it('declares --link-primary with >= 4.5:1 contrast ratio against white in variables.css and across all themes in themes.css', () => {
      const variablesCss = fs.readFileSync(variablesCssPath, 'utf-8');
      const themesCss = fs.readFileSync(themesCssPath, 'utf-8');

      // Check variables.css default / fallback --link-primary
      const defaultLinkMatch = variablesCss.match(/--link-primary:\s*(#[0-9a-fA-F]{3,6});/);
      expect(defaultLinkMatch, 'variables.css must define a fallback --link-primary hex color').not.toBeNull();
      const defaultLinkHex = defaultLinkMatch![1];
      const defaultRatio = getContrastRatio(defaultLinkHex, '#ffffff');
      expect(
        defaultRatio,
        `Fallback --link-primary (${defaultLinkHex}) must meet WCAG AA contrast (>= 4.5:1) against white, got ${defaultRatio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5);

      // Check all 5 themes in themes.css: orange, forest, rose, sky, lavender
      const themeNames = ['orange', 'forest', 'rose', 'sky', 'lavender'];
      for (const theme of themeNames) {
        const themeBlockRegex = new RegExp(`:root\\[data-theme=["']${theme}["']\\]\\s*\\{([^}]+)\\}`, 'm');
        const themeMatch = themesCss.match(themeBlockRegex);
        expect(themeMatch, `Theme block for ${theme} must exist in themes.css`).not.toBeNull();

        const linkMatch = themeMatch![1].match(/--link-primary:\s*(#[0-9a-fA-F]{3,6});/);
        expect(linkMatch, `Theme ${theme} must define --link-primary with high-contrast color token`).not.toBeNull();

        const hex = linkMatch![1];
        const ratio = getContrastRatio(hex, '#ffffff');
        expect(
          ratio,
          `Theme ${theme} --link-primary (${hex}) must meet WCAG AA contrast (>= 4.5:1) against white, got ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('styles interactive delivery date links (.detail-value-clickable) with --link-primary in table.css', () => {
      const tableCss = fs.readFileSync(tableCssPath, 'utf-8');
      const clickableMatch = tableCss.match(/\.detail-value-clickable\s*\{([^}]+)\}/);
      expect(clickableMatch).not.toBeNull();
      const styles = clickableMatch![1];

      expect(
        styles,
        '.detail-value-clickable must utilize var(--link-primary) for WCAG AA compliance on light surfaces'
      ).toMatch(/color:\s*var\(--link-primary/);

      const hoverMatch = tableCss.match(/\.detail-value-clickable:hover\s*\{([^}]+)\}/);
      expect(hoverMatch).not.toBeNull();
      expect(
        hoverMatch![1],
        '.detail-value-clickable:hover must utilize var(--link-primary-hover) for >= 4.5:1 contrast on hover'
      ).toMatch(/color:\s*var\(--link-primary-hover/);
    });

    it('declares light mode semantic status text colors with >= 4.5:1 contrast against white backgrounds in variables.css', () => {
      const variablesCss = fs.readFileSync(variablesCssPath, 'utf-8');

      // Extract light-mode root status colors
      const rootMatch = variablesCss.match(/:root\s*\{([^}]+)\}/);
      expect(rootMatch).not.toBeNull();
      const rootBlock = rootMatch![1];

      const statusTokens = [
        { token: '--status-completed', label: 'Completed' },
        { token: '--status-shipping', label: 'Shipping' },
        { token: '--status-pending', label: 'Pending' },
        { token: '--status-cancelled', label: 'Cancelled' },
        { token: '--status-returned', label: 'Returned' },
      ];

      for (const { token, label } of statusTokens) {
        const tokenRegex = new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,6});`);
        const match = rootBlock.match(tokenRegex);
        expect(match, `Token ${token} must be defined in :root in variables.css`).not.toBeNull();

        const hex = match![1];
        const ratio = getContrastRatio(hex, '#ffffff');
        expect(
          ratio,
          `${label} status token ${token} (${hex}) must meet WCAG AA contrast (>= 4.5:1) against white, got ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('maintains >= 4.5:1 contrast for dark mode status tokens and link colors in variables.css against dark surface #111827', () => {
      const variablesCss = fs.readFileSync(variablesCssPath, 'utf-8');
      const darkModeMatch = variablesCss.match(/:root\[data-mode=["']dark["']\]\s*\{([^}]+)\}/);
      expect(darkModeMatch).not.toBeNull();
      const darkBlock = darkModeMatch![1];

      // Check dark mode link primary is present (or aliased to var(--primary))
      expect(darkBlock).toMatch(/--link-primary:\s*var\(--primary\)/);

      // Check status color aliases in dark mode against --bg-surface (#111827)
      const darkStatusTokens = [
        { token: '--success', label: 'Success' },
        { token: '--info', label: 'Info' },
        { token: '--warning', label: 'Warning' },
        { token: '--danger', label: 'Danger' },
        { token: '--pending', label: 'Pending' },
        { token: '--returned', label: 'Returned' },
      ];

      for (const { token, label } of darkStatusTokens) {
        const tokenRegex = new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,6});`);
        const match = darkBlock.match(tokenRegex);
        expect(match, `Dark mode token ${token} must be defined in variables.css`).not.toBeNull();

        const hex = match![1];
        const ratio = getContrastRatio(hex, '#111827');
        expect(
          ratio,
          `Dark mode ${label} token ${token} (${hex}) must meet contrast (>= 4.5:1) against #111827, got ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe('Seam 3: Graceful Avatar Fallback & Image Error Handling', () => {
    it('provides a clean, well-formed SVG fallback avatar data URI in DEFAULT_AVATAR_SVG', () => {
      expect(DEFAULT_AVATAR_SVG).toBeDefined();
      expect(DEFAULT_AVATAR_SVG.startsWith('data:image/svg+xml')).toBe(true);
      expect(DEFAULT_AVATAR_SVG).toContain('<svg');
      expect(DEFAULT_AVATAR_SVG).toContain('</svg>');
      expect(DEFAULT_AVATAR_SVG).toMatch(/(viewBox|width|height)/);
    });

    it('sets img.src immediately to DEFAULT_AVATAR_SVG when avatar URL is missing or empty', () => {
      const dom = new JSDOM('<!DOCTYPE html><html><body><img id="avatar" /></body></html>');
      const img = dom.window.document.getElementById('avatar') as HTMLImageElement;

      setupAvatarFallback(img, '');
      expect(img.src).toBe(DEFAULT_AVATAR_SVG);

      setupAvatarFallback(img, null);
      expect(img.src).toBe(DEFAULT_AVATAR_SVG);

      setupAvatarFallback(img, undefined);
      expect(img.src).toBe(DEFAULT_AVATAR_SVG);
    });

    it('sets img.src to provided URL and falls back to DEFAULT_AVATAR_SVG on error without crash loops', () => {
      const dom = new JSDOM('<!DOCTYPE html><html><body><img id="avatar" /></body></html>');
      const img = dom.window.document.getElementById('avatar') as HTMLImageElement;

      const brokenUrl = 'https://cf.shopee.vn/file/invalid-or-demo-avatar';
      setupAvatarFallback(img, brokenUrl);
      expect(img.src).toBe(brokenUrl);
      expect(typeof img.onerror).toBe('function');

      // Simulate image loading failure (network error, 404, etc.)
      img.onerror!(new dom.window.Event('error'));

      // Must now display fallback SVG
      expect(img.src).toBe(DEFAULT_AVATAR_SVG);

      // Must have unhooked onerror to prevent crash / network retry loops
      expect(img.onerror).toBeNull();
    });

    it('results.html initializes userAvatar and popoverUserAvatar with DEFAULT_AVATAR_SVG to prevent broken glyphs', () => {
      const html = fs.readFileSync(resultsHtmlPath, 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const userAvatar = doc.getElementById('userAvatar') as HTMLImageElement | null;
      const popoverAvatar = doc.getElementById('popoverUserAvatar') as HTMLImageElement | null;

      expect(userAvatar).not.toBeNull();
      expect(popoverAvatar).not.toBeNull();

      // Neither image should have empty src="" which causes native browser broken glyphs
      expect(userAvatar?.getAttribute('src')).toBeTruthy();
      expect(userAvatar?.getAttribute('src')).toContain('data:image/svg+xml');
      expect(popoverAvatar?.getAttribute('src')).toBeTruthy();
      expect(popoverAvatar?.getAttribute('src')).toContain('data:image/svg+xml');
    });
  });

  describe('Seam 4: Static Accessibility Audit (Zero Unlabeled Form Inputs)', () => {
    function checkAccessibleName(el: Element, doc: Document): { hasName: boolean; reason: string } {
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim().length > 0) {
        return { hasName: true, reason: `aria-label="${ariaLabel}"` };
      }

      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      if (ariaLabelledBy) {
        const labelledByEl = doc.getElementById(ariaLabelledBy);
        if (labelledByEl && labelledByEl.textContent?.trim()) {
          return { hasName: true, reason: `aria-labelledby="#${ariaLabelledBy}" ("${labelledByEl.textContent.trim()}")` };
        }
      }

      const id = el.getAttribute('id');
      if (id) {
        const labelFor = doc.querySelector(`label[for="${id}"]`);
        if (labelFor && labelFor.textContent?.trim()) {
          return { hasName: true, reason: `label[for="${id}"] ("${labelFor.textContent.trim()}")` };
        }
      }

      const parentLabel = el.closest('label');
      if (parentLabel && parentLabel.textContent?.trim()) {
        return { hasName: true, reason: `wrapping label ("${parentLabel.textContent.trim()}")` };
      }

      const title = el.getAttribute('title');
      if (title && title.trim().length > 0) {
        return { hasName: true, reason: `title="${title}"` };
      }

      return { hasName: false, reason: 'No accessible name found' };
    }

    it('results.html static accessibility audit passes with zero unlabeled input, select, and textarea elements', () => {
      const html = fs.readFileSync(resultsHtmlPath, 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const formControls = Array.from(doc.querySelectorAll('input, select, textarea'));
      expect(formControls.length).toBeGreaterThan(0);

      const unlabeled: Array<{ tag: string; id: string | null; type: string | null }> = [];

      for (const el of formControls) {
        const { hasName, reason } = checkAccessibleName(el, doc);
        if (!hasName) {
          unlabeled.push({
            tag: el.tagName.toLowerCase(),
            id: el.getAttribute('id'),
            type: el.getAttribute('type'),
          });
        }
      }

      expect(
        unlabeled,
        `Expected zero unlabeled form controls, but found: ${JSON.stringify(unlabeled)}`
      ).toEqual([]);
    });

    it('date-range-picker custom date inputs provide explicit accessible labels', () => {
      const datePickerTsPath = path.resolve(__dirname, '../src/dashboard/date-range-picker.ts');
      const content = fs.readFileSync(datePickerTsPath, 'utf-8');

      // Check #drpStartDate and #drpEndDate have aria-label or accessible markup
      expect(content).toMatch(/id="drpStartDate"[^>]*aria-label=/);
      expect(content).toMatch(/id="drpEndDate"[^>]*aria-label=/);
    });
  });
});
