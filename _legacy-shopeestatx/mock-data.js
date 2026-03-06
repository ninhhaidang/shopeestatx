// ShopeeStatX/mock-data.js
// Dữ liệu mẫu để preview UI khi chạy ngoài Chrome Extension context (localhost)

function formatVND(number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

const shops = [
  'techshop_vn - TechShop Việt Nam',
  'fashionista.vn - Fashionista Store',
  'bookworm_official - BookWorm Official',
  'giadung247 - Gia Dụng 247',
  'sportzone.vn - Sport Zone Việt Nam',
  'beautybox_official - BeautyBox Official',
  'phonecity.vn - Phone City',
  'snackhouse - Snack House VN',
  'babymart_vn - BabyMart Việt Nam',
  'petlove.official - PetLove Official'
];

const products = [
  { name: 'Tai nghe Bluetooth TWS không dây chống ồn ANC', price: 450000, count: 1 },
  { name: 'Áo thun nam cotton oversize form rộng', price: 189000, count: 2 },
  { name: 'Sách "Nhà Giả Kim" - Paulo Coelho (Bản đặc biệt)', price: 75000, count: 1 },
  { name: 'Nồi chiên không dầu 6L đa năng', price: 1290000, count: 1 },
  { name: 'Giày chạy bộ nam siêu nhẹ thoáng khí', price: 650000, count: 1 },
  { name: 'Serum Vitamin C dưỡng trắng da 30ml', price: 320000, count: 1 },
  { name: 'Ốp lưng iPhone 15 Pro Max silicon trong suốt', price: 59000, count: 3 },
  { name: 'Bộ snack mix hạt dinh dưỡng 500g', price: 145000, count: 2 },
  { name: 'Bỉm dán Huggies size M 60 miếng', price: 285000, count: 1 },
  { name: 'Thức ăn cho mèo Royal Canin 2kg', price: 395000, count: 1 },
  { name: 'Chuột gaming không dây RGB 16000DPI', price: 520000, count: 1 },
  { name: 'Váy đầm nữ hoa nhí vintage retro', price: 275000, count: 1 },
  { name: 'Bộ truyện Doraemon tập 1-10', price: 180000, count: 1 },
  { name: 'Máy xay sinh tố cầm tay mini USB', price: 350000, count: 1 },
  { name: 'Balo thể thao chống nước 40L', price: 420000, count: 1 },
  { name: 'Kem chống nắng SPF50+ PA++++ 50ml', price: 235000, count: 2 },
  { name: 'Sạc nhanh 65W GaN Type-C PD', price: 380000, count: 1 },
  { name: 'Bánh tráng trộn Tây Ninh combo 5 bịch', price: 95000, count: 3 },
  { name: 'Xe đẩy em bé gấp gọn siêu nhẹ', price: 2450000, count: 1 },
  { name: 'Vòng cổ cho chó mèo có chuông', price: 45000, count: 2 },
  { name: 'Laptop Stand nhôm nguyên khối tản nhiệt', price: 590000, count: 1 },
  { name: 'Quần jean nam slim fit co giãn', price: 349000, count: 1 },
  { name: 'Đèn bàn LED chống cận mắt', price: 265000, count: 1 },
  { name: 'Bộ nồi inox 5 đáy Fivestar', price: 1850000, count: 1 },
  { name: 'Dép Adidas Adilette Comfort', price: 750000, count: 1 },
  { name: 'Mặt nạ giấy Hàn Quốc hộp 30 miếng', price: 210000, count: 1 },
  { name: 'Cáp sạc iPhone Lightning to USB-C 2m', price: 120000, count: 2 },
  { name: 'Khô gà lá chanh Bến Tre 500g', price: 165000, count: 1 },
  { name: 'Ghế ăn dặm cho bé có đệm', price: 890000, count: 1 },
  { name: 'Cát vệ sinh cho mèo tofu 6L', price: 135000, count: 2 },
  { name: 'Điện thoại Samsung Galaxy A15 128GB', price: 4490000, count: 1 },
  { name: 'Áo khoác gió nữ 2 lớp chống nước', price: 395000, count: 1 },
  { name: 'Tủ nhựa ghép 12 ô đa năng', price: 450000, count: 1 },
  { name: 'Bàn phím cơ gaming RGB hot-swap', price: 890000, count: 1 },
  { name: 'Son môi MAC Matte Lipstick', price: 480000, count: 1 },
  { name: 'Pin sạc dự phòng 20000mAh PD 65W', price: 690000, count: 1 },
  { name: 'Combo 10 gói mì Hảo Hảo tôm chua cay', price: 38000, count: 5 },
  { name: 'Bình sữa Pigeon cổ rộng 240ml', price: 195000, count: 2 },
  { name: 'Máy lọc không khí và khử mùi cho thú cưng', price: 1250000, count: 1 },
  { name: 'iPad Air M2 11 inch 128GB WiFi', price: 15990000, count: 1 },
];

const statuses = [
  { code: 3, text: 'Hoàn thành' },
  { code: 3, text: 'Hoàn thành' },
  { code: 3, text: 'Hoàn thành' },
  { code: 3, text: 'Hoàn thành' },
  { code: 3, text: 'Hoàn thành' },
  { code: 3, text: 'Hoàn thành' },
  { code: 4, text: 'Đã hủy' },
  { code: 8, text: 'Đang giao' },
  { code: 7, text: 'Chờ vận chuyển' },
  { code: 12, text: 'Trả hàng' },
];

function generateOrders() {
  const orders = [];
  let totalCount = 0;
  let totalAmount = 0;

  // Generate orders spanning 2024-01 to 2026-02
  const startDate = new Date(2024, 0, 5);
  const endDate = new Date(2026, 1, 20);

  for (let i = 0; i < 40; i++) {
    const product = products[i % products.length];
    const shop = shops[i % shops.length];
    const statusInfo = statuses[i % statuses.length];

    // Spread dates across the range
    const timeFraction = i / 39;
    const orderTimestamp = new Date(
      startDate.getTime() + timeFraction * (endDate.getTime() - startDate.getTime())
    );
    // Add some randomness (± 5 days)
    orderTimestamp.setDate(orderTimestamp.getDate() + Math.floor(Math.random() * 10) - 5);

    const deliveryDate = statusInfo.code === 4 ? null : orderTimestamp.toISOString();
    const orderMonth = deliveryDate ? orderTimestamp.getMonth() + 1 : null;
    const orderYear = deliveryDate ? orderTimestamp.getFullYear() : null;

    const subTotal = statusInfo.code === 4 || statusInfo.code === 12 ? 0 : product.price;

    const orderId = 2400000000000000 + i * 1000000 + Math.floor(Math.random() * 999999);

    const productSummary = `${product.name} (SL: ${product.count}, Giá: ${formatVND(product.price)})`;

    orders.push({
      orderId,
      name: product.name,
      productCount: product.count,
      subTotal,
      subTotalFormatted: formatVND(subTotal),
      status: statusInfo.text,
      statusCode: statusInfo.code,
      shopName: shop,
      productSummary,
      deliveryDate,
      orderMonth,
      orderYear,
    });

    totalCount += product.count;
    if (statusInfo.code !== 4 && statusInfo.code !== 12) {
      totalAmount += product.price;
    }
  }

  return { orders, totalCount, totalAmount };
}

const { orders, totalCount, totalAmount } = generateOrders();

export const mockData = {
  orders,
  totalCount,
  totalAmount,
  totalAmountFormatted: formatVND(totalAmount),
  fetchedAt: new Date().toISOString(),
  cachedAt: new Date().toISOString(),
};
