// Mock data for preview/development outside Chrome Extension context
import type { CategoryMap, Order, OrderData, StatusCode } from '../types/index.js';
import { formatVND } from './utils.js';

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
  'petlove.official - PetLove Official',
];

const products = [
  { name: 'Tai nghe Bluetooth TWS không dây chống ồn ANC', price: 450000, count: 1, category: 'Thiết Bị Điện Tử' },
  { name: 'Áo thun nam cotton oversize form rộng', price: 189000, count: 2, category: 'Thời Trang Nam' },
  { name: 'Sách "Nhà Giả Kim" - Paulo Coelho (Bản đặc biệt)', price: 75000, count: 1, category: 'Nhà Sách Online' },
  { name: 'Nồi chiên không dầu 6L đa năng', price: 1290000, count: 1, category: 'Nhà Cửa & Đời Sống' },
  { name: 'Giày chạy bộ nam siêu nhẹ thoáng khí', price: 650000, count: 1, category: 'Thể Thao & Du Lịch' },
  { name: 'Serum Vitamin C dưỡng trắng da 30ml', price: 320000, count: 1, category: 'Sắc Đẹp' },
  { name: 'Ốp lưng iPhone 15 Pro Max silicon trong suốt', price: 59000, count: 3, category: 'Điện Thoại & Phụ Kiện' },
  { name: 'Bộ snack mix hạt dinh dưỡng 500g', price: 145000, count: 2, category: 'Thực Phẩm' },
  { name: 'Bỉm dán Huggies size M 60 miếng', price: 285000, count: 1, category: 'Mẹ & Bé' },
  { name: 'Thức ăn cho mèo Royal Canin 2kg', price: 395000, count: 1, category: 'Thú Cưng' },
  { name: 'Chuột gaming không dây RGB 16000DPI', price: 520000, count: 1, category: 'Máy Tính & Laptop' },
  { name: 'Váy đầm nữ hoa nhí vintage retro', price: 275000, count: 1, category: 'Thời Trang Nữ' },
  { name: 'Bộ truyện Doraemon tập 1-10', price: 180000, count: 1, category: 'Nhà Sách Online' },
  { name: 'Máy xay sinh tố cầm tay mini USB', price: 350000, count: 1, category: 'Nhà Cửa & Đời Sống' },
  { name: 'Balo thể thao chống nước 40L', price: 420000, count: 1, category: 'Thể Thao & Du Lịch' },
  { name: 'Kem chống nắng SPF50+ PA++++ 50ml', price: 235000, count: 2, category: 'Sắc Đẹp' },
  { name: 'Sạc nhanh 65W GaN Type-C PD', price: 380000, count: 1, category: 'Điện Thoại & Phụ Kiện' },
  { name: 'Bánh tráng trộn Tây Ninh combo 5 bịch', price: 95000, count: 3, category: 'Thực Phẩm' },
  { name: 'Xe đẩy em bé gấp gọn siêu nhẹ', price: 2450000, count: 1, category: 'Mẹ & Bé' },
  { name: 'Vòng cổ cho chó mèo có chuông', price: 45000, count: 2, category: 'Thú Cưng' },
  { name: 'Laptop Stand nhôm nguyên khối tản nhiệt', price: 590000, count: 1, category: 'Máy Tính & Laptop' },
  { name: 'Quần jean nam slim fit co giãn', price: 349000, count: 1, category: 'Thời Trang Nam' },
  { name: 'Đèn bàn LED chống cận mắt', price: 265000, count: 1, category: 'Nhà Cửa & Đời Sống' },
  { name: 'Bộ nồi inox 5 đáy Fivestar', price: 1850000, count: 1, category: 'Nhà Cửa & Đời Sống' },
  { name: 'Dép Adidas Adilette Comfort', price: 750000, count: 1, category: 'Giày Dép Nam' },
  { name: 'Mặt nạ giấy Hàn Quốc hộp 30 miếng', price: 210000, count: 1, category: 'Sắc Đẹp' },
  { name: 'Cáp sạc iPhone Lightning to USB-C 2m', price: 120000, count: 2, category: 'Điện Thoại & Phụ Kiện' },
  { name: 'Khô gà lá chanh Bến Tre 500g', price: 165000, count: 1, category: 'Thực Phẩm' },
  { name: 'Ghế ăn dặm cho bé có đệm', price: 890000, count: 1, category: 'Mẹ & Bé' },
  { name: 'Cát vệ sinh cho mèo tofu 6L', price: 135000, count: 2, category: 'Thú Cưng' },
  { name: 'Điện thoại Samsung Galaxy A15 128GB', price: 4490000, count: 1, category: 'Điện Thoại & Phụ Kiện' },
  { name: 'Áo khoác gió nữ 2 lớp chống nước', price: 395000, count: 1, category: 'Thời Trang Nữ' },
  { name: 'Tủ nhựa ghép 12 ô đa năng', price: 450000, count: 1, category: 'Nhà Cửa & Đời Sống' },
  { name: 'Bàn phím cơ gaming RGB hot-swap', price: 890000, count: 1, category: 'Máy Tính & Laptop' },
  { name: 'Son môi MAC Matte Lipstick', price: 480000, count: 1, category: 'Sắc Đẹp' },
  { name: 'Pin sạc dự phòng 20000mAh PD 65W', price: 690000, count: 1, category: 'Điện Thoại & Phụ Kiện' },
  { name: 'Combo 10 gói mì Hảo Hảo tôm chua cay', price: 38000, count: 5, category: 'Thực Phẩm' },
  { name: 'Bình sữa Pigeon cổ rộng 240ml', price: 195000, count: 2, category: 'Mẹ & Bé' },
  { name: 'Máy lọc không khí và khử mùi cho thú cưng', price: 1250000, count: 1, category: 'Thú Cưng' },
  { name: 'iPad Air M2 11 inch 128GB WiFi', price: 15990000, count: 1, category: 'Máy Tính & Laptop' },
];

