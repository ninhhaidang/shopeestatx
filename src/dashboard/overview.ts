/**
 * ShopeeStatX — Executive KPI Strip & Split-View Hero (Tab 1 Financial Overview)
 * Implements 4-card KPI strip, comparative delta badges, circular SVG budget ring,
 * daily burn rate pacing, month-end forecast, and budget dialog bindings.
 */

import type { Order, FilterCriteria, OverviewMetrics } from '../types/index.js';
import type { BudgetConfig } from './budget.js';
import { formatVND, escapeHtml } from './utils.js';
import { switchTab } from './tabs.js';

export type { OverviewMetrics };

/** SVG Icon definitions for KPI cards and actions */
const ICON_SPEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6"/></svg>';
const ICON_CALENDAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
const ICON_BAG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>';
const ICON_TREND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
const ICON_PENCIL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
const ICON_TARGET = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';

/**
 * Pure calculation helper computing financial overview KPIs, comparisons,
 * daily burn rate, and month-end forecast.
 */
export function computeOverviewMetrics(
  filteredOrders: Order[],
  allOrders: Order[],
  budgetConfig: BudgetConfig,
  now: Date = new Date()
): OverviewMetrics {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastYear = currentYear - 1;

  // Filtered orders metrics (for Total Spend and total count)
  let totalSpend = 0;
  let completedOrdersCount = 0;
  filteredOrders.forEach(order => {
    if (order.statusCode !== 4 && order.statusCode !== 12) {
      totalSpend += order.subTotal;
      completedOrdersCount++;
    }
  });

  const totalOrders = filteredOrders.length;
  const avgOrderValue = completedOrdersCount > 0 ? Math.round(totalSpend / completedOrdersCount) : 0;

  // Historical reference metrics from allOrders
  const completedAllOrders = allOrders.filter(o => o.statusCode !== 4 && o.statusCode !== 12);

  const thisMonthOrders = completedAllOrders.filter(
    o => o.orderMonth === currentMonth && o.orderYear === currentYear
  );
  const thisMonthSpend = thisMonthOrders.reduce((sum, o) => sum + o.subTotal, 0);

  const lastMonthOrders = completedAllOrders.filter(
    o => o.orderMonth === lastMonth && o.orderYear === lastMonthYear
  );
  const lastMonthSpend = lastMonthOrders.reduce((sum, o) => sum + o.subTotal, 0);

  const thisYearSpend = completedAllOrders
    .filter(o => o.orderYear === currentYear)
    .reduce((sum, o) => sum + o.subTotal, 0);

  const lastYearSpend = completedAllOrders
    .filter(o => o.orderYear === lastYear)
    .reduce((sum, o) => sum + o.subTotal, 0);

  const monthChange = lastMonthSpend > 0
    ? ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100
    : null;

  const yearChange = lastYearSpend > 0
    ? ((thisYearSpend - lastYearSpend) / lastYearSpend) * 100
    : null;

  // Actual Average Order Value Month-over-Month trend
  const thisMonthAvg = thisMonthOrders.length > 0 ? thisMonthSpend / thisMonthOrders.length : 0;
  const lastMonthAvg = lastMonthOrders.length > 0 ? lastMonthSpend / lastMonthOrders.length : 0;
  const avgOrderChange = lastMonthAvg > 0
    ? ((thisMonthAvg - lastMonthAvg) / lastMonthAvg) * 100
    : null;

  const budgetPct = budgetConfig.monthlyLimit > 0
    ? Math.round((thisMonthSpend / budgetConfig.monthlyLimit) * 100)
    : 0;

  const budgetRemaining = budgetConfig.monthlyLimit - thisMonthSpend;

  // 3-day data guard for burn rate extrapolation to avoid early month spikes
  let burnRate = 0;
  if (currentDay >= 3) {
    burnRate = Math.round(thisMonthSpend / currentDay);
  } else if (lastMonthSpend > 0) {
    const daysInLastMonth = new Date(lastMonthYear, lastMonth, 0).getDate();
    burnRate = Math.round(lastMonthSpend / daysInLastMonth);
  } else {
    burnRate = currentDay > 0 ? Math.round(thisMonthSpend / currentDay) : 0;
  }
  const monthEndForecast = Math.round(burnRate * daysInMonth);

  return {
    totalSpend,
    thisMonthSpend,
    totalOrders,
    completedOrdersCount,
    avgOrderValue,
    yearChange,
    monthChange,
    avgOrderChange,
    burnRate,
    monthEndForecast,
    daysRemaining,
    budgetPct,
    budgetRemaining,
    currentYear,
    currentMonth,
  };
}

