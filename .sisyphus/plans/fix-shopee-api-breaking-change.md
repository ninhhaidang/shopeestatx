# Fix Shopee API Breaking Change

## TL;DR

> **Mục tiêu**: Fix extension không lấy được dữ liệu do Shopee đổi API structure
> 
> **Deliverables**:
> - `ShopeeStats/content.js` - Updated để hỗ trợ API mới
> 
> **Estimated Effort**: Quick
> **Root Cause**: Shopee thay đổi API response structure từ `data.order_data.details_list` sang `new_data.order_or_checkout_data`

---

## Context

### Bug Report
- Extension hiện "Đang kết nối với Shopee..." rồi nhảy thẳng vào dashboard trống
- Không có đơn hàng nào được hiển thị
- Trước đây hoạt động bình thường

### Root Cause Analysis
Shopee đã thay đổi API response structure hoàn toàn:

| Field | OLD (code expects) | NEW (actual) |
|-------|-------------------|--------------|
| Order list | `data.order_data.details_list[]` | `new_data.order_or_checkout_data[]` |
| Order detail | `item.info_card` | `item.order_list_detail.info_card` |
| Status | `item.list_type` (number: 3,4,7,8,9,12) | `status.list_view_status_label.text` (string: "label_to_ship", etc.) |
| Products | `orderCard.product_info.item_groups` | `orderCard.parcel_cards[0].product_info.item_groups` |
| Shipping | `item.shipping` | `item.order_list_detail.shipping` |

### Evidence
```javascript
// API call result:
{
  error: 0,
  error_msg: '',
  new_data: {
    order_or_checkout_data: [{
      order_list_detail: {
        status: { list_view_status_label: { text: "label_to_ship" } },
        shipping: { tracking_info: { ctime: 0 } },
        info_card: {
          order_id: 223894103289638,
          product_count: 1,
          subtotal: 5800000000,
          order_list_cards: [{
            shop_info: { username: "geeksneaker1", shop_name: "MrGeek" },
            parcel_cards: [{
              product_info: {
                item_groups: [{ items: [...] }]
              }
            }]
          }]
        }
      }
    }]
  }
}
```

---

## Work Objectives

### Core Objective
Cập nhật `content.js` để hỗ trợ cả API cũ và mới của Shopee.

### Concrete Deliverables
- `ShopeeStats/content.js` - Updated với backward-compatible parsing

### Definition of Done
- [x] Extension fetch được dữ liệu từ API mới
- [x] Backward compatible với API cũ (nếu Shopee rollback)
- [x] Status mapping từ string labels sang codes
- [x] Products parsing từ `parcel_cards[0]`

---

## TODOs