const productId = (index: number) => 1000 + index;

// Demo stand-in for what the extension reads from Shopee: each product's category, root tier only.
export const mockCategories: CategoryMap = Object.fromEntries(products.map((product, index) => [
  String(productId(index)),
  { path: [{ catid: index, name: product.category }], fetchedAt: new Date().toISOString() },
]));

const statuses: { code: StatusCode; text: string }[] = [
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

function generateOrders(): { orders: Order[]; totalCount: number; totalAmount: number } {
  const orders: Order[] = [];
  let totalCount = 0;
  let totalAmount = 0;

  const startDate = new Date(2024, 0, 5);
  const endDate = new Date(2026, 1, 20);

  for (let i = 0; i < 40; i++) {
    const product = products[i % products.length];
    const shop = shops[i % shops.length];
    const statusInfo = statuses[i % statuses.length];

    const timeFraction = i / 39;
    const orderTimestamp = new Date(
      startDate.getTime() + timeFraction * (endDate.getTime() - startDate.getTime())
    );
    orderTimestamp.setDate(orderTimestamp.getDate() + Math.floor(Math.random() * 10) - 5);

    const deliveryDate = statusInfo.code === 4 ? null : orderTimestamp.toISOString();
    const orderMonth = deliveryDate ? orderTimestamp.getMonth() + 1 : null;
    const orderYear = deliveryDate ? orderTimestamp.getFullYear() : null;

    const subTotal = statusInfo.code === 4 || statusInfo.code === 12 ? 0 : product.price;

    const orderId = String(2400000000000000 + i * 1000000 + Math.floor(Math.random() * 999999));

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
      items: [{ itemId: productId(i % products.length), name: product.name, variation: '', quantity: product.count, unitPrice: product.price }],
      shopId: 5000 + (i % shops.length),
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

export const mockData: OrderData = {
  user: {
    userId: 123456789,
    uid: '0-123456789',
    username: 'demo_user',
    name: 'Demo User',
    avatar: '',
    shopId: 123456780
  },
  orders,
  totalCount,
  totalAmount,
  totalAmountFormatted: formatVND(totalAmount),
  fetchedAt: new Date().toISOString(),
  cachedAt: new Date().toISOString(),
};
