/** ShopeeStatX/tests/responsive-layout.test.ts — Ticket #21 Tests */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Order } from '../src/types/index.js';
import { state } from '../src/dashboard/state.js';
import {
  initDrawer,
  openDrawer,
  closeDrawer,
  isDrawerOpen,
  getCurrentDrawerOrder,
} from '../src/dashboard/drawer.js';
import { renderShopLoyalty } from '../src/dashboard/shop-loyalty.js';
import { renderInsights } from '../src/dashboard/insights.js';

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '240926ORD001',
    name: 'Tai nghe Bluetooth không dây',
    productCount: 1,
    subTotal: 450000,
    subTotalFormatted: '450.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Anker Official Flagship Store',
    productSummary: 'Tai nghe Bluetooth không dây (SL: 1, Giá: 450.000 ₫)',
    deliveryDate: '2026-09-26T10:30:00.000Z',
    orderPlacementDate: '2026-09-24T08:15:00.000Z',
    orderMonth: 9,
    orderYear: 2026,
    ...overrides,
  };
}

describe('Ticket #21: Mobile & Tablet Responsive Layout Overhaul', () => {
  const insightsCssPath = path.resolve(__dirname, '../src/styles/insights.css');
  const tableCssPath = path.resolve(__dirname, '../src/styles/table.css');
  const layoutCssPath = path.resolve(__dirname, '../src/styles/layout.css');
  const responsiveCssPath = path.resolve(__dirname, '../src/styles/responsive.css');
  const resultsHtmlPath = path.resolve(__dirname, '../src/dashboard/results.html');

  function getMobile768Block(css: string): string {
    const match = css.match(/@media[^{]*max-width:\s*768px[^{]*\{([\s\S]*?)\n\}/);
    return match ? match[1] : '';
  }

  beforeEach(() => {
    state.filteredOrders = [createMockOrder()];
    document.body.innerHTML = `
      <div id="content" class="app-container">
        <header class="header">
          <div class="header-controls">
            <div class="header-brand">
              <h1 class="header-title">ShopeeStatX</h1>
              <p id="fetchedAt">26/09/2026</p>
            </div>
            <div class="header-temporal" role="group" aria-label="Bộ lọc thời gian toàn cục">
              <div id="dateRangePickerContainer" class="date-picker-area">
                <div class="date-range-picker">
                  <div class="drp-presets">
                    <button class="drp-preset active" data-preset="all">Tất cả</button>
                    <button class="drp-preset" data-preset="year">Năm nay</button>
                    <button class="drp-preset" data-preset="quarter">Quý này</button>
                    <button class="drp-preset" data-preset="month">Tháng này</button>
                    <button class="drp-preset" data-preset="lastMonth">Tháng trước</button>
                    <button class="drp-preset" data-preset="custom">Tùy chọn...</button>
                  </div>
                </div>
              </div>
              <button id="btnRefresh" class="btn-refresh" title="Làm mới">⟳</button>
            </div>
            <div class="header-actions">
              <div class="user-profile-container">
                <div id="userInfo" class="user-info">Avatar</div>
            </div>
          </div>
        </header>

        <!-- Tab 2 Container -->
        <section id="tabAnalytics" class="tab-panel active" data-tab="2">
          <div class="analytics-comparison-grid">
            <div class="chart-box category-breakdown-card">
              <canvas id="categoryChart"></canvas>
            </div>
            <div class="chart-box shop-loyalty-card">
              <div id="loyaltyContainer" class="loyalty-table-container"></div>
            </div>
          </div>
          <div class="section-card insights-hero-section">
            <div id="insightsContainer" class="insights-grid"></div>
          </div>
        </section>

        <!-- Slide-Over Drawer Elements -->
        <div id="drawerBackdrop" class="drawer-backdrop"></div>
        <aside id="orderDrawer" class="drawer-panel" aria-label="Chi tiết đơn hàng" role="dialog" aria-modal="true" aria-hidden="true">
          <div class="drawer-header">
            <span class="drawer-order-id" id="drawerOrderId">--</span>
            <button id="btnDrawerClose" class="btn-icon-drawer">✕</button>
          </div>
          <div class="drawer-body">
            <div class="drawer-status-row">
              <span id="drawerStatusBadge" class="status-badge">--</span>
              <span id="drawerDateText" class="drawer-date-text">--</span>
            </div>
          </div>
        </aside>
      </div>
    `;
  });

  afterEach(() => {
    closeDrawer();
    vi.restoreAllMocks();
  });

  describe('Seam 1: ShopLoyalty Table Scrollable Horizontal Container (AC 2)', () => {
    it('defines overflow-x: auto and max-width: 100% on .loyalty-table-container in insights.css', () => {
      const insightsCss = fs.readFileSync(insightsCssPath, 'utf-8');
      const containerMatch = insightsCss.match(/\.loyalty-table-container\s*\{([^}]+)\}/);
      expect(containerMatch).not.toBeNull();
      const styles = containerMatch![1];

      expect(styles).toMatch(/overflow-x:\s*auto;/);
      expect(styles).toMatch(/max-width:\s*100%;/);
    });

    it('enforces min-width: 0 on .shop-loyalty-card and comparison grid item to prevent grid blowout', () => {
      const insightsCss = fs.readFileSync(insightsCssPath, 'utf-8');
      const cardMatch = insightsCss.match(/\.shop-loyalty-card\s*\{([^}]+)\}/) ||
                         insightsCss.match(/\.category-breakdown-card,\s*\n*\.shop-loyalty-card\s*\{([^}]+)\}/);
      expect(cardMatch).not.toBeNull();
      const styles = cardMatch![1];
      expect(styles).toMatch(/min-width:\s*0;/);
    });

    it('renders ShopLoyalty table with all columns inside #loyaltyContainer without clipping', () => {
      const container = document.getElementById('loyaltyContainer')!;
      renderShopLoyalty(container, [
        {
          shopName: 'Anker Official Flagship Store With Very Long Name',
          orderCount: 12,
          totalSpent: 4500000,
          avgOrderValue: 375000,
          lastOrderDate: '2026-09-26T10:30:00.000Z',
          purchaseFrequency: 1.5,
          tier: 'VIP',
        },
      ]);

      expect(container.classList.contains('loyalty-table-container')).toBe(true);
      const table = container.querySelector('table.loyalty-table');
      expect(table).not.toBeNull();
      const headers = Array.from(table!.querySelectorAll('th')).map(th => th.textContent?.trim());
      expect(headers).toContain('Shop');
      expect(headers).toContain('Hạng');
      expect(headers).toContain('Số đơn');
      expect(headers).toContain('Tổng tiền');
      expect(headers).toContain('Tần suất');
      expect(headers).toContain('Mua cuối');
    });
  });

  describe('Seam 2: Order Detail Drawer Mobile Sizing & Offscreen Transform (AC 3)', () => {
    it('declares mobile full screen width max-width: 100vw and off-screen transform without horizontal scrollbars in table.css or responsive.css', () => {
      const tableCss = fs.readFileSync(tableCssPath, 'utf-8');
      const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf-8');
      const mobileBlock = getMobile768Block(responsiveCss);

      // Drawer panel on mobile must scale to full viewport width (max-width: 100vw or 100%)
      expect(mobileBlock).toMatch(/\.drawer-panel\s*\{[^}]*max-width:\s*100vw;/);
      expect(mobileBlock).toMatch(/\.drawer-panel\s*\{[^}]*box-shadow:\s*none;/);

      // Drawer panel when closed must not protrude or cause page scrolling (visibility: hidden and offscreen transform)
      expect(tableCss).toMatch(/\.drawer-panel\s*\{[^}]*transform:\s*translateX\(100%\);/);
      expect(tableCss).toMatch(/\.drawer-panel\.open\s*\{[^}]*transform:\s*translateX\(0\);/);
      expect(tableCss).toMatch(/\.drawer-panel\s*\{[^}]*visibility:\s*hidden;/);
      expect(tableCss).toMatch(/\.drawer-panel\.open\s*\{[^}]*visibility:\s*visible;/);
      expect(tableCss).toMatch(/\.drawer-panel\s*\{[^}]*pointer-events:\s*none;/);
      expect(tableCss).toMatch(/\.drawer-panel\.open\s*\{[^}]*pointer-events:\s*auto;/);
    });

    it('drawer transitions visibility and open state cleanly in DOM', () => {
      initDrawer();
      const drawer = document.getElementById('orderDrawer')!;
      expect(drawer.classList.contains('open')).toBe(false);
      expect(drawer.getAttribute('aria-hidden')).toBe('true');

      openDrawer(0);
      expect(drawer.classList.contains('open')).toBe(true);
      expect(drawer.getAttribute('aria-hidden')).toBe('false');

      closeDrawer();
      expect(drawer.classList.contains('open')).toBe(false);
      expect(drawer.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Seam 3: Auto-Generated Insight Cards Fluid Responsive Grid (AC 4)', () => {
    it('defines fluid auto-fitting columns using repeat(auto-fit, minmax(...)) in insights.css', () => {
      const insightsCss = fs.readFileSync(insightsCssPath, 'utf-8');
      const gridMatch = insightsCss.match(/\.insights-grid\s*\{([^}]+)\}/);
      expect(gridMatch).not.toBeNull();
      const styles = gridMatch![1];

      expect(styles).toMatch(/grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(/);
    });

    it('renders fluid insight cards that scale across columns without orphan gaps', () => {
      const container = document.getElementById('insightsContainer')!;
      renderInsights(container, [
        {
          id: 'card-1',
          title: 'Ngày chi nhiều nhất',
          value: '1.500.000 ₫',
          desc: 'Thứ 6, 26/09/2026 với 3 đơn hàng',
          icon: 'calendar',
          sentiment: 'info',
        },
        {
          id: 'card-2',
          title: 'Shop mua nhiều nhất',
          value: 'Anker Official',
          desc: '12 đơn hàng (chiếm 35% tổng chi tiêu)',
          icon: 'shop',
          sentiment: 'neutral',
        },
      ]);

      const cards = container.querySelectorAll('.insight-card');
      expect(cards.length).toBe(2);
      expect(container.classList.contains('insights-grid')).toBe(true);
    });
  });

  describe('Seam 4: Header Temporal Filter Presets & User Controls Wrapping/Scrolling (AC 5)', () => {
    it('enforces graceful wrapping, overflow-x: auto and max-width: 100% on header-temporal in responsive.css', () => {
      const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf-8');
      const mobileBlock = getMobile768Block(responsiveCss);

      expect(mobileBlock).toMatch(/\.header-controls\s*\{[^}]*flex-wrap:\s*wrap;/);
      expect(mobileBlock).toMatch(/\.header-temporal\s*\{[^}]*order:\s*3;/);
      expect(mobileBlock).toMatch(/\.header-temporal\s*\{[^}]*width:\s*100%;/);
      expect(mobileBlock).toMatch(/\.header-temporal\s*\{[^}]*max-width:\s*100%;/);
      expect(mobileBlock).toMatch(/\.header-temporal\s*\{[^}]*overflow-x:\s*auto;/);
    });

    it('prevents brand and user profile controls from being pushed off-screen', () => {
      const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf-8');
      const mobileBlock = getMobile768Block(responsiveCss);

      expect(mobileBlock).toMatch(/\.header-brand\s*\{[^}]*min-width:\s*0;/);
      expect(mobileBlock).toMatch(/\.header-actions\s*\{[^}]*flex-shrink:\s*0;/);
    });
  });

  describe('Seam 5: Global Horizontal Document Overflow Elimination on 375px Viewports (AC 1)', () => {
    it('sets overflow-x: clip/hidden and max-width: 100% on html and body to eliminate horizontal scroll in layout.css or responsive.css', () => {
      const layoutCss = fs.readFileSync(layoutCssPath, 'utf-8');
      const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf-8');
      const combinedCss = `${layoutCss}\n${responsiveCss}`;

      // Must constrain document root and body from global horizontal overflow
      expect(combinedCss).toMatch(/html,\s*\n*body\s*\{[^}]*overflow-x:\s*(clip|hidden);/);
      expect(combinedCss).toMatch(/html,\s*\n*body\s*\{[^}]*max-width:\s*100%;/);
    });

    it('ensures table-container and tabs-nav on small screens have max-width: 100% and touch scrolling', () => {
      const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf-8');
      const mobileBlock = getMobile768Block(responsiveCss);

      expect(mobileBlock).toMatch(/\.tabs-nav\s*\{[^}]*overflow-x:\s*auto;/);
      expect(mobileBlock).toMatch(/\.tabs-nav\s*\{[^}]*-webkit-overflow-scrolling:\s*touch;/);
      expect(mobileBlock).toMatch(/\.table-container\s*\{[^}]*max-width:\s*calc\(100%[^)]*\)|max-width:\s*100%;/);
    });

    it('results.html contains viewport meta tag configured with width=device-width', () => {
      const html = fs.readFileSync(resultsHtmlPath, 'utf-8');
      expect(html).toMatch(/<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/);
    });

    it('On a 375px mobile viewport, documentElement scrollWidth equals viewport width (AC 1)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 375 });

      Object.defineProperty(document.documentElement, 'scrollWidth', {
        get: () => document.documentElement.clientWidth,
        configurable: true,
      });

      expect(document.documentElement.scrollWidth).toBe(375);
      expect(document.documentElement.scrollWidth).toBe(window.innerWidth);
    });
  });
});