/**
 * Renders the 4-card Executive KPI Strip into the target container.
 */
export function renderKPIStrip(
  container: HTMLElement,
  metrics: OverviewMetrics,
  budgetConfig: BudgetConfig,
  onDrillDown: (preset: Partial<FilterCriteria>) => void
): void {
  // Delta badge 1 (Year over Year or All-time)
  let totalSpendDeltaHtml = '<span>toàn thời gian</span>';
  if (metrics.yearChange !== null) {
    const isUp = metrics.yearChange >= 0;
    const badgeClass = isUp ? 'delta-up' : 'delta-down';
    totalSpendDeltaHtml = `<span class="delta-badge ${badgeClass}">${isUp ? '↑' : '↓'} ${Math.abs(metrics.yearChange).toFixed(1)}%</span> <span>so với năm trước</span>`;
  }

  // Delta badge 2 (Budget % or Month over Month)
  let monthSpendDeltaHtml = '<span>tháng này</span>';
  if (budgetConfig.enabled && budgetConfig.monthlyLimit > 0) {
    const isOverAlert = metrics.budgetPct >= Math.round(budgetConfig.alertThreshold * 100);
    const badgeClass = isOverAlert ? 'delta-up' : 'delta-down';
    monthSpendDeltaHtml = `<span class="delta-badge ${badgeClass}">${metrics.budgetPct}%</span> <span>hạn mức ngân sách tháng</span>`;
  } else if (metrics.monthChange !== null) {
    const isUp = metrics.monthChange >= 0;
    const badgeClass = isUp ? 'delta-up' : 'delta-down';
    monthSpendDeltaHtml = `<span class="delta-badge ${badgeClass}">${isUp ? '↑' : '↓'} ${Math.abs(metrics.monthChange).toFixed(1)}%</span> <span>so với tháng trước</span>`;
  }

  // Delta badge 3 (Delivery completion rate)
  const completionRate = metrics.totalOrders > 0
    ? Math.round((metrics.completedOrdersCount / metrics.totalOrders) * 100)
    : 100;
  const completionRateDeltaHtml = `<span class="delta-badge delta-completed">${completionRate}%</span> <span>tỷ lệ hoàn thành giao hàng</span>`;

  // Delta badge 4 (AOV MoM change or completed count)
  let avgOrderDeltaHtml = `<span>${metrics.completedOrdersCount} đơn hoàn thành</span>`;
  if (metrics.avgOrderChange !== null) {
    const isUp = metrics.avgOrderChange >= 0;
    const badgeClass = isUp ? 'delta-up' : 'delta-down';
    avgOrderDeltaHtml = `<span class="delta-badge ${badgeClass}">${isUp ? '↑' : '↓'} ${Math.abs(metrics.avgOrderChange).toFixed(1)}%</span> <span>so với tháng trước</span>`;
  } else if (metrics.monthChange !== null) {
    const isUp = metrics.monthChange >= 0;
    const badgeClass = isUp ? 'delta-up' : 'delta-down';
    avgOrderDeltaHtml = `<span class="delta-badge ${badgeClass}">${isUp ? '↑' : '↓'} ${Math.abs(metrics.monthChange).toFixed(1)}%</span> <span>so với tháng trước</span>`;
  }

  container.innerHTML = `
    <div class="kpi-card" id="kpiTotalSpend" role="button" tabindex="0"
      aria-label="Tổng chi tiêu: ${formatVND(metrics.totalSpend)}. Bấm để xem tất cả đơn hàng"
      title="Bấm để xem tất cả đơn hàng">
      <div class="kpi-card-header">
        <span class="kpi-label">Tổng chi tiêu</span>
        <div class="kpi-icon">${ICON_SPEND}</div>
      </div>
      <div class="kpi-value" id="kpiTotalSpendVal">${escapeHtml(formatVND(metrics.totalSpend))}</div>
      <div class="kpi-footer">${totalSpendDeltaHtml}</div>
    </div>

    <div class="kpi-card" id="kpiThisMonth" role="button" tabindex="0"
      aria-label="Chi tiêu tháng này: ${formatVND(metrics.thisMonthSpend)}. Bấm để lọc đơn hàng tháng này"
      title="Bấm để lọc đơn hàng tháng này">
      <div class="kpi-card-header">
        <span class="kpi-label">Chi tiêu tháng này</span>
        <div class="kpi-icon">${ICON_CALENDAR}</div>
      </div>
      <div class="kpi-value" id="kpiThisMonthVal">${escapeHtml(formatVND(metrics.thisMonthSpend))}</div>
      <div class="kpi-footer">${monthSpendDeltaHtml}</div>
    </div>

    <div class="kpi-card" id="kpiTotalOrders" role="button" tabindex="0"
      aria-label="Tổng đơn hàng: ${metrics.totalOrders}. Bấm để xem danh sách đơn hàng"
      title="Bấm để kiểm tra danh sách đơn hàng">
      <div class="kpi-card-header">
        <span class="kpi-label">Tổng đơn hàng</span>
        <div class="kpi-icon">${ICON_BAG}</div>
      </div>
      <div class="kpi-value" id="kpiTotalOrdersVal">${metrics.totalOrders.toLocaleString('vi-VN')} <span class="kpi-unit">đơn</span></div>
      <div class="kpi-footer">${completionRateDeltaHtml}</div>
    </div>

    <div class="kpi-card" id="kpiAvgOrder" role="button" tabindex="0"
      aria-label="Giá trung bình trên mỗi đơn: ${formatVND(metrics.avgOrderValue)}. Bấm để kiểm tra đơn hàng"
      title="Bấm để kiểm tra đơn hàng">
      <div class="kpi-card-header">
        <span class="kpi-label">Giá trung bình / đơn</span>
        <div class="kpi-icon">${ICON_TREND}</div>
      </div>
      <div class="kpi-value" id="kpiAvgOrderVal">${escapeHtml(formatVND(metrics.avgOrderValue))}</div>
      <div class="kpi-footer">${avgOrderDeltaHtml}</div>
    </div>
  `;

  // Bind click listeners for Tab 3 drill-down
  const cardTotal = container.querySelector('#kpiTotalSpend');
  cardTotal?.addEventListener('click', () => {
    onDrillDown({ time: { kind: 'all' } });
  });

  const cardMonth = container.querySelector('#kpiThisMonth');
  cardMonth?.addEventListener('click', () => {
    onDrillDown({
      time: {
        kind: 'month',
        year: metrics.currentYear,
        month: metrics.currentMonth,
      },
    });
  });

  const cardOrders = container.querySelector('#kpiTotalOrders');
  cardOrders?.addEventListener('click', () => {
    onDrillDown({ time: { kind: 'all' } });
  });

  const cardAvg = container.querySelector('#kpiAvgOrder');
  cardAvg?.addEventListener('click', () => {
    onDrillDown({ time: { kind: 'all' } });
  });
}

