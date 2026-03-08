// Chart rendering — monthly/daily spending bar chart + top shops doughnut
import type { Order } from '../types/index.js';
import { state } from './state.js';
import { formatVND } from './utils.js';
import { t } from '../i18n/index.js';
import { applyFilters, filterOrders } from './filters.js';
import { getCurrentTheme } from './theme-toggle.js';
import { Chart, registerables } from 'chart.js';
import { EVENTS } from '../config.js';

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
  const theme = getCurrentTheme();
  const primaryColor = theme.primaryColor;
  const primaryDarkColor = theme.primaryDark;

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
      return day === state.selectedDay ? primaryColor : primaryDarkColor;
    }
    return primaryDarkColor;
  });

  const chartTitle = document.querySelector('.chart-box h3');
  if (chartTitle) {
    chartTitle.textContent = hasMonthFilter ? t('chart.spendingByDay') : t('chart.spendingByMonth');
  }

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthlyChart') as HTMLCanvasElement, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: t('chart.dataset.spending'),
        data: monthlyValues,
        backgroundColor: backgroundColors,
        borderRadius: 4,
        hoverBackgroundColor: primaryColor,
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
            // BUG-2: clear ghost dateRange so it doesn't silently reactivate on chip removal
            state.dateRange = { start: null, end: null };
            document.dispatchEvent(new CustomEvent(EVENTS.DATE_RANGE_CLEARED));
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
    tooltipFormatter = ctx => `${ctx.label}: ${t('chart.tooltip.orders', { value: String(ctx.raw) })}`;
  } else {
    tooltipFormatter = ctx => `${ctx.label}: ${t('chart.tooltip.products', { value: String(ctx.raw) })}`;
  }

  if (shopChart) shopChart.destroy();

  // Generate gradient colors for shop chart (theme primary fading to lighter)
  function generateGradientColors(primary: string, count: number): string[] {
    const colors: string[] = [];
    // Parse hex to get RGB
    const hex = primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    for (let i = 0; i < count; i++) {
      // Fade from primary to white (lighter)
      const factor = i * (1 / count);
      const newR = Math.round(r + (255 - r) * factor * 0.7);
      const newG = Math.round(g + (255 - g) * factor * 0.7);
      const newB = Math.round(b + (255 - b) * factor * 0.7);
      colors.push(`rgb(${newR}, ${newG}, ${newB})`);
    }
    return colors;
  }

  const shopChartColors = generateGradientColors(primaryColor, Math.min(topShops.length, 10));

  shopChart = new Chart(document.getElementById('shopChart') as HTMLCanvasElement, {
    type: 'doughnut',
    data: {
      labels: topShops.map(s => s[0].substring(0, 20)),
      datasets: [{
        data: topShops.map(s => s[1][state.shopMetric]),
        backgroundColor: shopChartColors,
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
