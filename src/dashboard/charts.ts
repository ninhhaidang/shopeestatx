// Chart rendering — monthly/daily spending bar chart + top shops doughnut
import type { Order, DrillDownCallback, TimeCriteria } from '../types/index.js';
import { state } from './state.js';
import { formatVND } from './utils.js';
import { t } from '../i18n/index.js';
import { formatDate } from '../i18n/format.js';
import { applyFilters } from './filters.js';
import { FilterEngine } from './filter-engine.js';
import { getCurrentTheme } from './theme-toggle.js';
import { getCachedBudgetConfig } from './budget.js';
import { Chart, registerables, type Plugin } from 'chart.js';

Chart.register(...registerables);

/** Read a CSS variable from the document root (adapts to dark mode) */
function cssVar(name: string, fallback: string): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

let monthlyChart: Chart | null = null;
let shopChart: Chart | null = null;
let _beforeunloadRegistered = false;

/** Cleanup all chart instances to prevent memory leaks */
export function destroyAllCharts(): void {
  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }
  if (shopChart) {
    shopChart.destroy();
    shopChart = null;
  }
}

/** Hide active tooltips on chart instances without destroying them */
export function hideChartTooltips(): void {
  if (monthlyChart?.tooltip) {
    try {
      monthlyChart.tooltip.setActiveElements([], { x: 0, y: 0 });
      monthlyChart.update('none');
    } catch {
      // Non-fatal
    }
  }
  if (shopChart?.tooltip) {
    try {
      shopChart.tooltip.setActiveElements([], { x: 0, y: 0 });
      shopChart.update('none');
    } catch {
      // Non-fatal
    }
  }
}

if (typeof window !== 'undefined' && !_beforeunloadRegistered) {
  window.addEventListener('beforeunload', destroyAllCharts);
  _beforeunloadRegistered = true;
}

/**
 * Computes an accurate temporal subtitle for the spending chart,
 * reflecting full historical duration or specific filter boundaries,
 * with budget limit integration when active.
 */
export function formatSpendingSubtitle(
  time?: TimeCriteria | null,
  selectedYear?: number | null,
  budgetConfig?: { enabled: boolean; monthlyLimit: number } | null
): string {
  // ponytail: support custom locale strings if multi-language becomes required; vi-VN hardcoded for now
  let temporalText = 'Toàn bộ lịch sử';

  if (time) {
    switch (time.kind) {
      case 'year':
        temporalText = `Năm ${time.year}`;
        break;
      case 'month':
        temporalText = time.year > 0 ? `Tháng ${time.month}/${time.year}` : `Tháng ${time.month}`;
        break;
      case 'day':
        temporalText = `Ngày ${time.day}/${time.month}/${time.year}`;
        break;
      case 'range': {
        const startStr = time.start ? formatDate(time.start) : '…';
        const endStr = time.end ? formatDate(time.end) : '…';
        temporalText = `Từ ${startStr} đến ${endStr}`;
        break;
      }
      case 'all':
        temporalText = 'Toàn bộ lịch sử';
        break;
      default:
        temporalText = 'Toàn bộ lịch sử';
        break;
    }
  } else if (selectedYear && selectedYear > 0) {
    temporalText = `Năm ${selectedYear}`;
  }

  const showBudget = budgetConfig?.enabled && (budgetConfig?.monthlyLimit ?? 0) > 0;
  if (showBudget) {
    const budgetLimit = budgetConfig!.monthlyLimit;
    return `${temporalText} • Đường kẻ đứt màu đỏ: Hạn mức ngân sách (${formatVND(budgetLimit)}/tháng)`;
  }

  return temporalText;
}

/**
 * Renders monthly spending bar chart and top shops doughnut chart.
 *
 * @param orders Filtered orders to display in charts
 * @param onDrillDown Optional callback invoked when a month bar is clicked for visual drill-down
 */