- [x] 1. Update content.js để hỗ trợ Shopee API mới

  **What to do**:
  Replace toàn bộ nội dung `ShopeeStats/content.js` với code sau:

  ```javascript
  // This script runs in MAIN world (page context)
  // Returns the fetched data directly

  (async function () {
    function sendProgress(count) {
      window.postMessage({
        source: 'shopee-stats',
        type: 'progress',
        count: count
      }, '*');
    }

    function _VietNamCurrency(number) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
    }

    async function getOrders(offset, limit) {
      let url = "https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=" + limit + "&offset=" + offset;
      let json = await (await fetch(url)).json();

      // NEW API structure (2024+): data is in new_data.order_or_checkout_data
      if (json.new_data?.order_or_checkout_data) {
        return json.new_data.order_or_checkout_data;
      }

      // OLD API structure (fallback): data is in data.order_data.details_list
      if (json.data?.order_data?.details_list) {
        return json.data.order_data.details_list;
      }

      return [];
    }

    // Map status label string to status code and Vietnamese text
    function parseStatusLabel(statusLabel) {
      const label = (statusLabel || '').toLowerCase();

      if (label.includes('completed') || label.includes('received')) {
        return { code: 3, text: 'Hoàn thành' };
      }
      if (label.includes('cancelled') || label.includes('cancel')) {
        return { code: 4, text: 'Đã hủy' };
      }
      if (label.includes('to_ship') || label.includes('preparing') || label.includes('process')) {
        return { code: 7, text: 'Chờ vận chuyển' };
      }
      if (label.includes('shipping') || label.includes('transit') || label.includes('delivery')) {
        return { code: 8, text: 'Đang giao' };
      }
      if (label.includes('pay') || label.includes('unpaid')) {
        return { code: 9, text: 'Chờ thanh toán' };
      }
      if (label.includes('return') || label.includes('refund')) {
        return { code: 12, text: 'Trả hàng' };
      }

      return { code: 0, text: 'Không rõ' };
    }

    const limit = 20;
    let offset = 0;
    let count = 0;
    let sum = 0;
    let allOrders = [];

    try {
      while (true) {
        let data = await getOrders(offset, limit);
        sendProgress(allOrders.length + data.length);

        if (data.length === 0) break;

        for (const item of data) {
          // NEW API: order data is wrapped in order_list_detail
          // OLD API: order data is directly on item
          const orderDetail = item.order_list_detail || item;
          const infoCard = orderDetail.info_card || item.info_card;

          if (!infoCard) continue; // Skip if no info_card

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
              case 7: statusText = "Vận chuyển"; break;
              case 8: statusText = "Đang giao"; break;
              case 9: statusText = "Chờ thanh toán"; break;
              case 12: statusText = "Trả hàng"; break;
              default: statusText = "Không rõ";
            }
          } else {
            statusCode = 0;
            statusText = "Không rõ";
          }

          const productCount = infoCard.product_count || 0;
          count += productCount;

          let subTotal = (infoCard.subtotal || infoCard.final_total || 0) / 100000;
          if (statusCode !== 4 && statusCode !== 12) {
            sum += subTotal;
          } else {
            subTotal = 0;
          }

          const orderCard = infoCard.order_list_cards?.[0];
          if (!orderCard) continue; // Skip if no order card

          const shopInfo = orderCard.shop_info || {};
          const shopName = (shopInfo.username || '') + " - " + (shopInfo.shop_name || 'Unknown');

          // NEW API: products are in parcel_cards[0].product_info.item_groups
          // OLD API: products are in product_info.item_groups
          const products = orderCard.parcel_cards?.[0]?.product_info?.item_groups
            || orderCard.product_info?.item_groups
            || [];

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
                // Check if it's a reasonable timestamp (year 2020-2030)
                const testDate = new Date(possibleTimestamp * 1000);
                if (testDate.getFullYear() >= 2020 && testDate.getFullYear() <= 2030) {
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

          allOrders.push({
            orderId: infoCard.order_id,
            name: name,
            productCount: productCount,
            subTotal: subTotal,
            subTotalFormatted: _VietNamCurrency(subTotal),
            status: statusText,
            statusCode: statusCode,
            shopName: shopName,
            productSummary: productSummary,
            deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
            orderMonth: deliveryDate ? deliveryDate.getMonth() + 1 : null,
            orderYear: deliveryDate ? deliveryDate.getFullYear() : null
          });
        }

        offset += limit;
      }

      return {
        success: true,
        data: {
          orders: allOrders,
          totalCount: count,
          totalAmount: sum,
          totalAmountFormatted: _VietNamCurrency(sum),
          fetchedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('ShopeeStatX Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })();
  ```

  **Must NOT do**:
  - Không thay đổi logic tính tổng tiền (exclude cancelled/returned)
  - Không thay đổi currency division (/ 100000)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **References**:
  - `ShopeeStats/content.js` - File cần update
  - API response structure đã được document ở trên

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Extension fetches orders successfully
    Tool: Manual test in browser
    Steps:
      1. Load extension vào Chrome (chrome://extensions → Load unpacked)
      2. Mở shopee.vn và đăng nhập
      3. Click icon extension → "Bắt đầu phân tích"
      4. Verify: Dashboard hiển thị với dữ liệu đơn hàng
    Expected Result: Danh sách đơn hàng được hiển thị
  ```

  **Commit**: YES
  - Message: `fix: update content.js to support new Shopee API structure`
  - Files: `ShopeeStats/content.js`

---

## Changes Summary

### Key Changes in content.js

1. **getOrders()**: Check `new_data.order_or_checkout_data` first, fallback to old structure
2. **parseStatusLabel()**: New function to map string labels to status codes
3. **Order parsing**: Handle `item.order_list_detail` wrapper
4. **Products parsing**: Check `parcel_cards[0].product_info` first
5. **Defensive coding**: Added null checks throughout

### Backward Compatibility
Code vẫn hỗ trợ API cũ nếu Shopee rollback:
- Fallback trong `getOrders()` 
- Fallback `item.list_type` for status
- Fallback `orderCard.product_info` for products

---

## Success Criteria

### Verification
1. Mở extension trên shopee.vn
2. Click "Bắt đầu phân tích"
3. Dashboard phải hiển thị danh sách đơn hàng
4. Charts và filters phải hoạt động bình thường

### Final Checklist
- [ ] Extension fetch được data từ API mới
- [ ] Status được parse đúng (Hoàn thành, Đang giao, etc.)
- [ ] Tổng tiền được tính đúng
- [ ] Backward compatible với API cũ
