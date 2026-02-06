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