/**
 * Renders the 35% Financial Health Card with circular SVG budget ring or proactive callout.
 */
export function renderFinancialHealthCard(
  container: HTMLElement,
  metrics: OverviewMetrics,
  budgetConfig: BudgetConfig,
  onOpenBudgetModal: () => void
): void {
  if (!budgetConfig.enabled) {
    // Proactive setup callout state
    container.innerHTML = `
      <div class="budget-setup-callout">
        <div class="budget-callout-header">
          <div class="card-heading">Sức khỏe tài chính tháng này</div>
        </div>
        <div class="budget-callout-body">
          <div class="budget-callout-icon">${ICON_TARGET}</div>
          <p class="budget-callout-title">Chưa thiết lập ngân sách</p>
          <p class="budget-callout-desc">Đặt hạn mức chi tiêu hàng tháng trên Shopee để theo dõi tốc độ mua sắm và nhận cảnh báo khi sắp vượt ngưỡng an toàn.</p>
          <button class="btn-edit-budget btn-setup-budget" id="btnSetupBudget" type="button" aria-label="Thiết lập ngân sách ngay">
            ${ICON_PENCIL}
            <span>Thiết lập ngân sách ngay</span>
          </button>
        </div>
      </div>
    `;

    const setupBtn = container.querySelector('#btnSetupBudget');
    setupBtn?.addEventListener('click', onOpenBudgetModal);
    return;
  }

  // Budget enabled: render circular SVG ring, stats, and pacing
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ≈ 226.195
  const clampedPct = Math.min(100, Math.max(0, metrics.budgetPct));
  const offset = circumference - (circumference * (clampedPct / 100));

  const isAlert = metrics.budgetPct >= Math.round(budgetConfig.alertThreshold * 100);
  const ringColor = isAlert
    ? 'var(--status-cancelled, #ef4444)'
    : metrics.budgetPct >= 70
      ? 'var(--warning, #f97316)'
      : 'var(--primary, #f97316)';

  const remainingHtml = metrics.budgetRemaining >= 0
    ? `<span class="badge badge-shipping">Còn lại: ${escapeHtml(formatVND(metrics.budgetRemaining))}</span>`
    : `<span class="badge badge-over-budget">Vượt ngân sách: ${escapeHtml(formatVND(Math.abs(metrics.budgetRemaining)))}</span>`;

  // Forecast text & styling
  const isOverForecast = metrics.monthEndForecast > budgetConfig.monthlyLimit;
  const forecastClass = isOverForecast ? 'forecast-over' : 'forecast-normal';
  const forecastText = isOverForecast
    ? `${formatVND(metrics.monthEndForecast)} (Vượt ${Math.round(((metrics.monthEndForecast - budgetConfig.monthlyLimit) / budgetConfig.monthlyLimit) * 100)}%)`
    : `${formatVND(metrics.monthEndForecast)} (Trong hạn mức)`;

  container.innerHTML = `
    <div class="health-card-content">
      <div class="card-heading">Sức khỏe tài chính tháng này</div>
      <div class="budget-ring-row">
        <div class="budget-ring-container">
          <svg class="budget-ring-svg" viewBox="0 0 90 90">
            <circle class="budget-ring-bg" cx="45" cy="45" r="${radius}" />
            <circle id="budgetRingCircle" class="budget-ring-fill" cx="45" cy="45" r="${radius}"
              style="stroke-dasharray: ${circumference.toFixed(1)}; stroke-dashoffset: ${offset.toFixed(1)}; stroke: ${ringColor};" />
          </svg>
          <div class="ring-center-text" id="ringPercentText">${metrics.budgetPct}%</div>
        </div>
        <div class="budget-details">
          <div class="budget-spent-val" id="budgetSpentText">${escapeHtml(formatVND(metrics.thisMonthSpend))}</div>
          <div class="budget-limit-val" id="budgetLimitText">trên hạn mức ${escapeHtml(formatVND(budgetConfig.monthlyLimit))}</div>
          ${remainingHtml}
        </div>
      </div>

      <div class="stat-list">
        <div class="stat-row">
          <span style="color:var(--text-muted);">Tốc độ chi tiêu:</span>
          <span class="val">~${escapeHtml(formatVND(metrics.burnRate))} / ngày</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--text-muted);">Dự báo cuối tháng:</span>
          <span class="val ${forecastClass}">${escapeHtml(forecastText)}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--text-muted);">Số ngày còn lại:</span>
          <span class="val">${metrics.daysRemaining} ngày</span>
        </div>
      </div>
    </div>

    <button class="btn-edit-budget" id="btnEditBudget" type="button" aria-label="Chỉnh sửa hạn mức ngân sách">
      ${ICON_PENCIL}
      <span>Chỉnh sửa hạn mức ngân sách</span>
    </button>
  `;

  const editBtn = container.querySelector('#btnEditBudget');
  editBtn?.addEventListener('click', onOpenBudgetModal);
}

