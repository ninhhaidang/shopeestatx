// Chart rendering — monthly/daily spending bar chart + top shops doughnut
import type { Order } from '../types/index.js';
import { state } from './state.js';
import { formatVND } from './utils.js';
import { applyFilters, filterOrders } from './filters.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/** Read a CSS variable from the document root (adapts to dark mode) */
function cssVar(name: string, fallback: string): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

let monthlyChart: Chart | null = null;
let shopChart: Chart | null = null;

export function renderCharts(orders: Order[]): void {
  const chartData: Record<string, number> = {};
  const hasMonthFilter = (document.getElementById('filterMonth') as HTMLSelectElement).value !== '';

  // For chart display, show ALL days in the month even when a specific day is selected
  const chartOrders = hasMonthFilter && state.selectedDay !== null
    ? filterOrders(state.allOrdersData!.orders, {
      year: (document.getElementById('filterYear') as HTMLSelectElement).value,
      month: (document.getElementById('filterMonth') as HTMLSelectElement).value,
      status: (document.getElementById('filterStatus') as HTMLSelectElement).value,
      searchTerm: (document.getElementById('searchBox') as HTMLInputElement).value.toLowerCase().trim(),
    })
    : orders;

  chartOrders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;

    let key: string;
    if (hasMonthFilter && order.deliveryDate) {
      const date = new Date(order.deliveryDate);
      const day = date.getDate();
      key = `${day}/${order.orderMonth}/${order.orderYear}`;
    } else {
      if (!order.orderMonth || !order.orderYear) return;
      key = `${order.orderMonth}/${order.orderYear}`;
    }

    chartData[key] = (chartData[key] || 0) + order.subTotal;
  });

  const sortedKeys = Object.keys(chartData).sort((a, b) => {
    const parts1 = a.split('/').map(Number);
    const parts2 = b.split('/').map(Number);

    if (hasMonthFilter) {
      const [d1, m1, y1] = parts1;
      const [d2, m2, y2] = parts2;
      return (y1 - y2) || (m1 - m2) || (d1 - d2);
    } else {
      const [m1, y1] = parts1;
      const [m2, y2] = parts2;
      return (y1 - y2) || (m1 - m2);
    }
  });

  const chartLabels = hasMonthFilter
    ? sortedKeys.map(k => { const [day, month] = k.split('/'); return `${day}/${month}`; })
    : sortedKeys;

  const monthlyValues = sortedKeys.map(k => chartData[k]);

  const backgroundColors = monthlyValues.map((_value, index) => {
    if (hasMonthFilter && state.selectedDay !== null) {
      const key = sortedKeys[index];
      const [day] = key.split('/').map(Number);
      return day === state.selectedDay ? '#ff6b3d' : '#ee4d2d';
    }
    return '#ee4d2d';
  });

  const chartTitle = document.querySelector('.chart-box h3');
  if (chartTitle) {
    chartTitle.textContent = hasMonthFilter ? 'Chi tiêu theo ngày' : 'Chi tiêu theo tháng';
  }

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthlyChart') as HTMLCanvasElement, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Chi tiêu (VNĐ)',
        data: monthlyValues,
        backgroundColor: backgroundColors,
        borderRadius: 4,
        hoverBackgroundColor: '#ff6b3d',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => formatVND(ctx.raw as number),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: cssVar('--text-secondary', '#718096'),
            callback: value => formatVND(value as number, true),
          },
          grid: { color: cssVar('--border-color', '#e2e8f0') },
        },
        x: {
          ticks: { color: cssVar('--text-secondary', '#718096') },
          grid: { color: 'transparent' },
        },
      },
      onClick: (_event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;

          if (hasMonthFilter) {
            const dayLabel = sortedKeys[index];
            const [day] = dayLabel.split('/').map(Number);
            state.selectedDay = state.selectedDay === day ? null : day;
            applyFilters();
          } else {
            const monthLabel = sortedKeys[index];
            const [monthNum, year] = monthLabel.split('/');
            (document.getElementById('filterYear') as HTMLSelectElement).value = year;
            (document.getElementById('filterMonth') as HTMLSelectElement).value = monthNum;
            applyFilters();
            document.getElementById('ordersTable')!.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
    },
  });

  // Top shops doughnut chart
  const shopData: Record<string, { amount: number; orders: number; products: number }> = {};
  orders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;
    const shop = order.shopName.split(' - ')[1] || order.shopName;

    if (!shopData[shop]) {
      shopData[shop] = { amount: 0, orders: 0, products: 0 };
    }

    shopData[shop].amount += order.subTotal;
    shopData[shop].orders += 1;
    shopData[shop].products += order.productCount;
  });

  const topShops = Object.entries(shopData)
    .sort((a, b) => b[1][state.shopMetric] - a[1][state.shopMetric])
    .slice(0, state.shopCount);

  let tooltipFormatter: (ctx: { label: string; raw: unknown }) => string;
  if (state.shopMetric === 'amount') {
    tooltipFormatter = ctx => `${ctx.label}: ${formatVND(ctx.raw as number)}`;
  } else if (state.shopMetric === 'orders') {
    tooltipFormatter = ctx => `${ctx.label}: ${ctx.raw} đơn`;
  } else {
    tooltipFormatter = ctx => `${ctx.label}: ${ctx.raw} sản phẩm`;
  }

  if (shopChart) shopChart.destroy();
  shopChart = new Chart(document.getElementById('shopChart') as HTMLCanvasElement, {
    type: 'doughnut',
    data: {
      labels: topShops.map(s => s[0].substring(0, 20)),
      datasets: [{
        data: topShops.map(s => s[1][state.shopMetric]),
        backgroundColor: ['#ee4d2d', '#ff7043', '#ffab91', '#ffccbc', '#fbe9e7', '#ffe0b2', '#ffd180', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100'],
        hoverOffset: 10,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: tooltipFormatter,
          },
        },
      },
      onClick: (_event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const shopName = topShops[index][0];
          (document.getElementById('searchBox') as HTMLInputElement).value = shopName;
          applyFilters();
          document.getElementById('ordersTable')!.scrollIntoView({ behavior: 'smooth' });
        }
      },
    },
  });
}
