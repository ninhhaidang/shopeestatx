import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state } from '../src/dashboard/state.js';
import type { OrderData } from '../src/types/index.js';
import { STORAGE_KEYS } from '../src/config.js';
import {
  initProfilePopover,
  toggleProfilePopover,
  openProfilePopover,
  closeProfilePopover,
  isProfilePopoverOpen,
  updateProfilePopoverUI,
  purgeLocalCache,
  confirmAndPurgeCache,
  ensureProfilePopoverInDOM,
} from '../src/dashboard/profile-popover.js';

function createMockOrderData(overrides: Partial<OrderData> = {}): OrderData {
  return {
    user: {
      userId: 12345,
      username: 'shopee_user_vip',
      name: 'Nguyễn Văn A',
      avatar: 'https://example.com/avatar.jpg',
      shopId: 67890,
    },
    orders: [
      {
        orderId: 'ORD-101',
        name: 'Sản phẩm 1',
        productCount: 1,
        subTotal: 150000,
        subTotalFormatted: '150.000 ₫',
        status: 'Hoàn thành',
        statusCode: 3,
        shopName: 'Shop A',
        productSummary: 'Sản phẩm 1',
        deliveryDate: '2026-09-20T10:00:00.000Z',
        orderMonth: 9,
        orderYear: 2026,
      },
    ],
    totalCount: 1,
    totalAmount: 150000,
    totalAmountFormatted: '150.000 ₫',
    fetchedAt: '2026-09-24T08:00:00.000Z',
    cachedAt: '2026-09-24T08:30:00.000Z',
    ...overrides,
  };
}

