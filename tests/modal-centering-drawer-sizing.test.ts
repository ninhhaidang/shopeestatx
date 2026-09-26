/** ShopeeStatX/tests/modal-centering-drawer-sizing.test.ts — Ticket #17 Tests */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Order, BudgetConfig, OverviewMetrics } from '../src/types/index.js';
import { state } from '../src/dashboard/state.js';
import {
  openBudgetModal,
  renderFinancialHealthCard,
  renderOverview,
} from '../src/dashboard/overview.js';
import {
  initDrawer,
  openDrawer,
  closeDrawer,
  stepDrawer,
  isDrawerOpen,
  getCurrentDrawerOrder,
} from '../src/dashboard/drawer.js';

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '240926ORD001',
    name: 'Sạc nhanh GaN 65W Baseus',
    productCount: 1,
    subTotal: 350000,
    subTotalFormatted: '350.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Baseus Official Store',
    productSummary: 'Sạc nhanh GaN 65W Baseus (SL: 1, Giá: 350.000 ₫)',
    deliveryDate: '2026-09-26T10:30:00.000Z',
    orderPlacementDate: '2026-09-24T08:15:00.000Z',
    orderMonth: 9,
    orderYear: 2026,
    ...overrides,
  };
}

describe('Ticket #17: Modal Centering & Order Drawer Status Row Layout Sizing', () => {
  const insightsCssPath = path.resolve(__dirname, '../src/styles/insights.css');
  const tableCssPath = path.resolve(__dirname, '../src/styles/table.css');
  const layoutCssPath = path.resolve(__dirname, '../src/styles/layout.css');

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="financialHealthCard"></div>
      <div id="kpiStrip"></div>

      <!-- Budget Settings Dialog -->
      <dialog id="budgetDialog">
        <h3 data-i18n="budget.title">Cài đặt ngân sách</h3>
        <div class="dialog-field">
          <label for="budgetLimit">Hạn mức hàng tháng (VND)</label>
          <input type="number" id="budgetLimit" min="0" step="100000" placeholder="5000000" />
        </div>
        <div class="dialog-field">
          <label for="budgetThreshold"><span>Cảnh báo tại:</span> <span id="budgetThresholdValue">80%</span></label>
          <input type="range" id="budgetThreshold" min="50" max="95" value="80" />
        </div>
        <label class="dialog-checkbox-row">
          <input type="checkbox" id="budgetEnabled" />
          <span>Bật theo dõi ngân sách</span>
        </label>
        <div class="dialog-actions">
          <button id="btnBudgetClose" class="btn-dialog-close">Đóng</button>
          <button id="btnBudgetSave" class="btn-dialog-save">Lưu</button>
        </div>
      </dialog>

      <!-- Slide-Over Drawer Elements -->
      <div id="drawerBackdrop" class="drawer-backdrop"></div>
      <aside id="orderDrawer" class="drawer-panel" aria-label="Chi tiết đơn hàng" role="dialog" aria-modal="true">
        <div class="drawer-header">
          <div class="drawer-title-group">
            <span class="drawer-order-id" id="drawerOrderId">--</span>
            <button id="btnDrawerCopyId" class="btn-icon-drawer" title="Sao chép mã đơn" aria-label="Sao chép mã đơn">
              <span>Copy</span>
            </button>
            <a id="drawerShopeeLink" href="https://shopee.vn" target="_blank" class="btn-icon-drawer" title="Mở trang đơn hàng trên Shopee">Link</a>
          </div>
          <div class="drawer-controls">
            <button id="btnDrawerPrev" class="btn-icon-drawer btn-stepper" title="Đơn trước (Phím ↑)" aria-label="Đơn trước">▲ Trước</button>
            <button id="btnDrawerNext" class="btn-icon-drawer btn-stepper" title="Đơn sau (Phím ↓)" aria-label="Đơn sau">▼ Sau</button>
            <button id="btnDrawerClose" class="btn-icon-drawer" title="Đóng (Esc)" aria-label="Đóng">✕</button>
          </div>
        </div>
        <div class="drawer-body">
          <div class="drawer-status-row">
            <span id="drawerStatusBadge" class="status-badge">--</span>
            <span id="drawerDateText" class="drawer-date-text">--</span>
          </div>
          <div class="drawer-card">
            <div class="drawer-card-title">
              <span>Thông tin người bán</span>
              <button type="button" id="btnDrawerFilterShop" class="btn-filter-shop">Lọc đơn shop này ➔</button>
            </div>
            <div class="drawer-shop-info">
              <div class="drawer-shop-icon">🏪</div>
              <div>
                <div id="drawerShopName" class="drawer-shop-name">--</div>
                <div id="drawerShopSub" class="drawer-shop-sub">--</div>
              </div>
            </div>
          </div>
          <div class="drawer-card">
            <div class="drawer-card-title">
              <span>Danh sách sản phẩm</span>
              <span id="drawerItemCount" class="drawer-item-count">0 món</span>
            </div>
            <div id="drawerItemList" class="drawer-item-list"></div>
          </div>
          <div class="drawer-card">
            <div class="drawer-card-title">Chi tiết thanh toán</div>
            <div class="drawer-payment-details">
              <div class="drawer-payment-row">
                <span>Tiền hàng</span>
                <span id="drawerSubtotal" class="drawer-amount-mono">0 ₫</span>
              </div>
              <div class="drawer-payment-row">
                <span>Phí vận chuyển</span>
                <span id="drawerShipping" class="drawer-amount-mono">0 ₫</span>
              </div>
              <div class="drawer-payment-row">
                <span>Giảm giá</span>
                <span id="drawerDiscount" class="drawer-amount-mono">0 ₫</span>
              </div>
              <div class="drawer-payment-row total-row">
                <span>Tổng thanh toán</span>
                <span id="drawerTotal" class="drawer-amount-mono">0 ₫</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    `;

    // Mock HTMLDialogElement.prototype methods if missing in jsdom
    const dialog = document.getElementById('budgetDialog') as HTMLDialogElement;
    if (dialog && !dialog.showModal) {
      dialog.showModal = vi.fn(() => {
        dialog.setAttribute('open', '');
      });
      dialog.close = vi.fn(() => {
        dialog.removeAttribute('open');
      });
    }

    state.filteredOrders = [
      createMockOrder({ orderId: 'ORD-1', status: 'Hoàn thành', statusCode: 3 }),
      createMockOrder({ orderId: 'ORD-2', status: 'Đã hủy', statusCode: 4, subTotal: 0, subTotalFormatted: '0 ₫' }),
      createMockOrder({ orderId: 'ORD-3', status: 'Đang giao', statusCode: 7 }),
      createMockOrder({ orderId: 'ORD-4', status: 'Đang vận chuyển', statusCode: 8 }),
      createMockOrder({ orderId: 'ORD-5', status: 'Chờ thanh toán', statusCode: 9 }),
      createMockOrder({ orderId: 'ORD-6', status: 'Trả hàng/Hoàn tiền', statusCode: 12, subTotal: 0, subTotalFormatted: '0 ₫' }),
    ];
    state.allOrdersData = {
      orders: [...state.filteredOrders],
      totalSpent: 1500000,
      totalOrders: 6,
      dateRange: { earliest: '2026-09-01', latest: '2026-09-26' },
      currency: 'VND',
    };
    state.currentPage = 1;
    state.itemsPerPage = 10;
  });

  afterEach(() => {
    closeDrawer();
    vi.restoreAllMocks();
  });

  describe('Seam 1: Budget Modal Centering & Responsive Sizing (AC 1)', () => {
    it('declares auto margins and responsive width on #budgetDialog in insights.css', () => {
      const insightsCss = fs.readFileSync(insightsCssPath, 'utf-8');
      
      // Extract #budgetDialog block
      const budgetDialogMatch = insightsCss.match(/#budgetDialog\s*\{([^}]+)\}/);
      expect(budgetDialogMatch).not.toBeNull();
      const budgetDialogStyles = budgetDialogMatch![1];

      // Must have margin: auto so that global * { margin: 0 } doesn't pin it to top-left
      expect(budgetDialogStyles).toMatch(/margin:\s*auto;/);

      // Must have responsive width constraints for desktop, tablet, and mobile
      expect(budgetDialogStyles).toMatch(/(max-width:\s*420px|width:\s*(min\(420px|90vw))/);
      expect(budgetDialogStyles).toMatch(/min-width:\s*(280px|300px|auto)/);
    });

    it('declares base dialog auto margin in layout.css to prevent global reset pinning', () => {
      const layoutCss = fs.readFileSync(layoutCssPath, 'utf-8');
      const dialogMatch = layoutCss.match(/(?:^|\n)\s*dialog\s*\{([^}]+)\}/);
      expect(dialogMatch).not.toBeNull();
      expect(dialogMatch![1]).toMatch(/margin:\s*auto;/);
    });

    it('opens budget configuration modal centered via showModal when clicking "Thiết lập ngân sách ngay"', () => {
      const container = document.getElementById('financialHealthCard')!;
      const disabledBudget: BudgetConfig = {
        monthlyLimit: 5_000_000,
        enabled: false,
        alertThreshold: 0.8,
      };

      const metrics: OverviewMetrics = {
        totalSpend: 0,
        orderCount: 0,
        averageOrderValue: 0,
        monthlyTrendPct: 0,
        monthlyTrendDirection: 'neutral',
        thisMonthSpend: 0,
        lastMonthSpend: 0,
        monthOverMonthDelta: 0,
        budgetPct: 0,
        budgetRemaining: 5_000_000,
        burnRate: 0,
        monthEndForecast: 0,
        daysRemaining: 15,
      };

      const dialog = document.getElementById('budgetDialog') as HTMLDialogElement;
      const showModalSpy = vi.fn();
      dialog.showModal = showModalSpy;

      renderFinancialHealthCard(container, metrics, disabledBudget, () => {
        openBudgetModal(disabledBudget);
      });

      const setupBtn = container.querySelector('#btnSetupBudget') as HTMLButtonElement | null;
      expect(setupBtn).not.toBeNull();
      expect(setupBtn?.getAttribute('aria-label')).toBe('Thiết lập ngân sách ngay');
      expect(setupBtn?.textContent).toContain('Thiết lập ngân sách ngay');

      // Click "Thiết lập ngân sách ngay"
      setupBtn?.click();

      // Expect modal to be invoked via showModal
      expect(showModalSpy).toHaveBeenCalledTimes(1);

      // Verify input values populated
      const limitInput = document.getElementById('budgetLimit') as HTMLInputElement;
      expect(limitInput.value).toBe('5000000');
    });

    it('renderOverview attaches openBudgetModal to "Thiết lập ngân sách ngay" by default', () => {
      const dialog = document.getElementById('budgetDialog') as HTMLDialogElement;
      const showModalSpy = vi.fn();
      dialog.showModal = showModalSpy;

      renderOverview({
        filteredOrders: [],
        allOrders: [],
        budgetConfig: { monthlyLimit: 6000000, enabled: false, alertThreshold: 0.85 },
      });

      const setupBtn = document.getElementById('btnSetupBudget');
      expect(setupBtn).not.toBeNull();
      setupBtn?.click();

      expect(showModalSpy).toHaveBeenCalledTimes(1);
      const limitInput = document.getElementById('budgetLimit') as HTMLInputElement;
      expect(limitInput.value).toBe('6000000');
    });
  });

  describe('Seam 2: Order Detail Drawer Status Badge Intrinsic Sizing & Single-Line Timestamp Layout (AC 2 & 3)', () => {
    it('declares intrinsic width sizing for .drawer-status-row .status-badge in table.css', () => {
      const tableCss = fs.readFileSync(tableCssPath, 'utf-8');

      // Check drawer status row definition
      const drawerStatusRowMatch = tableCss.match(/\.drawer-status-row\s*\{([^}]+)\}/);
      expect(drawerStatusRowMatch).not.toBeNull();
      const statusRowStyles = drawerStatusRowMatch![1];
      expect(statusRowStyles).toMatch(/display:\s*flex;/);
      expect(statusRowStyles).toMatch(/justify-content:\s*space-between;/);
      expect(statusRowStyles).toMatch(/gap:\s*(12px|var\(--spacing-md[^)]*\))/);

      // Check status badge width constraint within drawer-status-row
      const statusBadgeScopedMatch = tableCss.match(/\.drawer-status-row\s+\.status-badge\s*\{([^}]+)\}/);
      expect(statusBadgeScopedMatch).not.toBeNull();
      const scopedStyles = statusBadgeScopedMatch![1];

      // Must NOT take 100% width; must only take intrinsic content width
      expect(scopedStyles).toMatch(/width:\s*(auto|fit-content);/);
      expect(scopedStyles).toMatch(/min-width:\s*(auto|fit-content);/);
      expect(scopedStyles).toMatch(/flex-shrink:\s*0;/);

      // Check drawer-date-text single-line constraint
      const dateTextMatch = tableCss.match(/\.drawer-date-text\s*\{([^}]+)\}/);
      expect(dateTextMatch).not.toBeNull();
      const dateTextStyles = dateTextMatch![1];
      expect(dateTextStyles).toMatch(/white-space:\s*nowrap;/);
    });

    it('renders status badge with intrinsic content and delivery timestamp on a single line', () => {
      initDrawer();
      const order = createMockOrder({
        orderId: 'ORD-INTRINSIC-1',
        status: 'Hoàn thành',
        statusCode: 3,
        deliveryDate: '2026-09-26T14:30:00.000Z',
      });

      openDrawer(order);
      expect(isDrawerOpen()).toBe(true);

      const badgeEl = document.getElementById('drawerStatusBadge')!;
      expect(badgeEl.textContent).toContain('Hoàn thành');
      expect(badgeEl.className).toContain('status-badge');
      expect(badgeEl.className).toContain('status-3');

      const dateEl = document.getElementById('drawerDateText')!;
      expect(dateEl.textContent).not.toBe('--');
      // Should contain date/time string without line breaks
      expect(dateEl.textContent).not.toContain('\n');
      expect(dateEl.textContent).not.toContain('\r');
    });

    it('uses AuthoritativeDate: falls back to orderPlacementDate when deliveryDate is absent', () => {
      initDrawer();
      const order = createMockOrder({
        orderId: 'ORD-NO-DELIVERY',
        status: 'Chờ thanh toán',
        statusCode: 9,
        deliveryDate: undefined,
        orderPlacementDate: '2026-09-24T08:15:00.000Z',
      });

      openDrawer(order);

      const dateEl = document.getElementById('drawerDateText')!;
      expect(dateEl.textContent).not.toBe('--');
      expect(dateEl.textContent).not.toBe('Không có ngày');
      expect(dateEl.textContent).not.toContain('\n');
    });
  });

  describe('Seam 3: Drawer Stepping Alignment & Consistency Across Status Codes (AC 4)', () => {
    it('maintains consistent badge formatting and timestamp rendering across all order status codes when stepping', () => {
      initDrawer();

      // Open first order (statusCode 3: Hoàn thành)
      openDrawer(0);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-1');
      let badge = document.getElementById('drawerStatusBadge')!;
      let date = document.getElementById('drawerDateText')!;
      expect(badge.className).toContain('status-3');
      expect(badge.textContent).toContain('Hoàn thành');
      expect(date.textContent).not.toContain('\n');

      // Step forward to ORD-2 (statusCode 4: Đã hủy)
      stepDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-2');
      badge = document.getElementById('drawerStatusBadge')!;
      date = document.getElementById('drawerDateText')!;
      expect(badge.className).toContain('status-4');
      expect(badge.textContent).toContain('Đã hủy');
      expect(date.textContent).not.toContain('\n');

      // Step forward to ORD-3 (statusCode 7: Đang giao)
      stepDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-3');
      badge = document.getElementById('drawerStatusBadge')!;
      date = document.getElementById('drawerDateText')!;
      expect(badge.className).toContain('status-7');
      expect(badge.textContent).toContain('Đang giao');
      expect(date.textContent).not.toContain('\n');

      // Step forward to ORD-4 (statusCode 8: Đang vận chuyển)
      stepDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-4');
      badge = document.getElementById('drawerStatusBadge')!;
      date = document.getElementById('drawerDateText')!;
      expect(badge.className).toContain('status-8');
      expect(badge.textContent).toContain('Đang vận chuyển');
      expect(date.textContent).not.toContain('\n');

      // Step forward to ORD-5 (statusCode 9: Chờ thanh toán)
      stepDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-5');
      badge = document.getElementById('drawerStatusBadge')!;
      date = document.getElementById('drawerDateText')!;
      expect(badge.className).toContain('status-9');
      expect(badge.textContent).toContain('Chờ thanh toán');
      expect(date.textContent).not.toContain('\n');

      // Step forward to ORD-6 (statusCode 12: Trả hàng/Hoàn tiền)
      stepDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-6');
      badge = document.getElementById('drawerStatusBadge')!;
      date = document.getElementById('drawerDateText')!;
      expect(badge.className).toContain('status-12');
      expect(badge.textContent).toContain('Trả hàng');
      expect(date.textContent).not.toContain('\n');

      // Step backward via keyboard ArrowUp to ORD-5
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-5');

      // Step backward via keyboard ArrowUp to ORD-4
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-4');
    });
  });
});
