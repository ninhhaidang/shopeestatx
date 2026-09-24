/**
 * ShopeeStatX — User Profile & Cache Popover Module
 * Handles user account presentation, marketplace domain metadata,
 * cache sync timestamps, force re-sync triggering, and local cache purging.
 */

import { state } from './state.js';
import { STORAGE_KEYS, getActiveDomainUrl } from '../config.js';
import { formatDateTime } from '../i18n/format.js';
import { showToast, escapeHtml } from './utils.js';
import { refreshData, fetchDataFromShopee, isExtensionContext } from './data.js';

export interface ProfilePopoverOptions {
  onResync?: () => void;
  onPurged?: () => void;
}

let _options: ProfilePopoverOptions = {};
let _isInitialized = false;

/**
 * Checks whether the profile popover is currently visible.
 */
export function isProfilePopoverOpen(): boolean {
  if (typeof document === 'undefined') return false;
  const popover = document.getElementById('userProfilePopover');
  return !!popover && !popover.classList.contains('hidden');
}

/**
 * Ensures the popover container, trigger attributes, and confirmation dialog
 * are injected into the DOM if they are not already present.
 */
export function ensureProfilePopoverInDOM(): void {
  if (typeof document === 'undefined') return;

  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    if (!userInfo.getAttribute('role')) {
      userInfo.setAttribute('role', 'button');
    }
    if (!userInfo.getAttribute('tabindex')) {
      userInfo.setAttribute('tabindex', '0');
    }
    if (!userInfo.hasAttribute('aria-expanded')) {
      userInfo.setAttribute('aria-expanded', 'false');
    }
    userInfo.setAttribute('aria-controls', 'userProfilePopover');
    userInfo.setAttribute('aria-haspopup', 'dialog');
  }

  let popover = document.getElementById('userProfilePopover');
  if (!popover) {
    popover = document.createElement('div');
    popover.id = 'userProfilePopover';
    popover.className = 'user-profile-popover hidden';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Thông tin tài khoản và bộ nhớ tạm');

    popover.innerHTML = `
      <div class="popover-arrow"></div>
      <div class="popover-header">
        <img id="popoverUserAvatar" class="popover-avatar" src="" alt="Avatar" />
        <div class="popover-user-meta">
          <div id="popoverUserName" class="popover-username">--</div>
          <div class="popover-domain-row">
            <span class="popover-domain-label">Thị trường:</span>
            <span id="popoverDomain" class="popover-domain-badge">${escapeHtml(getActiveDomainUrl())}</span>
          </div>
        </div>
      </div>
      <div class="popover-divider"></div>
      <div class="popover-cache-section">
        <div class="popover-section-title">Trạng thái bộ nhớ tạm (Cache)</div>
        <div class="cache-info-row">
          <span class="cache-info-label">Đồng bộ gần nhất:</span>
          <span id="popoverCacheTime" class="cache-info-value">--</span>
        </div>
        <div class="cache-info-row">
          <span class="cache-info-label">Đơn hàng trong cache:</span>
          <span id="popoverCacheOrdersCount" class="cache-info-value">0 đơn hàng</span>
        </div>
      </div>
      <div class="popover-divider"></div>
      <div class="popover-actions">
        <button id="btnForceResync" class="btn-popover-resync" title="Đồng bộ lại từ Shopee">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/>
          </svg>
          <span>Đồng bộ lại dữ liệu</span>
        </button>
        <button id="btnPurgeCache" class="btn-popover-purge" title="Xóa toàn bộ dữ liệu đơn hàng trong bộ nhớ tạm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
          </svg>
          <span>Xóa bộ nhớ tạm</span>
        </button>
      </div>
    `;

    // Append to container or near userInfo or body
    const userContainer = userInfo?.closest('.user-profile-container') || userInfo?.parentElement || document.body;
    userContainer.appendChild(popover);
  }

  // Ensure purge confirmation dialog exists
  let dialog = document.getElementById('purgeConfirmDialog') as HTMLDialogElement | null;
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'purgeConfirmDialog';
    dialog.className = 'purge-dialog';
    dialog.innerHTML = `
      <div class="purge-dialog-content">
        <div class="purge-dialog-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 class="purge-dialog-title">Xác nhận xóa bộ nhớ tạm</h3>
        <p class="purge-dialog-message">
          Bạn có chắc chắn muốn xóa toàn bộ dữ liệu đơn hàng đã lưu trong bộ nhớ tạm?
          Dữ liệu hiện tại sẽ bị xóa và bạn sẽ cần đồng bộ lại từ Shopee để xem phân tích.
        </p>
        <div class="purge-dialog-actions">
          <button id="btnCancelPurge" class="btn-dialog-cancel" type="button">Hủy bỏ</button>
          <button id="btnConfirmPurge" class="btn-dialog-confirm" type="button">Xóa bộ nhớ</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
  }
}

/**
 * Synchronizes popover DOM elements with current state and config.
 */
export function updateProfilePopoverUI(): void {
  if (typeof document === 'undefined') return;

  const data = state.allOrdersData;
  const user = data?.user;

  const avatarEl = document.getElementById('popoverUserAvatar') as HTMLImageElement | null;
  const userNameEl = document.getElementById('popoverUserName');
  const domainEl = document.getElementById('popoverDomain');
  const cacheTimeEl = document.getElementById('popoverCacheTime');
  const ordersCountEl = document.getElementById('popoverCacheOrdersCount');

  if (avatarEl) {
    if (user?.avatar) {
      avatarEl.src = user.avatar;
      avatarEl.classList.remove('hidden');
    } else {
      avatarEl.classList.add('hidden');
    }
  }

  if (userNameEl) {
    userNameEl.textContent = user?.username ? `@${user.username}` : (user?.name || 'Khách');
  }

  if (domainEl) {
    domainEl.textContent = getActiveDomainUrl();
  }

  if (cacheTimeEl) {
    const timestamp = data?.cachedAt || data?.fetchedAt;
    if (timestamp) {
      try {
        cacheTimeEl.textContent = formatDateTime(new Date(timestamp));
      } catch {
        cacheTimeEl.textContent = new Date(timestamp).toLocaleString('vi-VN');
      }
    } else {
      cacheTimeEl.textContent = 'Chưa lưu bộ nhớ tạm';
    }
  }

  if (ordersCountEl) {
    const count = data?.totalCount ?? data?.orders?.length ?? 0;
    ordersCountEl.textContent = `${count} đơn hàng`;
  }
}

/**
 * Opens the profile popover and updates its contents.
 */
export function openProfilePopover(): void {
  ensureProfilePopoverInDOM();
  const popover = document.getElementById('userProfilePopover');
  const userInfo = document.getElementById('userInfo');

  if (popover) {
    popover.classList.remove('hidden');
    userInfo?.setAttribute('aria-expanded', 'true');
    updateProfilePopoverUI();
  }
}

/**
 * Closes the profile popover.
 */
export function closeProfilePopover(): void {
  if (typeof document === 'undefined') return;
  const popover = document.getElementById('userProfilePopover');
  const userInfo = document.getElementById('userInfo');

  if (popover) {
    popover.classList.add('hidden');
    userInfo?.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Toggles the profile popover open or closed.
 */
export function toggleProfilePopover(): void {
  if (isProfilePopoverOpen()) {
    closeProfilePopover();
  } else {
    openProfilePopover();
  }
}

/**
 * Purges the cached order data from Chrome storage / localStorage,
 * resets dashboard application state, and transitions the UI to the empty/noData state.
 */
export async function purgeLocalCache(): Promise<boolean> {
  // 1. Purge from chrome.storage.local if available
  if (isExtensionContext() && typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.remove([STORAGE_KEYS.STATS], () => resolve());
    });
  }

  // 2. Purge from localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.STATS);
  }

  // 3. Reset application state
  state.allOrdersData = null;
  state.filteredOrders = [];
  state.currentPage = 1;

  // 4. Update UI elements
  if (typeof document !== 'undefined') {
    const content = document.getElementById('content');
    const noData = document.getElementById('noData');
    const lastUpdated = document.getElementById('lastUpdated');
    const fetchedAt = document.getElementById('fetchedAt');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar') as HTMLImageElement | null;
    const userName = document.getElementById('userName');

    if (content) content.classList.add('hidden');
    if (noData) noData.classList.remove('hidden');
    if (lastUpdated) lastUpdated.textContent = '';
    if (fetchedAt) fetchedAt.textContent = '';
    if (userInfo) userInfo.classList.add('hidden');
    if (userAvatar) userAvatar.src = '';
    if (userName) userName.textContent = '';

    closeProfilePopover();
    showToast('Đã xóa bộ nhớ tạm thành công');
  }

  // 5. Notify callback
  if (_options.onPurged) {
    _options.onPurged();
  }

  return true;
}

/**
 * Prompts the user with a confirmation dialog before purging the local cache.
 * Resolves true if confirmed and purged, or false if rejected/cancelled.
 */
export async function confirmAndPurgeCache(): Promise<boolean> {
  ensureProfilePopoverInDOM();
  const dialog = document.getElementById('purgeConfirmDialog') as HTMLDialogElement | null;

  // Fallback to window.confirm if dialog or showModal is unavailable
  if (!dialog || typeof dialog.showModal !== 'function') {
    const agreed = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm('Bạn có chắc chắn muốn xóa bộ nhớ tạm không? Thao tác này sẽ xóa toàn bộ đơn hàng đã lưu.')
      : true;

    if (agreed) {
      return await purgeLocalCache();
    }
    return false;
  }

  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const cleanup = () => {
      btnCancel?.removeEventListener('click', onCancel);
      btnConfirm?.removeEventListener('click', onConfirm);
      dialog.removeEventListener('close', onClose);
    };

    const finish = (result: boolean) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      if (dialog.open) {
        dialog.close();
      }
      resolve(result);
    };

    const onCancel = () => finish(false);
    const onConfirm = async () => {
      await purgeLocalCache();
      finish(true);
    };
    const onClose = () => finish(false);

    const btnCancel = document.getElementById('btnCancelPurge');
    const btnConfirm = document.getElementById('btnConfirmPurge');

    btnCancel?.addEventListener('click', onCancel);
    btnConfirm?.addEventListener('click', onConfirm);
    dialog.addEventListener('close', onClose, { once: true });

    dialog.showModal();
  });
}

/**
 * Initializes profile popover triggers, keyboard listeners, outside-click handlers,
 * force re-sync, and purge cache bindings.
 */
export function initProfilePopover(options: ProfilePopoverOptions = {}): void {
  _options = options;
  ensureProfilePopoverInDOM();

  if (_isInitialized) return;
  _isInitialized = true;

  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    userInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleProfilePopover();
    });

    userInfo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleProfilePopover();
      }
    });
  }

  // Force re-sync button
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#btnForceResync')) {
      closeProfilePopover();
      if (_options.onResync) {
        _options.onResync();
      } else if (isExtensionContext()) {
        fetchDataFromShopee();
      } else {
        refreshData();
      }
    }
  });

  // Purge cache button
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#btnPurgeCache')) {
      confirmAndPurgeCache();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (
      !target.closest('#userProfilePopover') &&
      !target.closest('#userInfo') &&
      !target.closest('#purgeConfirmDialog')
    ) {
      closeProfilePopover();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isProfilePopoverOpen()) {
        closeProfilePopover();
      }
    }
  });
}
