// Category spending from Shopee's own product categories + doughnut chart
import type { CategoryMap, Order } from '../types/index.js';
import { formatVND } from './utils.js';
import { Chart } from 'chart.js';

export const UNCATEGORIZED = 'Chưa phân loại';

interface Share {
  category: string;
  amount: number;
}

/** Root-tier name of the product's Shopee category, or UNCATEGORIZED while unknown. */
function rootCategory(itemId: number | null, categories: CategoryMap): string {
  const entry = itemId === null ? undefined : categories[String(itemId)];
  return entry?.path[0]?.name ?? UNCATEGORIZED;
}

/** What an order spends in each category: price times quantity per item. Orders cached without items count whole. */
function sharesOf(order: Order, categories: CategoryMap): Share[] {
  if (!order.items?.length) return [{ category: UNCATEGORIZED, amount: order.subTotal }];
  return order.items.map(item => ({
    category: rootCategory(item.itemId, categories),
    amount: item.unitPrice * item.quantity,
  }));
}

export function orderHasCategory(order: Order, categories: CategoryMap, category: string): boolean {
  return sharesOf(order, categories).some(share => share.category === category);
}

/** Categories present in the data, alphabetical, with the unclassified bucket last. */
export function listCategories(orders: Order[], categories: CategoryMap): string[] {
  const names = new Set(orders.flatMap(order => sharesOf(order, categories).map(share => share.category)));
  const known = [...names].filter(name => name !== UNCATEGORIZED).sort((a, b) => a.localeCompare(b, 'vi'));
  return names.has(UNCATEGORIZED) ? [...known, UNCATEGORIZED] : known;
}

/** The category dropdown lists the categories found in the user's own orders and keeps the current choice if it still exists. */
export function syncCategoryOptions(select: HTMLSelectElement | null, orders: Order[], categories: CategoryMap): void {
  if (!select) return;
  const wanted = listCategories(orders, categories);
  const current = Array.from(select.options).slice(1).map(option => option.value);
  if (wanted.join('\n') === current.join('\n')) return;
  const selected = select.value;
  while (select.options.length > 1) select.remove(1);
  wanted.forEach(name => select.add(new Option(name, name)));
  select.value = wanted.includes(selected) ? selected : '';
}

export interface CategoryBreakdown {
  [category: string]: { amount: number; count: number };
}

export function getCategoryBreakdown(orders: Order[], categories: CategoryMap): CategoryBreakdown {
  const result: CategoryBreakdown = {};
  orders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;
    const seen = new Set<string>();
    for (const { category, amount } of sharesOf(order, categories)) {
      if (!result[category]) result[category] = { amount: 0, count: 0 };
      result[category].amount += amount;
      if (!seen.has(category)) { result[category].count += 1; seen.add(category); }
    }
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
        backgroundColor: entries.map(([cat], i) => (cat === UNCATEGORIZED ? '#C0C0C0' : chartColors[i % chartColors.length])),
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