export function renderCharts(orders: Order[], onDrillDown?: DrillDownCallback): void {
  const chartData: Record<string, number> = {};
  const theme = getCurrentTheme();
  const primaryColor = theme.primaryColor;
  const primaryDarkColor = theme.primaryDark;

  const time = state.criteria?.time;
  const filterYearVal = (document.getElementById('filterYear') as HTMLSelectElement | null)?.value;
  const selectedYear = filterYearVal ? parseInt(filterYearVal, 10) : null;
  const activeMonth = (time?.kind === 'month' || time?.kind === 'day') ? time.month : null;
  const activeYear = (time && 'year' in time && time.year > 0) ? time.year : null;
  // For chart display, show all months in the year (or all-time) even when a specific month/day is selected
  const chartOrders =
    state.allOrdersData && (state.criteria?.time.kind === 'month' || state.criteria?.time.kind === 'day')
      ? FilterEngine.evaluate(state.allOrdersData.orders, {
          ...state.criteria,
          time: activeYear && activeYear > 0
            ? { kind: 'year', year: activeYear }
            : { kind: 'all' },
        })
      : orders;

  chartOrders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;
    if (!order.orderMonth || !order.orderYear) return;
    const key = `${order.orderMonth}/${order.orderYear}`;
    chartData[key] = (chartData[key] || 0) + order.subTotal;
  });

  const sortedKeys = Object.keys(chartData).sort((a, b) => {
    const [m1, y1] = a.split('/').map(Number);
    const [m2, y2] = b.split('/').map(Number);
    return (y1 - y2) || (m1 - m2);
  });

  const chartLabels = sortedKeys;
  const monthlyValues = sortedKeys.map(k => chartData[k]);

  const backgroundColors = monthlyValues.map((_value, index) => {
    if (activeMonth !== null) {
      const key = sortedKeys[index];
      const [m, y] = key.split('/').map(Number);
      if (m === activeMonth && (!activeYear || y === activeYear)) {
        return primaryColor;
      }
    }
    return primaryDarkColor;
  });

  const chartTitle = document.getElementById('monthlyChartTitle');
  if (chartTitle) {
    chartTitle.textContent = t('chart.spendingByMonth');
  }

  const budgetConfig = getCachedBudgetConfig();
  const showBudgetLine = budgetConfig.enabled && budgetConfig.monthlyLimit > 0;
  const budgetLimit = budgetConfig.monthlyLimit;

  const chartSub = document.getElementById('monthlyChartSub');
  if (chartSub) {
    chartSub.textContent = formatSpendingSubtitle(time, selectedYear, budgetConfig);
  }

  const plugins: Plugin<'bar'>[] = [];
  if (showBudgetLine) {
    plugins.push({
      id: 'budgetGuideline',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales.y) return;
        const yPos = scales.y.getPixelForValue(budgetLimit);
        if (yPos < chartArea.top - 20 || yPos > chartArea.bottom + 20) return;

        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(chartArea.left, yPos);
        ctx.lineTo(chartArea.right, yPos);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Hạn mức: ${formatVND(budgetLimit, true)}`, chartArea.right - 8, yPos - 3);
        ctx.restore();
      },
    });
  }

  if (monthlyChart) monthlyChart.destroy();
  const monthlyCanvas = document.getElementById('monthlyChart') as HTMLCanvasElement | null;
  if (monthlyCanvas) {
    monthlyChart = new Chart(monthlyCanvas, {
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
          suggestedMax: showBudgetLine
            ? Math.max(...(monthlyValues.length ? monthlyValues : [0]), budgetLimit) * 1.15
            : undefined,
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
          if (!onDrillDown) return;
          const index = activeElements[0].index;

          const monthLabel = sortedKeys[index];
          const [monthNum, year] = monthLabel.split('/').map(Number);

          const time = state.criteria?.time;
          const isAlreadyActiveMonth =
            time?.kind === 'month' &&
            time.month === monthNum &&
            (time.year === year || !time.year);

          if (isAlreadyActiveMonth) {
            // Re-clicking active month bar toggles off back to year or all-time
            const targetYear = selectedYear ?? (activeYear && activeYear > 0 ? activeYear : 0);
            const targetTime: TimeCriteria = targetYear ? { kind: 'year', year: targetYear } : { kind: 'all' };
            onDrillDown({ time: targetTime });
            return;
          }

          onDrillDown({ time: { kind: 'month', year, month: monthNum } });
        }
      },
    },
      plugins,
    });
  }

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

  const shopCanvas = document.getElementById('shopChart') as HTMLCanvasElement | null;
  if (shopCanvas) {
    shopChart = new Chart(shopCanvas, {
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
            document.getElementById('ordersTable')?.scrollIntoView({ behavior: 'smooth' });
          }
        },
      },
    });
  }
}
