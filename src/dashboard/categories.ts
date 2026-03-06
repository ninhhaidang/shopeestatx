// Product categorization engine — keyword-based classifier + doughnut chart
import type { Order } from '../types/index.js';
import { formatVND } from './utils.js';
import { Chart } from 'chart.js';

// Vietnamese + English keyword rules per category
// IMPORTANT: keep keywords specific enough to avoid substring false positives
const RULES: Record<string, string[]> = {
  // Sách & Văn phòng first — 'sach' would match 'bo sac' (charger) if charger rules aren't specific
  'Sách & Văn phòng': ['quyen sach', 'sach hoc', 'sach van hoc', 'sach ky nang', 'tap vo', 'but viet', 'but chi', 'giay in', 'bang keo', 'ghim bam', 'book', 'notebook', 'sticker', 'folder', 'binder'],
  'Điện tử': ['laptop', 'macbook', 'phone', 'dien thoai', 'tai nghe', 'earphone', 'headphone', 'bo sac', 'cap sac', 'cap doi', 'usb hub', 'chuot may tinh', 'ban phim', 'man hinh', 'camera', 'loa bluetooth', 'pin du phong', 'adapter', 'op lung', 'keyboard', 'mouse', 'monitor', 'ipad', 'tablet', 'smartwatch', 'airpod'],
  'Thời trang': ['ao thun', 'ao phong', 'quan jean', 'quan tay', 'vay cong so', 'dam maxi', 'giay the thao', 'giay cao got', 'dep', 'tui xach', 'balo', 'that lung', 'kinh mat', 'non ket', 'tat chan', 'gang tay', 'jacket', 'polo shirt', 'pants', 'dress', 'shoes', 'vi da', 'vi tien'],
  'Sắc đẹp': ['kem duong', 'son moi', 'phan nen', 'nuoc hoa', 'sua rua mat', 'dau goi dau', 'toner', 'serum', 'mascara', 'chong nang', 'moisturizer', 'lipstick', 'skincare', 'shampoo', 'perfume', 'foundation', 'blush', 'eyeliner', 'nuoc tay trang'],
  'Thực phẩm': ['banh mi', 'banh quy', 'banh ngot', 'keo ngot', 'tra xanh', 'ca phe rang', 'mi tom', 'mi an lien', 'nuoc ep', 'sua tuoi', 'hat me', 'hat dieu', 'snack', 'gia vi', 'dau an', 'coffee', 'green tea', 'food', 'jam', 'mat ong', 'honey', 'chocolate', 'biscuit'],
  'Nhà cửa': ['den led', 'den ban', 'khung anh', 'ga giuong', 'goi nam', 'rem cua', 'thung rac', 'ke sach', 'tu quan ao', 'ghe sofa', 'lamp', 'pillow', 'curtain', 'shelf', 'storage box', 'chau cay', 'khay de do', 'tham san'],
  'Sức khỏe': ['vitamin', 'thuoc bo', 'khau trang', 'nhiet ke', 'bang y te', 'supplement', 'health', 'collagen', 'omega', 'probiotic', 'whey protein', 'calcium'],
  'Thể thao': ['gym', 'yoga', 'chay bo', 'bong da', 'vot cau', 'sport', 'fitness', 'running', 'tennis', 'cycling', 'xe dap', 'boi loi', 'tham the thao'],
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

const CHART_COLORS = ['#ee4d2d', '#ff7043', '#ffab91', '#ffd180', '#ffc371', '#a29bfe', '#82ca9d', '#74b9ff', '#fd79a8', '#00cec9'];

let categoryChart: Chart | null = null;

export function renderCategoryChart(canvas: HTMLCanvasElement, data: CategoryBreakdown): void {
  const entries = Object.entries(data).sort((a, b) => b[1].amount - a[1].amount);
  if (entries.length === 0) return;

  if (categoryChart) { categoryChart.destroy(); categoryChart = null; }

  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: entries.map(([cat]) => cat),
      datasets: [{
        data: entries.map(([, v]) => v.amount),
        backgroundColor: CHART_COLORS.slice(0, entries.length),
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