describe('Profile Popover & Cache Management (Issue #14)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="content">
        <span id="lastUpdated">Cập nhật: vừa xong</span>
        <p id="fetchedAt">Cập nhật: 24/09/2026</p>
        <div class="user-profile-container">
          <div id="userInfo" class="user-info" role="button" tabindex="0">
            <img id="userAvatar" src="" alt="Avatar" class="user-avatar" />
            <span id="userName" class="user-name"></span>
            <svg class="user-dropdown-icon" width="16" height="16"></svg>
          </div>
        </div>
      </div>
      <div id="noData" class="no-data hidden">
        <p>Không có dữ liệu</p>
      </div>
    `;

    state.allOrdersData = createMockOrderData();
    state.filteredOrders = [...state.allOrdersData.orders];

    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    closeProfilePopover();
  });

  describe('Seam 1: User Profile Pill & Cache Popover Interaction', () => {
    it('ensures popover and purge dialog elements are present in DOM', () => {
      ensureProfilePopoverInDOM();
      expect(document.getElementById('userProfilePopover')).not.toBeNull();
      expect(document.getElementById('popoverUserName')).not.toBeNull();
      expect(document.getElementById('popoverDomain')).not.toBeNull();
      expect(document.getElementById('popoverCacheTime')).not.toBeNull();
      expect(document.getElementById('btnForceResync')).not.toBeNull();
      expect(document.getElementById('btnPurgeCache')).not.toBeNull();
      expect(document.getElementById('purgeConfirmDialog')).not.toBeNull();
    });

    it('clicking user info pill toggles popover open and closed with aria-expanded update', () => {
      initProfilePopover();
      const userInfo = document.getElementById('userInfo')!;
      const popover = document.getElementById('userProfilePopover')!;

      expect(popover.classList.contains('hidden')).toBe(true);
      expect(isProfilePopoverOpen()).toBe(false);
      expect(userInfo.getAttribute('aria-expanded')).toBe('false');

      // Click to open
      userInfo.click();
      expect(popover.classList.contains('hidden')).toBe(false);
      expect(isProfilePopoverOpen()).toBe(true);
      expect(userInfo.getAttribute('aria-expanded')).toBe('true');

      // Click to close
      userInfo.click();
      expect(popover.classList.contains('hidden')).toBe(true);
      expect(isProfilePopoverOpen()).toBe(false);
      expect(userInfo.getAttribute('aria-expanded')).toBe('false');
    });

    it('populates username, marketplace domain, sync time, and order count in popover', () => {
      initProfilePopover();
      openProfilePopover();

      const userNameEl = document.getElementById('popoverUserName')!;
      const domainEl = document.getElementById('popoverDomain')!;
      const cacheTimeEl = document.getElementById('popoverCacheTime')!;
      const ordersCountEl = document.getElementById('popoverCacheOrdersCount')!;

      expect(userNameEl.textContent).toContain('shopee_user_vip');
      expect(domainEl.textContent).toContain('shopee.vn');
      expect(cacheTimeEl.textContent).not.toBe('');
      expect(ordersCountEl.textContent).toContain('1 đơn hàng');
    });

    it('closes popover when pressing Escape', () => {
      initProfilePopover();
      openProfilePopover();
      expect(isProfilePopoverOpen()).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(isProfilePopoverOpen()).toBe(false);
    });

    it('closes popover when clicking outside the popover container', () => {
      initProfilePopover();
      openProfilePopover();
      expect(isProfilePopoverOpen()).toBe(true);

      document.body.click();
      expect(isProfilePopoverOpen()).toBe(false);
    });

    it('triggering force re-sync calls refresh callback and closes popover', () => {
      const onResync = vi.fn();
      initProfilePopover({ onResync });
      openProfilePopover();

      const btnResync = document.getElementById('btnForceResync')!;
      btnResync.click();

      expect(onResync).toHaveBeenCalledTimes(1);
      expect(isProfilePopoverOpen()).toBe(false);
    });
  });

  describe('Seam 2: Cache Purge Behavior & UI State Transition', () => {
    it('purgeLocalCache clears storage, resets state to null, and transitions UI to noData', async () => {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(state.allOrdersData));
      expect(localStorage.getItem(STORAGE_KEYS.STATS)).not.toBeNull();

      initProfilePopover();
      const result = await purgeLocalCache();

      expect(result).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.STATS)).toBeNull();
      expect(state.allOrdersData).toBeNull();
      expect(state.filteredOrders).toEqual([]);

      const content = document.getElementById('content')!;
      const noData = document.getElementById('noData')!;
      const lastUpdated = document.getElementById('lastUpdated')!;

      const userInfo = document.getElementById('userInfo')!;

      expect(content.classList.contains('hidden')).toBe(true);
      expect(noData.classList.contains('hidden')).toBe(false);
      expect(lastUpdated.textContent).toBe('');
      expect(userInfo.classList.contains('hidden')).toBe(true);
    });

    it('confirmAndPurgeCache aborts if confirmation dialog is rejected', async () => {
      initProfilePopover();
      const purgeSpy = vi.fn();

      // Mock dialog cancellation
      const dialog = document.getElementById('purgeConfirmDialog') as HTMLDialogElement;
      if (dialog) {
        dialog.showModal = vi.fn();
        dialog.close = vi.fn();
      }

      const confirmPromise = confirmAndPurgeCache();

      // Trigger cancel button click
      const btnCancel = document.getElementById('btnCancelPurge')!;
      btnCancel.click();

      const confirmed = await confirmPromise;
      expect(confirmed).toBe(false);
      expect(state.allOrdersData).not.toBeNull();
    });

    it('confirmAndPurgeCache executes purgeLocalCache when user confirms in dialog', async () => {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(state.allOrdersData));
      initProfilePopover();

      const dialog = document.getElementById('purgeConfirmDialog') as HTMLDialogElement;
      if (dialog) {
        dialog.showModal = vi.fn();
        dialog.close = vi.fn();
      }

      const confirmPromise = confirmAndPurgeCache();

      // Trigger confirm button click
      const btnConfirm = document.getElementById('btnConfirmPurge')!;
      btnConfirm.click();

      const confirmed = await confirmPromise;
      expect(confirmed).toBe(true);
      expect(state.allOrdersData).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.STATS)).toBeNull();
    });

    it('supports window.confirm fallback when dialog.showModal is unavailable', async () => {
      initProfilePopover();

      const dialog = document.getElementById('purgeConfirmDialog')!;
      Object.defineProperty(dialog, 'showModal', { value: undefined, configurable: true, writable: true });

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      const confirmed = await confirmAndPurgeCache();
      expect(confirmSpy).toHaveBeenCalled();
      expect(confirmed).toBe(true);
      expect(state.allOrdersData).toBeNull();
    });
  });
});
