/** ShopeeStatX/src/dashboard/drawer.ts — Slide-over Pro-Inspector Drawer Module */

import type { Order, OrderItem } from '../types/index.js';
import { state } from './state.js';
import { escapeHtml, showToast, formatCurrency } from './utils.js';
import { t } from '../i18n/index.js';
import { formatDateTime } from '../i18n/format.js';
import { getOrderUrl } from '../config.js';
import { applyFilters, handleDrillDown } from './filters.js';
import {
  ICON_CHECK_CIRCLE,
  ICON_X_CIRCLE,
  ICON_CLOCK,
  ICON_TRUCK,
  ICON_CREDIT_CARD,
  ICON_ARROW_UTURN_LEFT,
  ICON_QUESTION_MARK_CIRCLE,
} from './icons.js';

let currentOrderIndex: number = -1;
let currentOrder: Order | null = null;
let isOpen: boolean = false;
let keyListenerAttached: boolean = false;

/**
 * Ensures drawer markup exists in DOM (auto-injects if missing in test environments).
 */
export function ensureDrawerInDOM(): void {
  let backdrop = document.getElementById('drawerBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'drawerBackdrop';
    backdrop.className = 'drawer-backdrop';
    document.body.appendChild(backdrop);
  }

  let drawer = document.getElementById('orderDrawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'orderDrawer';
    drawer.className = 'drawer-panel';
    drawer.setAttribute('aria-label', 'Chi tiết đơn hàng');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-title-group">
          <span class="drawer-order-id" id="drawerOrderId">--</span>
          <button id="btnDrawerCopyId" class="btn-icon-drawer" title="Sao chép mã đơn" aria-label="Sao chép mã đơn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <a id="drawerShopeeLink" href="https://shopee.vn" target="_blank" class="btn-icon-drawer" title="Mở trang đơn hàng trên Shopee" aria-label="Mở trang đơn hàng trên Shopee">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
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
            <button type="button" id="btnDrawerFilterShop" class="btn-filter-shop" aria-label="Lọc đơn shop này">Lọc đơn shop này ➔</button>
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
    `;
    document.body.appendChild(drawer);
  }
}

/**
 * Parses items from a productSummary text string.
 * Example format: "Item Name (SL: 2, Giá: 150.000 ₫); Another (SL: 1)"
 */
export function parseOrderItems(summary: string, defaultName: string): OrderItem[] {
  if (!summary || !summary.trim()) {
    return [{ name: defaultName, quantity: 1 }];
  }

  const items: OrderItem[] = [];
  const parts = summary.split(/[;,]\s*(?=[^();,]*(?:\(SL:|$))/).map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^(.*?)\s*\(SL:\s*(\d+)(?:,\s*Gi[áa]:\s*([^)]+))?\)$/i);
    if (match) {
      const name = match[1].trim() || defaultName;
      const quantity = parseInt(match[2], 10) || 1;
      const priceFormatted = match[3] ? match[3].trim() : undefined;
      items.push({ name, quantity, priceFormatted });
    } else if (part) {
      items.push({ name: part, quantity: 1 });
    }
  }

  return items.length > 0 ? items : [{ name: defaultName, quantity: 1 }];
}

/**
 * Resolves the structured list of items for an order.
 */
export function getOrderItems(order: Order): OrderItem[] {
  if (order.items && order.items.length > 0) {
    return order.items;
  }
  if (order.productSummary) {
    return parseOrderItems(order.productSummary, order.name);
  }
  return [{ name: order.name, quantity: order.productCount || 1, priceFormatted: order.subTotalFormatted }];
}

function getStatusBadgeDetails(statusCode: number): { icon: string; statusClass: string } {
  let icon = ICON_QUESTION_MARK_CIRCLE;
  let statusClass = `status-${statusCode}`;

  switch (statusCode) {
    case 3:
      icon = ICON_CHECK_CIRCLE;
      statusClass += ' status-completed badge-completed';
      break;
    case 4:
      icon = ICON_X_CIRCLE;
      statusClass += ' status-cancelled badge-cancelled';
      break;
    case 7:
      icon = ICON_CLOCK;
      statusClass += ' status-shipping badge-shipping';
      break;
    case 8:
      icon = ICON_TRUCK;
      statusClass += ' status-shipping badge-shipping';
      break;
    case 9:
      icon = ICON_CREDIT_CARD;
      statusClass += ' status-pending';
      break;
    case 12:
      icon = ICON_ARROW_UTURN_LEFT;
      statusClass += ' status-return';
      break;
    default:
      icon = ICON_QUESTION_MARK_CIRCLE;
  }

  return { icon, statusClass };
}

/**
 * Renders the order details into the drawer DOM elements.
 */
function renderDrawerContent(order: Order, index: number): void {
  ensureDrawerInDOM();

  // 1. Order ID & Shopee Link
  const orderIdEl = document.getElementById('drawerOrderId');
  if (orderIdEl) orderIdEl.textContent = order.orderId;

  const linkEl = document.getElementById('drawerShopeeLink') as HTMLAnchorElement | null;
  if (linkEl) {
    linkEl.href = getOrderUrl(order.orderId);
    linkEl.target = '_blank';
  }

  // 2. Status Badge & Date
  const badgeEl = document.getElementById('drawerStatusBadge');
  if (badgeEl) {
    const { icon, statusClass } = getStatusBadgeDetails(order.statusCode);
    badgeEl.className = `status-badge ${statusClass}`;
    badgeEl.innerHTML = `${icon} <span>${escapeHtml(order.status)}</span>`;
  }

  const dateEl = document.getElementById('drawerDateText');
  if (dateEl) {
    if (order.deliveryDate) {
      dateEl.textContent = formatDateTime(new Date(order.deliveryDate));
      dateEl.classList.add('detail-value-clickable');
      dateEl.setAttribute('data-filter', 'date');
      const d = new Date(order.deliveryDate);
      dateEl.setAttribute('data-value', JSON.stringify({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }));
      dateEl.onclick = () => {
        closeDrawer();
        handleDrillDown({
          time: {
            kind: 'day',
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
          },
        });
      };
    } else if (order.orderPlacementDate) {
      dateEl.textContent = formatDateTime(new Date(order.orderPlacementDate));
      dateEl.onclick = null;
    } else {
      dateEl.textContent = t('table.noDate') || 'Không có ngày';
      dateEl.onclick = null;
    }
  }
  // 3. Seller Information
  const shopNameEl = document.getElementById('drawerShopName');
  if (shopNameEl) shopNameEl.textContent = order.shopName;

  const shopSubEl = document.getElementById('drawerShopSub');
  if (shopSubEl) {
    // If we have access to order count for this shop, display it
    const sameShopOrders = state.allOrdersData?.orders.filter(o => o.shopName === order.shopName).length || 1;
    shopSubEl.textContent = `${sameShopOrders} đơn đã mua tại cửa hàng này`;
  }

  // 4. Itemized Product List
  const items = getOrderItems(order);
  const itemCountEl = document.getElementById('drawerItemCount');
  if (itemCountEl) {
    itemCountEl.textContent = `${items.length} món`;
  }

  const itemListEl = document.getElementById('drawerItemList');
  if (itemListEl) {
    itemListEl.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'drawer-item-row';
      const priceText = item.priceFormatted
        || (item.price !== undefined ? formatCurrency(item.price) : '—');
      row.innerHTML = `
        <div class="drawer-item-info">
          <div class="drawer-item-name">${escapeHtml(item.name)}</div>
          <div class="drawer-item-qty">Số lượng: x${item.quantity || 1}</div>
        </div>
        <div class="drawer-item-price">${escapeHtml(priceText)}</div>
      `;
      itemListEl.appendChild(row);
    });
  }

  // 5. Payment Breakdown
  const subtotalEl = document.getElementById('drawerSubtotal');
  if (subtotalEl) {
    subtotalEl.textContent = order.subTotalFormatted || formatCurrency(order.subTotal || 0);
  }

  const shippingEl = document.getElementById('drawerShipping');
  if (shippingEl) {
    shippingEl.textContent = order.shippingFeeFormatted
      || (order.shippingFee !== undefined ? formatCurrency(order.shippingFee) : '0 ₫');
  }

  const discountEl = document.getElementById('drawerDiscount');
  if (discountEl) {
    discountEl.textContent = order.voucherDiscountFormatted
      || (order.voucherDiscount !== undefined ? formatCurrency(order.voucherDiscount) : '0 ₫');
  }

  const totalEl = document.getElementById('drawerTotal');
  if (totalEl) {
    if (order.shippingFee !== undefined || order.voucherDiscount !== undefined) {
      const computedTotal = (order.subTotal || 0) + (order.shippingFee || 0) - (order.voucherDiscount || 0);
      totalEl.textContent = formatCurrency(Math.max(0, computedTotal));
    } else {
      totalEl.textContent = order.subTotalFormatted || formatCurrency(order.subTotal || 0);
    }
  }

  // 6. Stepper buttons boundary states
  const totalOrders = state.filteredOrders.length;
  const prevBtn = document.getElementById('btnDrawerPrev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('btnDrawerNext') as HTMLButtonElement | null;

  if (prevBtn) {
    prevBtn.disabled = index <= 0;
  }
  if (nextBtn) {
    nextBtn.disabled = index >= totalOrders - 1;
  }
}

/**
 * Opens the drawer for a given order or index in state.filteredOrders.
 */
export function openDrawer(orderOrIndex: Order | number): void {
  ensureDrawerInDOM();

  let resolvedOrder: Order | null = null;
  let resolvedIndex: number = -1;

  if (typeof orderOrIndex === 'number') {
    resolvedIndex = orderOrIndex;
    resolvedOrder = state.filteredOrders[resolvedIndex] || null;
  } else {
    resolvedOrder = orderOrIndex;
    resolvedIndex = state.filteredOrders.findIndex(o => o.orderId === resolvedOrder!.orderId);
    if (resolvedIndex === -1 && state.filteredOrders.length > 0) {
      resolvedIndex = 0;
    }
  }

  if (!resolvedOrder) return;

  currentOrderIndex = resolvedIndex;
  currentOrder = resolvedOrder;
  isOpen = true;

  renderDrawerContent(resolvedOrder, resolvedIndex);

  const drawer = document.getElementById('orderDrawer');
  const backdrop = document.getElementById('drawerBackdrop');

  if (drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (backdrop) {
    backdrop.classList.add('active');
  }
}

/**
 * Closes the drawer and restores state.
 */
export function closeDrawer(): void {
  isOpen = false;
  currentOrder = null;
  currentOrderIndex = -1;

  const drawer = document.getElementById('orderDrawer');
  const backdrop = document.getElementById('drawerBackdrop');

  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (backdrop) {
    backdrop.classList.remove('active');
  }
}

/**
 * Steps backward (-1) or forward (+1) through consecutive orders in state.filteredOrders.
 */
export function stepDrawer(delta: -1 | 1): void {
  if (!isOpen || currentOrderIndex < 0) return;

  const newIndex = currentOrderIndex + delta;
  if (newIndex >= 0 && newIndex < state.filteredOrders.length) {
    openDrawer(newIndex);
  }
}

/**
 * Returns whether the drawer is currently open.
 */
export function isDrawerOpen(): boolean {
  return isOpen;
}

/**
 * Returns the currently inspected Order, or null if closed.
 */
export function getCurrentDrawerOrder(): Order | null {
  return currentOrder;
}

/**
 * 1-click clipboard copy of current Order ID with visual toast notification.
 */
export function copyDrawerOrderId(): void {
  const idEl = document.getElementById('drawerOrderId');
  const orderId = currentOrder?.orderId || idEl?.textContent || '';
  if (!orderId || orderId === '--') return;

  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(orderId).catch(err => {
      console.error('Failed to copy order ID:', err);
    });
  }

  const copyBtn = document.getElementById('btnDrawerCopyId');
  if (copyBtn) {
    copyBtn.classList.add('copied');
    setTimeout(() => copyBtn.classList.remove('copied'), 1500);
  }

  showToast(`Đã sao chép mã đơn: ${orderId}`);
}

/**
 * Filters the order list by the current drawer order's shop name and closes the drawer.
 */
export function filterShopFromDrawer(): void {
  const shopName = currentOrder?.shopName || document.getElementById('drawerShopName')?.textContent;
  closeDrawer();
  if (shopName) {
    const searchBox = document.getElementById('searchBox') as HTMLInputElement | null;
    if (searchBox) {
      searchBox.value = shopName;
    }
    state.currentPage = 1;
    applyFilters();
  }
}

/**
 * Global keyboard handler for drawer navigation (Escape, ArrowUp, ArrowDown).
 */
function handleKeyDown(e: KeyboardEvent): void {
  if (!isOpen) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeDrawer();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    stepDrawer(-1);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    stepDrawer(1);
  }
}

/**
 * Initializes drawer event bindings on backdrop, controls, buttons, and keyboard.
 */
export function initDrawer(): void {
  ensureDrawerInDOM();

  const backdrop = document.getElementById('drawerBackdrop');
  if (backdrop && !backdrop.dataset.bound) {
    backdrop.addEventListener('click', closeDrawer);
    backdrop.dataset.bound = 'true';
  }

  const closeBtn = document.getElementById('btnDrawerClose');
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.addEventListener('click', closeDrawer);
    closeBtn.dataset.bound = 'true';
  }

  const copyBtn = document.getElementById('btnDrawerCopyId');
  if (copyBtn && !copyBtn.dataset.bound) {
    copyBtn.addEventListener('click', copyDrawerOrderId);
    copyBtn.dataset.bound = 'true';
  }

  const prevBtn = document.getElementById('btnDrawerPrev');
  if (prevBtn && !prevBtn.dataset.bound) {
    prevBtn.addEventListener('click', () => stepDrawer(-1));
    prevBtn.dataset.bound = 'true';
  }

  const nextBtn = document.getElementById('btnDrawerNext');
  if (nextBtn && !nextBtn.dataset.bound) {
    nextBtn.addEventListener('click', () => stepDrawer(1));
    nextBtn.dataset.bound = 'true';
  }

  const filterShopBtn = document.getElementById('btnDrawerFilterShop');
  if (filterShopBtn && !filterShopBtn.dataset.bound) {
    filterShopBtn.addEventListener('click', filterShopFromDrawer);
    filterShopBtn.dataset.bound = 'true';
  }

  if (!keyListenerAttached) {
    window.addEventListener('keydown', handleKeyDown);
    keyListenerAttached = true;
  }
}
