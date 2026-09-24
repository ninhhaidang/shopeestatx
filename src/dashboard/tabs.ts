/**
 * ShopeeStatX/tabs.ts — Top-level tabbed navigation orchestrator
 *
 * Coordinates tab visibility transitions between:
 * - Tab 1: Tổng quan (Financial Overview) [#tabOverview / #tabPanel1]
 * - Tab 2: Phân tích & Thói quen (Analytics & Habits) [#tabAnalytics / #tabPanel2]
 * - Tab 3: Lịch sử đơn hàng (Order History & Audit) [#tabOrders / #tabPanel3]
 */

import type { TabIndex, FilterCriteria } from '../types/index.js';
import { state } from './state.js';
import { applyFilters, syncCriteriaToToolbar, handleDrillDown } from './filters.js';
import { renderCharts } from './charts.js';
import { getCategoryBreakdown, renderCategoryChart } from './categories.js';

/** Canonical DOM element IDs for tab panels */
const PANEL_IDS: Record<TabIndex, [string, string]> = {
  1: ['tabOverview', 'tabPanel1'],
  2: ['tabAnalytics', 'tabPanel2'],
  3: ['tabOrders', 'tabPanel3'],
};

/** Get the tab navigation button element for a tab index */
function getTabButton(tabIndex: TabIndex): HTMLElement | null {
  return (
    document.getElementById(`tabBtn${tabIndex}`) ||
    document.querySelector<HTMLElement>(`[data-tab="${tabIndex}"]`)
  );
}

/**
 * Update the tab badge count on Tab 3 (Lịch sử đơn hàng).
 */
export function updateTabOrderBadge(count?: number): void {
  const badge = document.getElementById('tabOrderCount');
  if (badge) {
    const resolvedCount = count !== undefined ? count : (state.filteredOrders?.length ?? 0);
    badge.textContent = String(resolvedCount);
  }
}

/**
 * Orchestrate tab visibility and transition state across all 3 dashboard views.
 *
 * @param tabIndex 1 | 2 | 3 view index
 * @param filterPreset Optional filter criteria updates to merge and evaluate
 */
export function switchTab(tabIndex: TabIndex, filterPreset?: Partial<FilterCriteria>): void {
  state.activeTab = tabIndex;

  // 1. Update tab navigation buttons
  ([1, 2, 3] as TabIndex[]).forEach(i => {
    const btn = getTabButton(i);
    if (btn) {
      const isActive = i === tabIndex;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }
  });

  // 2. Update tab panel visibility
  ([1, 2, 3] as TabIndex[]).forEach(i => {
    const [primaryId, fallbackId] = PANEL_IDS[i];
    const panel = document.getElementById(primaryId) || document.getElementById(fallbackId);
    if (panel) {
      panel.classList.toggle('active', i === tabIndex);
    }
  });

  // 3. Apply filter preset if provided (e.g. drill-down from KPI card to Tab 3)
  if (filterPreset) {
    state.criteria = {
      ...state.criteria,
      ...filterPreset,
    };
    state.currentPage = 1;
    syncCriteriaToToolbar(state.criteria);
    applyFilters({ syncFromDOM: false });
  }

  // 4. Update tab badge
  updateTabOrderBadge();

  // 5. Redraw charts if switching to a tab containing Chart.js canvases (fixes 0x0 hidden canvas dimensions)
  if (state.filteredOrders.length > 0) {
    try {
      if (tabIndex === 1 || tabIndex === 2) {
        renderCharts(state.filteredOrders, handleDrillDown);
      }
      if (tabIndex === 2) {
        const catCanvas = document.getElementById('categoryChart') as HTMLCanvasElement | null;
        if (catCanvas) {
          renderCategoryChart(catCanvas, getCategoryBreakdown(state.filteredOrders), (cat) => {
            switchTab(3, { category: cat });
          });
        }
      }
    } catch (err) {
      // Non-fatal if canvas context is unavailable (e.g. headless jsdom test environment)
      console.warn('Could not redraw charts on tab switch:', err);
    }
  }
}

/**
 * Initialize tab navigation event listeners and initial active state.
 */
export function initTabs(): void {
  ([1, 2, 3] as TabIndex[]).forEach(i => {
    const btn = getTabButton(i);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(i);
      });
    }
  });

  // Synchronize initial tab DOM state
  switchTab(state.activeTab ?? 1);
  updateTabOrderBadge();
}
