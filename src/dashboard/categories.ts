// Product categorization engine — keyword-based classifier + doughnut chart
import type { Order } from '../types/index.js';
import { formatVND } from './utils.js';
import { Chart } from 'chart.js';

// Vietnamese + English keyword rules per category
// IMPORTANT: keep keywords specific enough to avoid substring false positives
// Priority: cụ thể trước, chung sau
const RULES: Record<string, string[]> = {
  // Mẹ & Bé - ưu tiên cao vì có nhiều sản phẩm
  'Mẹ & Bé': [
    // Tã & Bỉm
    'bim dan', 'bim quan', 'tan bim', 'goi bim', 'pampers', 'huggies', 'moony',
    // Sữa & Bình sữa
    'sua nan', 'sua formula', 'sua hop', 'sua tuoi', 'binh sua', 'bình sữa', 'núm vú', 'dụng cụ cho bé',
    // Xe đẩy & Ghế
    'xe day em be', 'xe day', 'ghe an dam', 'ghế ăn dặm', 'noi cho be', 'noi hap',
    // Quần áo trẻ em
    'quan ao tre em', 'ao be trai', 'ao be gai', 'dam be gai', 'vay be', 'set tre em',
    // Đồ chơi trẻ em
    'do choi tre em', 'do choi gop', 'lego', 'puzzle', 'babyshark',
    // Sản phẩm cho mẹ
    'viet nam', 'kem tri thai', 'sua chua', 'ong tra sua', 'may hut sua',
    // Khác
    'tre em', 'baby', 'kids', 'nhi dong', 'me va be', 'mama'
  ],
  // Thú cưng
  'Thú cưng': [
    // Thức ăn
    'thuc an cho cho', 'thuc an cho meo', 'royal canin', 'gan cho', 'gan meo', 'pedigree', 'whiskas',
    'cau cho', 'cat san', 'thuc an thu cung',
    // Đồ chơi & Phụ kiện
    'do choi thu cung', 'vong co cho', 'vong co meo', 'chuong cho', 'chuong meo', 'ban cho',
    'day dan cho', 'day dan meo', 'quan ao thu cung', 'lop cho', 'lop meo',
    // Vệ sinh
    'cat ve sinh', 'cát vệ sinh', 'tofu cat', 'sanitary litter',
    // Khác
    'thu cung', 'pet', 'cho', 'meo', 'dog', 'cat', 'hamster', 'fish', 'ca'
  ],
  // Xe cộ
  'Xe cộ': [
    // Xe máy & Ô tô
    'xe may', 'xe moto', 'xe o to', 'oto', 'xemay', 'xe dap',
    // Phụ tùng
    'phu tung xe', 'phu tung oto', 'phu tung may', 'nhong xich', 'lop xe', 'duong truot',
    'phanh xe', 'dau nhot', 'dầu nhớt', 'xang dau', 'acquy', 'ắc quy',
    // Phụ kiện xe
    'bao tay xe', 'mu bao ho', 'kinh xe', 'cam bien', 'camera hành trình',
    'gương xe', 'den xe', 'loa xe', 'dvd', 'màn hình xe',
    // Khác
    'accessories xe', 'phụ kiện xe', 'car accessory', 'motorcycle accessory'
  ],
  // Đồ chơi
  'Đồ chơi': [
    // Board game & Card game
    'board game', 'card game', 'cờ', 'co vua', 'ma hong', 'uno', 'monopoly',
    // Lego & Building
    'lego', 'minecraft', 'building block', 'khối gỗ', 'do choi lap rap',
    // Game
    'game', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch', 'controller', 'tay cầm',
    // Puzzle & Trí tuệ
    'puzzle', 'rubik', 'tro choi tri', 'brain teaser',
    // Đồ chơi truyền thống
    'do choi tre em', 'bong bay', 'bong hop', 'khung long', 'robot',
    // Khác
    'toy', 'action figure', 'mô hình', 'collectible'
  ],
  // Sách & Văn phòng - phải đứng trước Điện tử vì 'sach' -> 'bo sac' issue
  'Sách & Văn phòng': [
    // Sách tiếng Việt
    'quyen sach', 'sach hoc', 'sach van hoc', 'sach ky nang', 'sach truyen', 'truyen tranh',
    'sach tieng anh', 'sach song ngu', 'từ điển', 'sach tham khao',
    // Văn phòng phẩm
    'tap vo', 'but viet', 'but chi', 'giay in', 'bang keo', 'ghim bam', 'keo dính',
    'file', 'folder', 'binder', 'so tay', 'calendar', 'lịch',
    // Sách tiếng Anh & khác
    'book', 'notebook', 'novel', 'textbook', 'magazine', 'journal',
    // Dụng cụ học tập
    'compass', 'thước', 'pencil', 'eraser', 'hộp bút', 'cặp sách'
  ],
  // Điện tử
  'Điện tử': [
    // Laptop & Computer
    'laptop', 'macbook', 'computer', 'may tinh', 'pc', 'desktop', 'all in one',
    // Phone & Tablet
    'phone', 'dien thoai', 'smartphone', 'ipad', 'tablet', 'ipad mini',
    // Audio
    'tai nghe', 'earphone', 'headphone', 'airpod', 'loa', 'loa bluetooth', 'soundbar',
    'micro', 'mic', 'karaoke', 'thu am',
    // Charging & Cable
    'bo sac', 'cap sac', 'sac nhanh', 'adapter', 'usb', 'usb hub', 'cổng usb',
    'pin du phong', 'sạc dự phòng', 'sạc không dây', 'wireless charger',
    // Peripheral
    'chuot may tinh', 'ban phim', 'keyboard', 'mouse', 'monitor', 'man hinh',
    'webcam', 'camera', 'guong', 'gamepad', 'tay cam game',
    // Smart Home
    'smart home', 'nhà thông minh', 'chuong', 'khoa dien tu', 'camera ip',
    'smart tv', 'tv', 'television', 'android box', 'fire tv',
    // Storage
    'usb', 'o cung', 'ssd', 'hdd', 'the nho', 'flash drive',
    // Khác
    'electronic', 'điện tử', 'gadget', 'device', 'device accessory'
  ],
  // Thời trang
  'Thời trang': [
    // Áo
    'ao thun', 'ao phong', 'ao khoac', 'ao len', 'ao som', 'ao co', 'polo shirt',
    'jacket', 'hoodie', 'sweater', 'vest', 'blazer', 'cardigan',
    // Quần
    'quan jean', 'quan tay', 'quan au', 'quan short', 'quan lot', 'quan jogging',
    'pants', 'trousers', 'legging', 'kaki',
    // Váy & Đầm
    'vay', 'dam', 'dam maxi', 'dam cong so', 'dam vai',
    // Giày & Dép
    'giay', 'giay the thao', 'giay cao got', 'giay sneaker', 'giay chay bo',
    'dep', 'dep tong', 'sandal', 'boot', 'shoes', 'sneakers',
    // Túi & Balo
    'tui xach', 'balo', 'tui deo', 'tui tote', 'tui dung', 'that lung',
    'backpack', 'handbag', 'clutch', 'wallet',
    // Phụ kiện
    'kinh mat', 'non', 'non ket', 'tat chan', 'gang tay', 'khăn',
    'trang suc', 'vong tay', 'day chuyen', 'bong tai', 'nhan',
    'accessory', 'phụ kiện thời trang',
    // Đồ lót & Mặc trong
    'do lot', 'quan lot', 'ao lot', 'bra', 'quần áo trong',
    // Khác
    'fashion', 'thời trang', 'clothing', 'apparel', 'wear'
  ],
  // Sắc đẹp
  'Sắc đẹp': [
    // Skincare
    'kem duong', 'kem chong nang', 'kem trang diem', 'kem mat', 'kem body',
    'toner', 'serum', 'essence', 'moisturizer', 'sua duong', 'sua chua',
    'kem trị mụn', 'kem tri nam', 'kem tri thai',
    // Makeup
    'son moi', 'phan nen', 'mascara', 'eyeliner', 'blush', 'phấn',
    'foundation', 'lipstick', 'nuoc hoa', 'phấn highlight',
    'trang diem', 'makeup', 'lip gloss', 'bút kẻ mắt',
    // Hair care
    'dau goi dau', 'dau xa', 'kem duong toc', 'xịt toc',
    'shampoo', 'conditioner', 'hair mask', 'serum toc',
    // Body care
    'sua rua mat', 'sua tam', 'kem duong body', 'lau san',
    'tẩy da chet', 'scrub', 'mask',
    // Perfume
    'nuoc hoa', 'perfume', 'EAU DE', 'toilet water',
    // Khác
    'beauty', 'skincare', 'cosmetic', 'lam dep', 'my pham', 'spa'
  ],
  // Thực phẩm
  'Thực phẩm': [
    // Bánh & Snack
    'banh mi', 'banh quy', 'banh ngot', 'banh troi', 'banh da lot',
    'keo', 'keo ngot', 'snack', 'bim bim', 'khoai tay', 'banh snack',
    'biscuit', 'cookie', 'chips', 'cracker',
    // Đồ uống
    'tra', 'tra xanh', 'ca phe', 'nuoc ep', 'sinh to', 'sua',
    'coffee', 'tea', 'juice', 'smoothie', 'protein',
    'bia', 'ruou', 'nước uống',
    // Gia vị & Nấu ăn
    'gia vi', 'dau an', 'nuoc mam', 'tuong', 'ot', 'ham',
    'mi tom', 'mi an lien', 'mì', 'hải sản', 'thịt',
    'thuc pham', 'food',
    // Đặc sản
    'banh trang', 'banh da cua', 'banh pia', 'keo dua',
    'mat ong', 'duong phien', 'hat rang',
    // Khác
    'hat', 'seeds', 'dried fruit', 'instant food'
  ],
  // Nhà cửa
  'Nhà cửa': [
    // Đèn
    'den led', 'den ban', 'den treo', 'den ngủ', 'lamp', 'đèn trang trí',
    // Nội thất
    'ghe sofa', 'ghe', 'tu', 'tu quan ao', 'ke sach', 'ban',
    'shelf', 'shelf', 'furniture', 'noi that',
    // Giường & Gối
    'ga giuong', 'goi nam', 'ga trai', 'nem', 'mat ga',
    'pillow', 'mattress', 'bed',
    // Trang trí
    'khung anh', 'tranh', 'hoa', 'hoa giấy', 'tượng',
    'decor', 'trang tri', 'curtain', 'rem cua',
    // Tổ chức & Lưu trữ
    'thung rac', 'storage box', 'hop', 'ke', 'khay',
    'organizer', 'do cung',
    // Khác
    'nhà cửa', 'home', 'household', 'vật dụng nhà bếp'
  ],
  // Sức khỏe
  'Sức khỏe': [
    // Vitamin & Supplement
    'vitamin', 'thuoc bo', 'supplement', 'collagen', 'omega', 'probiotic',
    'whey protein', 'calcium', 'vitamin c', 'vitamin d', 'multivitamin',
    // Y tế
    'khau trang', 'nhiet ke', 'bang y te', 'thuoc', 'dung cu y te',
    'medical', 'health',
    // Chăm sóc sức khỏe
    'may massge', 'may xoa bap', 'day giam can', 'vong eo',
    'healthcare', 'wellness',
    // Khác
    'suc khoe', 'sức khỏe', 'healthy'
  ],
  // Thể thao
  'Thể thao': [
    // Gym & Fitness
    'gym', 'fitness', 'tap gym', 'dumbbell', 'ta gay', 'tap the duc',
    'yoga', 'yoga mat', 'tạ', 'kéo tay', 'khung tập',
    // Cardio
    'chay bo', 'running', 'xe dap', 'cycling', 'máy chạy bộ',
    'boi loi', 'boi', 'swimming', 'bơi lội',
    // Team sports
    'bong da', 'bong chuyen', 'vot cau', 'cầu lông', 'tennis',
    'football', 'volleyball', 'badminton',
    // Phụ kiện thể thao
    'sport', 'the thao', 'phu kien the thao', 'giay the thao',
    'quan ao the thao', 'do tap', 'dụng cụ thể thao',
    // Khác
    'outdoor', 'camping', 'leon', 'hike'
  ],
};

