import type { ComponentType } from 'react';
import { OverviewTab } from './tabs/OverviewTab';
import { OrdersTab } from './tabs/OrdersTab';
import { AnalysisTab } from './tabs/AnalysisTab';

export type TabId = 'overview' | 'analysis' | 'orders';

export interface TabDef {
  id: TabId;
  label: string;
  /** Rendered inside <DashboardContext>, so it may call useDashboard(). */
  Component: ComponentType;
}

/** The dashboard screens, in tab order. #34 and #35 swap the placeholders for the real screens. */
export const TABS: TabDef[] = [
  { id: 'overview', label: 'dash.tab.overview', Component: OverviewTab },
  {
    id: 'analysis',
    label: 'dash.tab.analysis',
    Component: AnalysisTab,
  },
  { id: 'orders', label: 'dash.tab.orders', Component: OrdersTab },
];
