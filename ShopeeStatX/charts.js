// ShopeeStatX/charts.js
import { state } from './state.js';
import { formatVND } from './utils.js';
import { applyFilters } from './filters.js'; // Circular import — safe: applyFilters called only inside onClick handlers, not at eval time
// Chart global from vendored chart.min.js script tag in results.html

// Chart instances — private to this module, NOT in state.js
let monthlyChart = null;
let shopChart = null;

export function renderCharts(orders) {
  // Monthly/Daily spending chart
  const chartData = {};
  const hasMonthFilter = document.getElementById('filterMonth').value !== '';

  // For chart display, we want to show ALL days in the month
  // even when a specific day is selected (day filter only affects table)
  const chartOrders = hasMonthFilter && state.selectedDay !== null
    ? state.allOrdersData.orders.filter(order => {
      const year = document.getElementById('filterYear').value;
      const month = document.getElementById('filterMonth').value;
      const status = document.getElementById('filterStatus').value;
      const searchTerm = document.getElementById('searchBox').value.toLowerCase().trim();

      // Apply same filters as main filter, but exclude selectedDay filter
      if (year && (!order.orderYear || order.orderYear != year)) return false;
      if (month && (!order.orderMonth || order.orderMonth != month)) return false;
      if (status && order.statusCode != status) return false;

      if (searchTerm) {
        const searchableText = [
          order.orderId?.toString(),
          order.name,
          order.shopName,
          order.productSummary,
          order.status
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      return true;
    })
    : orders;

  chartOrders.forEach(order => {
    if (order.statusCode === 4 || order.statusCode === 12) return;

    let key;
    if (hasMonthFilter && order.deliveryDate) {
      // If filtering by month, group by day
      const date = new Date(order.deliveryDate);
      const day = date.getDate();
      key = `${day}/${order.orderMonth}/${order.orderYear}`;
    } else {
      // Otherwise group by month
      if (!order.orderMonth || !order.orderYear) return;
      key = `${order.orderMonth}/${order.orderYear}`;
    }

    chartData[key] = (chartData[key] || 0) + order.subTotal;
  });

  const sortedKeys = Object.keys(chartData).sort((a, b) => {
    const parts1 = a.split('/').map(Number);
    const parts2 = b.split('/').map(Number);

    if (hasMonthFilter) {
      // day/month/year
      const [d1, m1, y1] = parts1;
      const [d2, m2, y2] = parts2;
      return y1 - y2 || m1 - m2 || d1 - d2;
    } else {
      // month/year
      const [m1, y1] = parts1;
      const [m2, y2] = parts2;
      return y1 - y2 || m1 - m2;
    }
  });

  // Format labels based on filter type
  const chartLabels = hasMonthFilter
    ? sortedKeys.map(k => {
      const [day, month] = k.split('/');
      return `${day}/${month}`;
    })
    : sortedKeys;

  const monthlyValues = sortedKeys.map(k => chartData[k]);

  // Prepare backgroundColor array (highlight selected day if applicable)
  const backgroundColors = monthlyValues.map((value, index) => {
    if (hasMonthFilter && state.selectedDay !== null) {
      const key = sortedKeys[index];
      const [day] = key.split('/').map(Number);
      return day === state.selectedDay ? '#ff6b3d' : '#ee4d2d';
    }
    return '#ee4d2d';
  });

  // Update chart title
  const chartTitle = document.querySelector('.chart-box h3');
  if (chartTitle) {
    chartTitle.textContent = hasMonthFilter ? 'Chi tiêu theo ngày' : 'Chi tiêu theo tháng';
  }

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthlyChart'), {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Chi tiêu (VNĐ)',
        data: monthlyValues,
        backgroundColor: backgroundColors,
        borderRadius: 4,
        hoverBackgroundColor: '#ff6b3d'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => formatVND(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatVND(value, true)
          }
        }
      },
      onClick: (event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;

          if (hasMonthFilter) {
            // When filtering by month, toggle day selection
            const dayLabel = sortedKeys[index];
            const [day] = dayLabel.split('/').map(Number);

            // Toggle selected day
            if (state.selectedDay === day) {
              state.selectedDay = null; // Deselect
            } else {
              state.selectedDay = day; // Select
            }

            // Reapply filters
            applyFilters();
          } else {
            // When not filtering by month, select month
            const monthLabel = sortedKeys[index];
            const [monthNum, year] = monthLabel.split('/');

            // Set filters
            document.getElementById('filterYear').value = year;
            document.getElementById('filterMonth').value = monthNum;

            // Apply filters
            applyFilters();

            // Scroll to table
            document.getElementById('ordersTable').scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    }
  });

  // Top shops chart
  const shopData = {};
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

  // Sort and get top shops based on selected metric
  const topShops = Object.entries(shopData)
    .sort((a, b) => b[1][state.shopMetric] - a[1][state.shopMetric])
    .slice(0, state.shopCount);

  // Format tooltip based on metric
  let tooltipFormatter;
  if (state.shopMetric === 'amount') {
    tooltipFormatter = ctx => `${ctx.label}: ${formatVND(ctx.raw)}`;
  } else if (state.shopMetric === 'orders') {
    tooltipFormatter = ctx => `${ctx.label}: ${ctx.raw} đơn`;
  } else {
    tooltipFormatter = ctx => `${ctx.label}: ${ctx.raw} sản phẩm`;
  }

  if (shopChart) shopChart.destroy();
  shopChart = new Chart(document.getElementById('shopChart'), {
    type: 'doughnut',
    data: {
      labels: topShops.map(s => s[0].substring(0, 20)),
      datasets: [{
        data: topShops.map(s => s[1][state.shopMetric]),
        backgroundColor: ['#ee4d2d', '#ff7043', '#ffab91', '#ffccbc', '#fbe9e7', '#ffe0b2', '#ffd180', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100'],
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: tooltipFormatter
          }
        }
      },
      onClick: (event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const shopName = topShops[index][0];

          // Search for shop name
          document.getElementById('searchBox').value = shopName;

          // Apply filters
          applyFilters();

          // Scroll to table
          document.getElementById('ordersTable').scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });
}