/** Normalize: lowercase + strip Vietnamese diacritics */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/** Categorize a single order by matching product/shop text against keyword rules */
export function categorizeOrder(order: Order): string {
  const text = normalize(`${order.productSummary} ${order.name} ${order.shopName}`);
  for (const [cat, keywords] of Object.entries(RULES)) {
    if (keywords.some(kw => text.includes(kw))) return cat;
  }
  return 'Khác';
}

export interface CategoryBreakdown {
  [category: string]: { amount: number; count: number };
}

export function getCategoryBreakdown(orders: Order[]): CategoryBreakdown {
  const result: CategoryBreakdown = {};
  orders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;
    const cat = categorizeOrder(order);
    if (!result[cat]) result[cat] = { amount: 0, count: 0 };
    result[cat].amount += order.subTotal;
    result[cat].count += 1;
  });
  return result;
}

/** Fixed diverse color palette for category chart (same across all themes) */
function getChartColors(): string[] {
  return [
    '#FF6B6B', // Red - Mẹ & Bé
    '#4ECDC4', // Teal - Thú cưng
    '#45B7D1', // Sky blue - Xe cộ
    '#96CEB4', // Sage green - Đồ chơi
    '#FFEAA7', // Cream yellow - Sách & Văn phòng
    '#DDA0DD', // Plum - Điện tử
    '#98D8C8', // Mint - Thời trang
    '#F7DC6F', // Mustard - Sắc đẹp
    '#BB8FCE', // Lavender - Thực phẩm
    '#85C1E9', // Light blue - Nhà cửa
    '#FF8C42', // Orange - Sức khỏe
    '#C0C0C0', // Silver - Thể thao
  ];
}

let categoryChart: Chart | null = null;

export function renderCategoryChart(canvas: HTMLCanvasElement, data: CategoryBreakdown): void {
  const entries = Object.entries(data).sort((a, b) => b[1].amount - a[1].amount);
  if (entries.length === 0) return;

  const chartColors = getChartColors();

  if (categoryChart) { categoryChart.destroy(); categoryChart = null; }

  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: entries.map(([cat]) => cat),
      datasets: [{
        data: entries.map(([, v]) => v.amount),
        backgroundColor: chartColors.slice(0, entries.length),
        hoverOffset: 10,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const label = ctx.label as string;
              return `${label}: ${formatVND(ctx.raw as number)} (${data[label]?.count ?? 0} đơn)`;
            },
          },
        },
      },
    },
  });
}
