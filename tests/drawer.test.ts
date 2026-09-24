import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state } from '../src/dashboard/state.js';
import type { Order } from '../src/types/index.js';
import {
  initDrawer,
  openDrawer,
  closeDrawer,
  stepDrawer,
  isDrawerOpen,
  getCurrentDrawerOrder,
  copyDrawerOrderId,
  parseOrderItems,
} from '../src/dashboard/drawer.js';
import { renderCurrentPage } from '../src/dashboard/table.js';
import * as utils from '../src/dashboard/utils.js';

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '240920XYZ890',
    name: 'Tai nghe Bluetooth không dây ANC',
    productCount: 1,
    subTotal: 450000,
    subTotalFormatted: '450.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Anker Official Store',
    productSummary: 'Tai nghe Bluetooth không dây ANC (SL: 1, Giá: 450.000 ₫)',
    deliveryDate: '2026-09-20T14:32:00.000Z',
    orderMonth: 9,
    orderYear: 2026,
    ...overrides,
  };
}

describe('Tab 3 Pro-Inspector Drawer & Rich Order Table (Issue #12)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="searchBox" value="" />
      <select id="filterStatus"><option value="">Tất cả</option></select>
      <div class="table-container">
        <table id="ordersTable">
          <thead>
            <tr>
              <th width="50" class="col-stt">STT</th>
              <th width="110" class="sortable" data-sort="deliveryDate">Ngày giao</th>
              <th width="180">Shop / Người bán</th>
              <th>Sản phẩm</th>
              <th width="140" class="sortable text-center" data-sort="status">Trạng thái</th>
              <th width="110" class="sortable col-amount" data-sort="subTotal">Tổng tiền</th>
              <th width="70" class="text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
        <div id="paginationContainer">
          <span id="pageStart">0</span>
          <span id="pageEnd">0</span>
          <span id="pageTotal">0</span>
          <div id="pageNumbers"></div>
          <button id="btnFirstPage"></button>
          <button id="btnPrevPage"></button>
          <button id="btnNextPage"></button>
          <button id="btnLastPage"></button>
        </div>
      </div>

      <!-- Slide-Over Drawer Elements -->
      <div id="drawerBackdrop" class="drawer-backdrop"></div>
      <aside id="orderDrawer" class="drawer-panel" aria-label="Chi tiết đơn hàng" role="dialog" aria-modal="true">
        <div class="drawer-header">
          <div class="drawer-title-group">
            <span class="drawer-order-id" id="drawerOrderId">--</span>
            <button id="btnDrawerCopyId" class="btn-icon-drawer" title="Sao chép mã đơn" aria-label="Sao chép mã đơn">
              <span class="copy-icon">Copy</span>
            </button>
            <a id="drawerShopeeLink" href="https://shopee.vn" target="_blank" class="btn-icon-drawer" title="Mở trang đơn hàng trên Shopee">Link</a>
          </div>
          <div class="drawer-controls">
            <button id="btnDrawerPrev" class="btn-icon-drawer" title="Đơn trước (Phím ↑)" aria-label="Đơn trước">▲</button>
            <button id="btnDrawerNext" class="btn-icon-drawer" title="Đơn sau (Phím ↓)" aria-label="Đơn sau">▼</button>
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
              <div id="drawerShopName" class="drawer-shop-name">--</div>
              <div id="drawerShopSub" class="drawer-shop-sub">--</div>
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
                <span>Giảm giá voucher</span>
                <span id="drawerDiscount" class="drawer-amount-mono">0 ₫</span>
              </div>
              <div class="drawer-payment-row drawer-payment-total">
                <span>Tổng thanh toán</span>
                <span id="drawerTotal" class="drawer-amount-total">0 ₫</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    `;

    state.filteredOrders = [
      createMockOrder({ orderId: 'ORD-001', name: 'Sản phẩm 1', shopName: 'Shop A' }),
      createMockOrder({
        orderId: 'ORD-002',
        name: 'Sản phẩm 2',
        shopName: 'Shop B',
        productCount: 3,
        items: [
          { name: 'Sản phẩm 2A', quantity: 2, priceFormatted: '200.000 ₫' },
          { name: 'Sản phẩm 2B', quantity: 1, priceFormatted: '100.000 ₫' },
        ],
      }),
      createMockOrder({ orderId: 'ORD-003', name: 'Sản phẩm 3', shopName: 'Shop C' }),
    ];
    state.allOrdersData = {
      orders: state.filteredOrders,
      totalCount: 3,
      totalAmount: 1000000,
      totalAmountFormatted: '1.000.000 ₫',
      fetchedAt: new Date().toISOString(),
    };
    state.currentPage = 1;
    state.itemsPerPage = 20;

    initDrawer();
  });

  afterEach(() => {
    closeDrawer();
    vi.restoreAllMocks();
  });

  describe('Seam 1: Drawer Lifecycle (openDrawer, closeDrawer, backdrop & panel)', () => {
    it('openDrawer opens the drawer panel with backdrop blur and active classes', () => {
      const drawer = document.getElementById('orderDrawer')!;
      const backdrop = document.getElementById('drawerBackdrop')!;

      expect(isDrawerOpen()).toBe(false);
      expect(drawer.classList.contains('open')).toBe(false);
      expect(backdrop.classList.contains('active')).toBe(false);

      openDrawer(0);

      expect(isDrawerOpen()).toBe(true);
      expect(drawer.classList.contains('open')).toBe(true);
      expect(backdrop.classList.contains('active')).toBe(true);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-001');
    });

    it('closeDrawer closes the drawer and removes active classes', () => {
      openDrawer(0);
      expect(isDrawerOpen()).toBe(true);

      closeDrawer();

      const drawer = document.getElementById('orderDrawer')!;
      const backdrop = document.getElementById('drawerBackdrop')!;
      expect(isDrawerOpen()).toBe(false);
      expect(drawer.classList.contains('open')).toBe(false);
      expect(backdrop.classList.contains('active')).toBe(false);
    });

    it('clicking drawerBackdrop closes the drawer', () => {
      openDrawer(0);
      const backdrop = document.getElementById('drawerBackdrop')!;
      backdrop.click();

      expect(isDrawerOpen()).toBe(false);
    });

    it('clicking close button closes the drawer', () => {
      openDrawer(0);
      const closeBtn = document.getElementById('btnDrawerClose')!;
      closeBtn.click();

      expect(isDrawerOpen()).toBe(false);
    });
  });

  describe('Seam 2: Drawer Content Rendering', () => {
    it('renders order ID, external link, status badge, date, and seller details', () => {
      const order = createMockOrder({
        orderId: 'ORD-SPECIAL',
        shopName: 'Anker Vietnam Flagship',
        status: 'Hoàn thành',
        statusCode: 3,
      });
      openDrawer(order);

      const idEl = document.getElementById('drawerOrderId')!;
      expect(idEl.textContent).toBe('ORD-SPECIAL');

      const linkEl = document.getElementById('drawerShopeeLink') as HTMLAnchorElement;
      expect(linkEl.href).toContain('ORD-SPECIAL');
      expect(linkEl.target).toBe('_blank');

      const shopNameEl = document.getElementById('drawerShopName')!;
      expect(shopNameEl.textContent).toBe('Anker Vietnam Flagship');

      const statusBadge = document.getElementById('drawerStatusBadge')!;
      expect(statusBadge.textContent).toContain('Hoàn thành');
      expect(statusBadge.className).toContain('status-3');
    });

    it('renders itemized product list with quantities and prices', () => {
      const order = createMockOrder({
        orderId: 'ORD-ITEMS',
        productCount: 3,
        items: [
          { name: 'Cáp sạc Type-C 100W', quantity: 2, priceFormatted: '240.000 ₫' },
          { name: 'Củ sạc GaN 65W', quantity: 1, priceFormatted: '450.000 ₫' },
        ],
        subTotalFormatted: '690.000 ₫',
      });
      openDrawer(order);

      const itemCount = document.getElementById('drawerItemCount')!;
      expect(itemCount.textContent).toContain('2');

      const itemList = document.getElementById('drawerItemList')!;
      expect(itemList.children.length).toBe(2);
      expect(itemList.innerHTML).toContain('Cáp sạc Type-C 100W');
      expect(itemList.innerHTML).toContain('x2');
      expect(itemList.innerHTML).toContain('240.000 ₫');
      expect(itemList.innerHTML).toContain('Củ sạc GaN 65W');
      expect(itemList.innerHTML).toContain('x1');
      expect(itemList.innerHTML).toContain('450.000 ₫');
    });

    it('falls back to parsing productSummary when explicit items are absent', () => {
      const parsed = parseOrderItems('Áo thun nam basic (SL: 2, Giá: 150.000 ₫); Quần jean slim (SL: 1, Giá: 300.000 ₫)', 'Default Name');
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Áo thun nam basic');
      expect(parsed[0].quantity).toBe(2);
      expect(parsed[0].priceFormatted).toBe('150.000 ₫');
      expect(parsed[1].name).toBe('Quần jean slim');
      expect(parsed[1].quantity).toBe(1);
      expect(parsed[1].priceFormatted).toBe('300.000 ₫');
    });

    it('parses comma-separated productSummary items correctly', () => {
      const parsed = parseOrderItems('Ốp lưng iPhone (SL: 1, Giá: 50.000 ₫), Kính cường lực (SL: 2, Giá: 40.000 ₫)', 'Default Name');
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Ốp lưng iPhone');
      expect(parsed[1].name).toBe('Kính cường lực');
      expect(parsed[1].quantity).toBe(2);
    });

    it('renders payment summary and calculates reconciled total with shipping and discount', () => {
      const order = createMockOrder({
        subTotal: 500000,
        subTotalFormatted: '500.000 ₫',
        shippingFee: 30000,
        shippingFeeFormatted: '30.000 ₫',
        voucherDiscount: 20000,
        voucherDiscountFormatted: '-20.000 ₫',
      });
      openDrawer(order);

      expect(document.getElementById('drawerSubtotal')!.textContent).toBe('500.000 ₫');
      expect(document.getElementById('drawerShipping')!.textContent).toBe('30.000 ₫');
      expect(document.getElementById('drawerDiscount')!.textContent).toBe('-20.000 ₫');
      // Total = 500,000 + 30,000 - 20,000 = 510,000 ₫
      expect(document.getElementById('drawerTotal')!.textContent).toContain('510.000');
    });
  });

  describe('Seam 3: Drawer Sequential Stepper & Keyboard Navigation', () => {
    it('disables previous stepper button on the first order and next on the last order', () => {
      openDrawer(0);
      const prevBtn = document.getElementById('btnDrawerPrev') as HTMLButtonElement;
      const nextBtn = document.getElementById('btnDrawerNext') as HTMLButtonElement;

      expect(prevBtn.disabled).toBe(true);
      expect(nextBtn.disabled).toBe(false);

      stepDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-002');
      expect(prevBtn.disabled).toBe(false);
      expect(nextBtn.disabled).toBe(false);

      stepDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-003');
      expect(prevBtn.disabled).toBe(false);
      expect(nextBtn.disabled).toBe(true);
    });

    it('stepper buttons click advances or retreats through filteredOrders', () => {
      openDrawer(1);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-002');

      const prevBtn = document.getElementById('btnDrawerPrev') as HTMLButtonElement;
      prevBtn.click();
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-001');

      const nextBtn = document.getElementById('btnDrawerNext') as HTMLButtonElement;
      nextBtn.click();
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-002');
    });

    it('keyboard navigation with ArrowDown and ArrowUp steps through consecutive orders', () => {
      openDrawer(0);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-001');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-002');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-003');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-002');
    });

    it('keyboard Escape closes the drawer', () => {
      openDrawer(0);
      expect(isDrawerOpen()).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(isDrawerOpen()).toBe(false);
    });

    it('keyboard events do not trigger order stepping when drawer is closed', () => {
      expect(isDrawerOpen()).toBe(false);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(isDrawerOpen()).toBe(false);
      expect(getCurrentDrawerOrder()).toBeNull();
    });
  });

  describe('Seam 4: 1-Click Copy Order ID with Visual Confirmation', () => {
    it('copies Order ID to clipboard and triggers showToast visual confirmation', async () => {
      const showToastSpy = vi.spyOn(utils, 'showToast').mockImplementation(() => {});
      let clipboardText = '';
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation((text: string) => {
            clipboardText = text;
            return Promise.resolve();
          }),
        },
      });

      openDrawer(0);
      const copyBtn = document.getElementById('btnDrawerCopyId')!;
      copyBtn.click();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ORD-001');
      expect(clipboardText).toBe('ORD-001');
      expect(showToastSpy).toHaveBeenCalledWith(expect.stringContaining('ORD-001'));
    });
  });

  describe('Seam 5: Rich Order Table with Shop Column & Drawer Trigger', () => {
    it('renders a dedicated Shop column and multi-item count badge (+N món)', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const rows = tableBody.querySelectorAll('tr.order-row');
      expect(rows.length).toBe(3);

      // Row 0 has shop name
      const row0Shop = rows[0].querySelector('.shop-link-filter');
      expect(row0Shop).not.toBeNull();
      expect(row0Shop?.textContent).toContain('Shop A');

      // Row 1 is a multi-item order (productCount: 3 -> +2 món)
      const pill = rows[1].querySelector('.items-pill');
      expect(pill).not.toBeNull();
      expect(pill?.textContent).toBe('+2 món');

      // Row 0 is single item (productCount: 1 -> no pill)
      expect(rows[0].querySelector('.items-pill')).toBeNull();
    });

    it('renders semantic status badges and inspection trigger button on each row', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const rows = tableBody.querySelectorAll('tr.order-row');

      rows.forEach(row => {
        expect(row.querySelector('.status-badge')).not.toBeNull();
        const inspectBtn = row.querySelector('.btn-inspect');
        expect(inspectBtn).not.toBeNull();
        expect(inspectBtn?.textContent).toContain('Xem');
      });
    });

    it('clicking an order row opens the slide-over drawer for that order', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const row1 = tableBody.querySelectorAll('tr.order-row')[1] as HTMLElement;

      row1.click();

      expect(isDrawerOpen()).toBe(true);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-002');
    });

    it('clicking the inspection trigger button opens the slide-over drawer', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const row2Inspect = tableBody.querySelectorAll('tr.order-row')[2].querySelector('.btn-inspect') as HTMLElement;

      row2Inspect.click();

      expect(isDrawerOpen()).toBe(true);
      expect(getCurrentDrawerOrder()?.orderId).toBe('ORD-003');
    });

    it('clicking shop link in table row filters by shop without opening drawer', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const shopBtn = tableBody.querySelectorAll('tr.order-row')[0].querySelector('.shop-link-filter') as HTMLElement;

      shopBtn.click();

      const searchBox = document.getElementById('searchBox') as HTMLInputElement;
      expect(searchBox.value).toBe('Shop A');
      // Opening drawer should not have been triggered
      expect(isDrawerOpen()).toBe(false);
    });

    it('clicking filter shop button inside drawer filters orders by shop and closes drawer', () => {
      openDrawer(0);
      expect(isDrawerOpen()).toBe(true);

      const filterShopBtn = document.getElementById('btnDrawerFilterShop')!;
      filterShopBtn.click();

      const searchBox = document.getElementById('searchBox') as HTMLInputElement;
      expect(searchBox.value).toBe('Shop A');
      expect(isDrawerOpen()).toBe(false);
    });

    it('does NOT create legacy accordion detail-rows in the table body', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const detailRows = tableBody.querySelectorAll('tr.detail-row');
      expect(detailRows.length).toBe(0);
    });
  });
});
