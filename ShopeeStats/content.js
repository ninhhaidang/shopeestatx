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

  async function getOrderDetail(orderId) {
    try {
      let url = `https://shopee.vn/api/v4/order/get_order_detail?order_id=${orderId}`;
      let json = await (await fetch(url)).json();
      return json.data;
    } catch (error) {
      console.error('Error fetching order detail:', error);
      return null;
    }
  }

  async function getOrders(offset, limit) {
    let url = "https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=" + limit + "&offset=" + offset;
    let json = await (await fetch(url)).json();
    let data = json.data?.order_data;

    if (data && data.details_list) {
      return data.details_list;
    }
    return [];
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
        const infoCard = item.info_card;
        const listType = item.list_type;

        let status = "Không rõ";
        switch (listType) {
          case 3: status = "Hoàn thành"; break;
          case 4: status = "Đã hủy"; break;
          case 7: status = "Vận chuyển"; break;
          case 8: status = "Đang giao"; break;
          case 9: status = "Chờ thanh toán"; break;
          case 12: status = "Trả hàng"; break;
        }

        const productCount = infoCard.product_count;
        count += productCount;

        let subTotal = infoCard.subtotal / 100000;
        if (listType !== 4 && listType !== 12) {
          sum += subTotal;
        } else {
          subTotal = 0;
        }

        const orderCard = infoCard.order_list_cards[0];
        const shopName = orderCard.shop_info.username + " - " + orderCard.shop_info.shop_name;
        const products = orderCard.product_info.item_groups;

        // Get order date from shipping.tracking_info.ctime (delivery/received time)
        let orderTime = 0;

        // Skip timestamp for cancelled orders (no delivery/received time)
        if (listType !== 4) {
          // Use shipping.tracking_info.ctime if available
          if (item.shipping && item.shipping.tracking_info && item.shipping.tracking_info.ctime) {
            orderTime = item.shipping.tracking_info.ctime;
          }
          // Fallback: try status.update_time
          else if (item.status && item.status.update_time) {
            orderTime = item.status.update_time;
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
          .map(g => g.items
            .map(i => `${i.name} (SL: ${i.amount}, Giá: ${_VietNamCurrency(i.item_price / 100000)})`)
            .join(', '))
          .join('; ');

        const name = products[0].items[0].name;

        allOrders.push({
          orderId: infoCard.order_id,
          name: name,
          productCount: productCount,
          subTotal: subTotal,
          subTotalFormatted: _VietNamCurrency(subTotal),
          status: status,
          statusCode: listType,
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
    console.error('Shopee Stats Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
})();
