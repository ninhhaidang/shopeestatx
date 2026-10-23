// This script runs in MAIN world (page context)
// Returns the fetched data directly

// Everything lives inside the IIFE: executeScript injects this file into the tab's shared
// global, and a top-level const/let redeclared on a second injection fails silently.
(async function () {
// Configuration - Domain setup
// This will be replaced by the actual domain at build time
const SHOPEE_DOMAIN = 'shopee.vn';
const MESSAGE_SOURCE = 'shopee-stats';

// Pacing and retry policy. Shopee caps a page at 20 orders, so speed comes from
// fewer or overlapping requests, never from a bigger page.
const PAGE_SIZE = 20;
const MAX_CONCURRENCY = 3;
const MIN_REQUEST_GAP_MS = 400;
const REQUEST_JITTER_MS = 200;
const RETRY_DELAYS_MS = [2000, 5000, 10000];
// Completed, cancelled, return/refund: orders in these states no longer change in practice.
const TERMINAL_STATUS_CODES = [3, 4, 12];

// Get user profile from localStorage
function getUserProfile() {
  try {
    // Try mini-session first (contains full user object with avatar)
    const miniSession = localStorage.getItem('mini-session');
    if (miniSession) {
      const parsed = JSON.parse(miniSession);
      if (parsed.user) {
        return {
          userId: parsed.user.id,
          uid: parsed.user.uid,
          username: parsed.user.name,
          name: parsed.user.name,
          avatar: parsed.user.avatar || '',
          shopId: parsed.user.shop_id
        };
      }
    }

    // Fallback: try @shopee/account-basic-info
    const accountInfo = localStorage.getItem('@shopee/account-basic-info');
    if (accountInfo) {
      const parsed = JSON.parse(accountInfo);
      return {
        username: parsed.username,
        avatar: parsed.portrait ? `https://cf.shopee.vn/file/${parsed.portrait}` : ''
      };
    }
  } catch (e) {
    console.error('Failed to get user profile:', e);
  }
  return null;
}

  function sendProgress(count) {
    window.postMessage({
      source: MESSAGE_SOURCE,
      type: 'progress',
      count: count
    }, '*');
  }

  function _VietNamCurrency(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
  }

  function failure(message, retriable) {
    const error = new Error(message);
    error.retriable = retriable;
    return error;
  }

  // One page of raw order entries. [] means the end of the history.
  async function getOrders(offset) {
    const url = "https://" + SHOPEE_DOMAIN + "/api/v4/order/get_all_order_and_checkout_list?limit=" + PAGE_SIZE + "&offset=" + offset;
    let response;
    try {
      response = await fetch(url);
    } catch (e) {
      throw failure(e && e.message ? e.message : 'Network error', true);
    }
    if (!response.ok) {
      throw failure(`Failed to fetch orders (HTTP ${response.status})`, response.status === 429 || response.status >= 500);
    }
    let json;
    try {
      json = await response.json();
    } catch (e) {
      throw failure('Invalid order response from Shopee', true);
    }
    if (json?.error) {
      throw failure(json.error_msg || `Shopee API error: ${json.error}`, true);
    }

    const orders = json?.new_data?.order_or_checkout_data
      ?? json?.data?.order_data?.details_list;
    // The final page omits the list and reports next_offset: -1.
    if (orders === undefined && json?.new_data?.next_offset === -1) {
      return [];
    }
    // An empty list ends pagination; a missing list is not a successful fetch.
    if (!Array.isArray(orders)) {
      throw failure('Invalid order response from Shopee', false);
    }
    return orders;
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Request starts are serialized through one chain, so no two requests start closer than the gap.
  let slotChain = Promise.resolve();
  let firstSlot = true;
  function waitForSlot() {
    const wait = firstSlot ? 0 : MIN_REQUEST_GAP_MS + Math.random() * REQUEST_JITTER_MS;
    firstSlot = false;
    slotChain = slotChain.then(() => (wait > 0 ? sleep(wait) : undefined));
    return slotChain;
  }

  async function requestPage(offset) {
    let lastError;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      await waitForSlot();
      try {
        return await getOrders(offset);
      } catch (error) {
        if (!error.retriable) throw error;
        lastError = error;
      }
    }
    throw lastError;
  }

  // Map status label string to status code and Vietnamese text
  // Actual labels from Shopee API: label_cancelled, label_to_ship, label_to_receive, 
  // label_return_refund_requested, label_completed
  function parseStatusLabel(statusLabel) {
    const label = (statusLabel || '').toLowerCase();

    // label_completed → Hoàn thành (must check before 'to_receive' since 'completed' contains no 'receive')
    if (label.includes('completed')) {
      return { code: 3, text: 'Hoàn thành' };
    }
    // label_cancelled → Đã hủy
    if (label.includes('cancelled') || label.includes('cancel')) {
      return { code: 4, text: 'Đã hủy' };
    }
    // label_to_ship → Chờ vận chuyển (seller preparing)
    if (label.includes('to_ship') || label.includes('preparing') || label.includes('process')) {
      return { code: 7, text: 'Chờ vận chuyển' };
    }
    // label_to_receive → Đang giao (in transit, waiting for customer to receive)
    if (label.includes('to_receive') || label.includes('shipping') || label.includes('transit') || label.includes('delivery')) {
      return { code: 8, text: 'Đang giao' };
    }
    // Chờ thanh toán
    if (label.includes('pay') || label.includes('unpaid')) {
      return { code: 9, text: 'Chờ thanh toán' };
    }
    // label_return_refund_requested → Trả hàng/Hoàn tiền
    if (label.includes('return') || label.includes('refund')) {
      return { code: 12, text: 'Trả hàng' };
    }

    return { code: 0, text: 'Không rõ' };
  }

  // Turns one raw entry into an order, or null when it has no usable order card.
  function parseOrder(item) {
    // NEW API: order data is wrapped in order_list_detail
    // OLD API: order data is directly on item
    const orderDetail = item.order_list_detail || item;
    const infoCard = orderDetail.info_card || item.info_card;

    if (!infoCard) return null; // Skip if no info_card

    // Parse status
    let statusCode;
    let statusText;

    // NEW API: status is a label string
    if (orderDetail.status?.list_view_status_label?.text) {
      const parsed = parseStatusLabel(orderDetail.status.list_view_status_label.text);
      statusCode = parsed.code;
      statusText = parsed.text;
    }
    // OLD API: status is a number (list_type)
    else if (item.list_type !== undefined) {
      statusCode = item.list_type;
      switch (statusCode) {
        case 3: statusText = "Hoàn thành"; break;
        case 4: statusText = "Đã hủy"; break;
        case 7: statusText = "Chờ vận chuyển"; break;
        case 8: statusText = "Đang giao"; break;
        case 9: statusText = "Chờ thanh toán"; break;
        case 12: statusText = "Trả hàng"; break;
        default: statusText = "Không rõ";
      }
    } else {
      statusCode = 0;
      statusText = "Không rõ";
    }

    const orderCard = infoCard.order_list_cards?.[0];
    if (!orderCard) return null; // Skip if no order card

    const productCount = infoCard.product_count || 0;

    let subTotal = (infoCard.subtotal ?? infoCard.final_total ?? 0) / 100000;
    if (statusCode === 4 || statusCode === 12) {
      subTotal = 0;
    }
    const shopInfo = orderCard.shop_info || {};
    const shopName = (shopInfo.username || '') + " - " + (shopInfo.shop_name || 'Unknown');

    // Include every parcel in split shipments, or the legacy product list.
    const products = orderCard.parcel_cards?.length
      ? orderCard.parcel_cards.flatMap(parcel => parcel.product_info?.item_groups || [])
      : (orderCard.product_info?.item_groups || []);

    // Get shipping and status info
    const shipping = orderDetail.shipping || item.shipping;
    const statusInfo = orderDetail.status || item.status;

    // Get order date from shipping.tracking_info.ctime (delivery/received time)
    let orderTime = 0;

    // Skip timestamp for cancelled orders (no delivery/received time)
    if (statusCode !== 4) {
      // Use shipping.tracking_info.ctime if available and non-zero
      if (shipping?.tracking_info?.ctime && shipping.tracking_info.ctime > 0) {
        orderTime = shipping.tracking_info.ctime;
      }
      // Fallback: try status.update_time
      else if (statusInfo?.update_time) {
        orderTime = statusInfo.update_time;
      }
      // Fallback: try to extract from order_id (first 10 digits might be timestamp)
      else if (infoCard.order_id) {
        const orderIdStr = String(infoCard.order_id);
        if (orderIdStr.length >= 10) {
          const possibleTimestamp = parseInt(orderIdStr.substring(0, 10));
          // Check if it's a reasonable timestamp (year >= 2020 and not in the future)
          const testDate = new Date(possibleTimestamp * 1000);
          if (testDate.getFullYear() >= 2020 && testDate.getTime() <= Date.now()) {
            orderTime = possibleTimestamp;
          }
        }
      }
    }

    const deliveryDate = orderTime ? new Date(orderTime * 1000) : null;

    const productSummary = products
      .map(g => (g.items || [])
        .map(i => `${i.name || 'N/A'} (SL: ${i.amount || 1}, Giá: ${_VietNamCurrency((i.item_price || 0) / 100000)})`)
        .join(', '))
      .join('; ');

    const name = products[0]?.items?.[0]?.name || 'Không có tên';

    const items = products.flatMap(g => (g.items || []).map(i => ({
      itemId: i.item_id ?? null,
      name: i.name || 'N/A',
      variation: i.model_name || '',
      quantity: i.amount || 1,
      unitPrice: (i.item_price || 0) / 100000
    })));

    return {
      orderId: infoCard.order_id,
      name: name,
      productCount: productCount,
      subTotal: subTotal,
      subTotalFormatted: _VietNamCurrency(subTotal),
      status: statusText,
      statusCode: statusCode,
      shopName: shopName,
      productSummary: productSummary,
      items: items,
      shopId: shopInfo.shop_id ?? null,
      parcelCount: shipping?.num_parcels ?? null,
      deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
      orderMonth: deliveryDate ? deliveryDate.getMonth() + 1 : null,
      orderYear: deliveryDate ? deliveryDate.getFullYear() : null
    };
  }

  function buildData(orders) {
    const count = orders.reduce((total, order) => total + order.productCount, 0);
    const sum = orders.reduce((total, order) => total + order.subTotal, 0);
    return {
      user: getUserProfile(),
      orders: orders,
      totalCount: count,
      totalAmount: sum,
      totalAmountFormatted: _VietNamCurrency(sum),
      fetchedAt: new Date().toISOString()
    };
  }

  // The caller (the dashboard) hands over its mode and cached orders by setting this
  // before injecting the script; without it the script does a full fetch.
  const request = (typeof window !== 'undefined' && window.shopeeStatXRequest) || {};
  const incremental = request.mode === 'incremental';
  const knownStatus = new Map((request.knownOrders || []).map(o => [String(o.orderId), o.statusCode]));

  function orderIdOf(item) {
    return (item.order_list_detail || item).info_card?.order_id ?? item.info_card?.order_id;
  }

  // A known order in a final state will not change, so a page of only those ends an incremental fetch.
  function isSettled(item) {
    const id = orderIdOf(item);
    return id !== undefined && TERMINAL_STATUS_CODES.includes(knownStatus.get(String(id)));
  }

  async function fetchSequentially() {
    const items = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      let page;
      try {
        page = await requestPage(offset);
      } catch (error) {
        return { items, failure: error };
      }
      if (page.length === 0) break;
      items.push(...page);
      sendProgress(items.length);
      if (incremental && page.every(isSettled)) break;
    }
    return { items, failure: null };
  }

  // Full history: up to MAX_CONCURRENCY pages in flight. The total is unknown up front, so workers
  // can claim up to MAX_CONCURRENCY - 1 pages past the end; those come back empty and are dropped.
  async function fetchConcurrently() {
    const pages = new Map();
    let nextOffset = 0;
    let endOffset = Infinity;
    let fetched = 0;
    let firstFailure = null;

    async function worker() {
      while (!firstFailure && nextOffset < endOffset) {
        const offset = nextOffset;
        nextOffset += PAGE_SIZE;
        let page;
        try {
          page = await requestPage(offset);
        } catch (error) {
          firstFailure = firstFailure || error;
          return;
        }
        if (page.length === 0) {
          endOffset = Math.min(endOffset, offset);
        } else {
          pages.set(offset, page);
          fetched += page.length;
          sendProgress(fetched);
        }
      }
    }

    await Promise.all(Array.from({ length: MAX_CONCURRENCY }, worker));
    const items = [...pages.entries()].sort((a, b) => a[0] - b[0]).flatMap(([, page]) => page);
    return { items, failure: firstFailure };
  }

  try {
    const { items, failure: fetchFailure } = incremental ? await fetchSequentially() : await fetchConcurrently();
    const orders = items.map(parseOrder).filter(Boolean);

    if (fetchFailure) {
      // Orders fetched before the failure are handed back so the caller can keep them.
      return {
        success: false,
        error: fetchFailure.message,
        ...(orders.length > 0 ? { partial: buildData(orders) } : {})
      };
    }

    return { success: true, data: buildData(orders) };
  } catch (error) {
    console.error('ShopeeStatX Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
})();
