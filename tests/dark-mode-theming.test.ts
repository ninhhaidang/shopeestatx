/**
 * ShopeeStatX/tests/dark-mode-theming.test.ts
 * Tests for dark mode theming & high-contrast typography across all dashboard surfaces (Ticket #16).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { setMode, getResolvedMode, getMode } from '../src/dashboard/theme-toggle.js';
import { ensureBulkBarInDOM, updateBulkBar, selectOrder, clearSelection } from '../src/dashboard/bulk-actions.js';
import { renderShopLoyalty } from '../src/dashboard/shop-loyalty.js';
import { state } from '../src/dashboard/state.js';

describe('Dark Mode Theming & High-Contrast Typography Across All Dashboard Surfaces (Ticket #16)', () => {
  const stylesDir = path.resolve(__dirname, '../src/styles');

  function readStyleFile(fileName: string): string {
    return fs.readFileSync(path.join(stylesDir, fileName), 'utf-8');
  }

  describe('Seam 1: OrderCategory & ShopLoyalty Card Dark Mode Surface (--bg-card) & Typography', () => {
    it('charts.css defines .chart-box using var(--bg-card) and eliminates hardcoded white backgrounds', () => {
      const css = readStyleFile('charts.css');
      // .chart-box must not use hardcoded white background
      expect(css).not.toMatch(/\.chart-box\s*\{[^}]*background:\s*white;/);
      expect(css).toMatch(/\.chart-box\s*\{[^}]*background:\s*var\(--bg-card\);/);
    });

    it('insights.css explicitly sets background: var(--bg-card) on category breakdown and shop loyalty cards', () => {
      const css = readStyleFile('insights.css');
      expect(css).toMatch(/\.category-breakdown-card,\s*\.shop-loyalty-card\s*\{[^}]*background:\s*var\(--bg-card\);/);
    });

    it('charts.css and insights.css style card headings with --text-primary and subtitles with --text-secondary', () => {
      const chartsCss = readStyleFile('charts.css');
      const insightsCss = readStyleFile('insights.css');
      expect(chartsCss).toMatch(/\.chart-box\s+h3\s*\{[^}]*color:\s*var\(--text-primary\);/);
      expect(insightsCss).toMatch(/\.chart-subtitle\s*\{[^}]*color:\s*var\(--text-secondary\);/);
    });
  });

  describe('Seam 2: ShopLoyalty Table Column Cells & Dark Mode Status Badges', () => {
    it('variables.css defines dark mode semantic status colors and aliases under :root[data-mode="dark"]', () => {
      const css = readStyleFile('variables.css');
      const darkModeBlockMatch = css.match(/:root\[data-mode="dark"\]\s*\{([^}]+)\}/);
      expect(darkModeBlockMatch).not.toBeNull();
      const darkModeBlock = darkModeBlockMatch![1];

      // Must define dark mode accessible versions of semantic status tokens
      expect(darkModeBlock).toMatch(/--success:\s*#[0-9a-fA-F]+/);
      expect(darkModeBlock).toMatch(/--success-bg:/);
      expect(darkModeBlock).toMatch(/--info:\s*#[0-9a-fA-F]+/);
      expect(darkModeBlock).toMatch(/--info-bg:/);
      expect(darkModeBlock).toMatch(/--warning:\s*#[0-9a-fA-F]+/);
      expect(darkModeBlock).toMatch(/--warning-bg:/);
    });

    it('insights.css styles loyalty table header, cells, and row hover using semantic theme variables', () => {
      const css = readStyleFile('insights.css');
      expect(css).toMatch(/\.loyalty-table\s+th\s*\{[^}]*color:\s*var\(--text-secondary\);/);
      expect(css).toMatch(/\.loyalty-table\s+td\s*\{[^}]*color:\s*var\(--text-primary\);/);
      expect(css).toMatch(/\.loyalty-row:hover\s*\{[^}]*background-color:\s*var\(--table-hover/);
    });

    it('ShopLoyalty table DOM renders all 6 column cells with proper semantic classes and accessible elements', () => {
      const container = document.createElement('div');
      container.id = 'loyaltyContainer';
      document.body.appendChild(container);

      const mockData = [
        {
          shopName: 'Shopee Official Store',
          orderCount: 10,
          totalSpent: 1500000,
          firstOrder: '2026-01-01',
          lastOrder: '2026-09-15',
          avgOrderValue: 150000,
          repeatRate: 2.5,
          tier: 'VIP' as const,
        },
      ];

      renderShopLoyalty(container, mockData);

      const row = container.querySelector('.loyalty-row');
      expect(row).not.toBeNull();
      const cells = row!.querySelectorAll('td');
      expect(cells.length).toBe(6);

      // 1. Shop column
      expect(cells[0].querySelector('.loyalty-shop-btn')).not.toBeNull();
      // 2. Tier column (badge)
      expect(cells[1].querySelector('.loyalty-badge.badge-vip')).not.toBeNull();
      // 3. Order Count column
      expect(cells[2].textContent?.trim()).toBe('10');
      // 4. Total Spend column
      expect(cells[3].textContent).toMatch(/1\.500\.000/);
      // 5. Frequency column
      expect(cells[4].textContent).toMatch(/2\.5\/tháng/);
      // 6. Last Purchase column
      expect(cells[5].textContent?.trim()).toBe('2026-09-15');

      container.remove();
    });
  });

  describe('Seam 3: Order Table Alternating Zebra Row Striping', () => {
    it('table.css replaces hardcoded semi-opaque white with var(--table-stripe)', () => {
      const css = readStyleFile('table.css');
      // Hardcoded semi-opaque white highlight must be eliminated
      expect(css).not.toMatch(/tr:nth-child\(even\)\s*\{[^}]*background:\s*rgba\(248,\s*249,\s*252,\s*0\.5\);/);
      // Must use semantic --table-stripe variable
      expect(css).toMatch(/tr:nth-child\(even\)\s*\{[^}]*background:\s*var\(--table-stripe\);/);
    });

    it('variables.css defines contrasting --table-stripe for light and dark modes', () => {
      const css = readStyleFile('variables.css');
      // Light mode definition
      expect(css).toMatch(/--table-stripe:\s*#fafbfc;/);
      // Dark mode definition (#0f172a slate-950 for high contrast against light text)
      expect(css).toMatch(/:root\[data-mode="dark"\]\s*\{[^}]*--table-stripe:\s*#0f172a;/);
    });
  });

  describe('Seam 4: Floating Bulk Action Bar High-Contrast Typography', () => {
    it('table.css uses --text-primary for bulk-info text, bulk-count, and bulk-sum', () => {
      const css = readStyleFile('table.css');
      expect(css).toMatch(/\.bulk-info\s*\{[^}]*color:\s*var\(--text-primary\);/);
      expect(css).toMatch(/\.bulk-info\s+\.bulk-count\s*\{[^}]*color:\s*var\(--text-primary\);/);
      expect(css).toMatch(/\.bulk-info\s+\.bulk-sum\s*\{[^}]*color:\s*var\(--text-primary\);/);
    });

    it('table.css uses --text-primary and subtle background for .btn-bulk-subtle', () => {
      const css = readStyleFile('table.css');
      expect(css).toMatch(/\.btn-bulk-subtle\s*\{[^}]*color:\s*var\(--text-primary\);/);
    });

    it('DOM elements in floating bulk bar render counts and currency amounts with high-contrast text', () => {
      document.body.innerHTML = `
        <div id="tabOrders"></div>
        <table id="ordersTable">
          <tbody id="tableBody"></tbody>
        </table>
      `;
      ensureBulkBarInDOM();

      const countEl = document.getElementById('bulkCount');
      const sumEl = document.getElementById('bulkSum');
      expect(countEl).not.toBeNull();
      expect(sumEl).not.toBeNull();

      state.activeTab = 3;
      state.filteredOrders = [
        {
          orderId: 'ORD-101',
          name: 'Sản phẩm A',
          productCount: 1,
          subTotal: 500000,
          subTotalFormatted: '500.000 ₫',
          status: 'Hoàn thành',
          statusCode: 3,
          shopName: 'Shop A',
          productSummary: 'Sản phẩm A',
          deliveryDate: '2026-09-20',
          orderMonth: 9,
          orderYear: 2026,
        },
      ];

      clearSelection();
      selectOrder('ORD-101');
      updateBulkBar();

      expect(countEl?.textContent).toBe('1');
      expect(sumEl?.textContent).toMatch(/500\.000/);

      const bulkBar = document.getElementById('floatingBulkBar');
      expect(bulkBar?.classList.contains('visible')).toBe(true);

      clearSelection();
      document.body.innerHTML = '';
    });
  });

  describe('Seam 5: Dynamic Light and Dark Mode Switching', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.dataset.mode = 'light';
    });

    it('toggling between light and dark mode updates dataset.mode and preserves consistency', () => {
      expect(document.documentElement.dataset.mode).toBe('light');

      setMode('dark');
      expect(document.documentElement.dataset.mode).toBe('dark');
      expect(getResolvedMode()).toBe('dark');
      expect(getMode()).toBe('dark');

      setMode('light');
      expect(document.documentElement.dataset.mode).toBe('light');
      expect(getResolvedMode()).toBe('light');
      expect(getMode()).toBe('light');
    });

    it('variables.css ensures all core surfaces have light and dark mode definitions without gaps', () => {
      const css = readStyleFile('variables.css');
      const lightSection = css.substring(0, css.indexOf(':root[data-mode="dark"]'));
      const darkSection = css.substring(css.indexOf(':root[data-mode="dark"]'));

      const requiredTokens = [
        '--bg-page',
        '--bg-surface',
        '--bg-surface-subtle',
        '--bg-card',
        '--border-subtle',
        '--border-color',
        '--text-main',
        '--text-muted',
        '--text-primary',
        '--text-secondary',
        '--table-stripe',
        '--table-hover',
      ];

      for (const token of requiredTokens) {
        expect(lightSection, `Light mode should define ${token}`).toContain(token);
        expect(darkSection, `Dark mode should define ${token}`).toContain(token);
      }
    });

    it('dynamic mode toggling updates dataset.mode and callback re-renders surfaces without residual patches', () => {
      let chartRenderCount = 0;
      const mockRender = () => { chartRenderCount++; };

      // Toggle to dark
      setMode('dark', mockRender);
      expect(document.documentElement.dataset.mode).toBe('dark');
      expect(chartRenderCount).toBe(1);

      // Toggle to light
      setMode('light', mockRender);
      expect(document.documentElement.dataset.mode).toBe('light');
      expect(chartRenderCount).toBe(2);
    });
  });
});