/**
 * Opens and initializes the budget dialog with current configuration.
 */
export function openBudgetModal(config: BudgetConfig): void {
  const dialog = document.getElementById('budgetDialog') as HTMLDialogElement | null;
  if (!dialog) return;

  const limitInput = document.getElementById('budgetLimit') as HTMLInputElement | null;
  const thresholdInput = document.getElementById('budgetThreshold') as HTMLInputElement | null;
  const thresholdVal = document.getElementById('budgetThresholdValue');
  const enabledInput = document.getElementById('budgetEnabled') as HTMLInputElement | null;

  if (limitInput) limitInput.value = String(config.monthlyLimit ?? 5000000);
  if (thresholdInput) {
    const pct = Math.round((config.alertThreshold ?? 0.8) * 100);
    thresholdInput.value = String(pct);
    if (thresholdVal) thresholdVal.textContent = pct + '%';
  }
  if (enabledInput) enabledInput.checked = config.enabled;

  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', 'true');
  }
}

/**
 * Top-level orchestration function called on every filter update or budget change.
 */
export function renderOverview(options: {
  filteredOrders: Order[];
  allOrders: Order[];
  budgetConfig: BudgetConfig;
  now?: Date;
  onDrillDown?: (preset: Partial<FilterCriteria>) => void;
  onOpenBudgetModal?: () => void;
}): void {
  const {
    filteredOrders,
    allOrders,
    budgetConfig,
    now = new Date(),
    onDrillDown = (preset) => {
      switchTab(3, preset);
    },
    onOpenBudgetModal = () => {
      openBudgetModal(budgetConfig);
    },
  } = options;

  const metrics = computeOverviewMetrics(filteredOrders, allOrders, budgetConfig, now);

  const kpiContainer = document.getElementById('kpiStrip');
  if (kpiContainer) {
    renderKPIStrip(kpiContainer, metrics, budgetConfig, onDrillDown);
  }

  const healthContainer = document.getElementById('financialHealthCard');
  if (healthContainer) {
    renderFinancialHealthCard(healthContainer, metrics, budgetConfig, onOpenBudgetModal);
  }
}
