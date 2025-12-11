// This script runs in MAIN world (page context)
// Returns the fetched data directly

(async function() {
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
      console.log(`Shopee Stats: Fetched ${data.length} orders at offset ${offset}`);
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

        const productSummary = products
          .map(g => g.items
            .map(i => `${i.name} (SL: ${i.amount}, Giá: ${_VietNamCurrency(i.item_price / 100000)})`)
            .join(', '))
          .join('; ');

        const name = products[0].items[0].name;

        allOrders.push({
          name: name,
          productCount: productCount,
          subTotal: subTotal,
          subTotalFormatted: _VietNamCurrency(subTotal),
          status: status,
          statusCode: listType,
          shopName: shopName,
          productSummary: productSummary
        });
      }

      offset += limit;
    }

    console.log(`Shopee Stats: Done! Total ${allOrders.length} orders`);

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
