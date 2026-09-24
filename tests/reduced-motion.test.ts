import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Reduced-Motion Compliance Across CSS Modules (Issue #14)', () => {
  const stylesDir = path.resolve(__dirname, '../src/styles');

  function readStyleFile(fileName: string): string {
    return fs.readFileSync(path.join(stylesDir, fileName), 'utf-8');
  }

  describe('Seam 3: Reduced-Motion CSS Rules Audit', () => {
    it('states.css defines global reduced-motion reset disabling animation and transition duration', () => {
      const css = readStyleFile('states.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/animation-duration:\s*0(\.0+1)?ms\s*!important/);
      expect(css).toMatch(/transition-duration:\s*0(\.0+1)?ms\s*!important/);
      expect(css).toMatch(/scroll-behavior:\s*auto\s*!important/);
    });

    it('table.css explicitly disables drawer slides and floating bulk action bar transitions under reduced-motion', () => {
      const css = readStyleFile('table.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);

      // Drawer panel slide disabled
      expect(css).toMatch(/\.drawer-panel\s*\{[^}]*transition:\s*none\s*!important/);
      // Drawer backdrop fade disabled
      expect(css).toMatch(/\.drawer-backdrop\s*\{[^}]*transition:\s*none\s*!important/);
      // Floating bulk action bar motion disabled
      expect(css).toMatch(/\.floating-bulk-bar\s*\{[^}]*transition:\s*none\s*!important/);
    });

    it('layout.css disables tab panel fades, more filters panel slide, and user icon rotation', () => {
      const css = readStyleFile('layout.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/\.tab-panel\s*\{[^}]*animation:\s*none\s*!important/);
      expect(css).toMatch(/\.tab-item\s*\{[^}]*transition:\s*none\s*!important/);
      expect(css).toMatch(/\.more-filters-panel\s*\{[^}]*animation:\s*none\s*!important/);
    });

    it('cards.css disables budget ring animation, tooltips fade, and card hover transitions', () => {
      const css = readStyleFile('cards.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/\.budget-ring-fill\s*\{[^}]*transition:\s*none\s*!important/);
    });

    it('filters.css disables filter chips and active filters animations', () => {
      const css = readStyleFile('filters.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/\.active-filters\s*\{[^}]*animation:\s*none\s*!important/);
      expect(css).toMatch(/\.filter-chip\s*\{[^}]*animation:\s*none\s*!important/);
    });

    it('date-picker.css disables date range picker popover animation', () => {
      const css = readStyleFile('date-picker.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/\.drp-popover\s*\{[^}]*animation:\s*none\s*!important/);
    });

    it('insights.css disables dialog modal reveals and insight animations', () => {
      const css = readStyleFile('insights.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/dialog/);
    });

    it('charts.css disables chart box hover and shop table transitions', () => {
      const css = readStyleFile('charts.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/\.chart-box/);
      expect(css).toMatch(/transition:\s*none\s*!important/);
    });

    it('themes.css disables toast notifications animations and popover transitions', () => {
      const css = readStyleFile('themes.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/\.toast/);
    });

    it('responsive.css prevents global smooth transitions from overriding reduced-motion', () => {
      const css = readStyleFile('responsive.css');
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toMatch(/transition:\s*none\s*!important/);
    });
  });
});
