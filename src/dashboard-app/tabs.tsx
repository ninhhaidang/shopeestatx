import type { ComponentType } from 'react';
import { AnalysisTab } from './tabs/AnalysisTab';
import { OrdersTab } from './tabs/OrdersTab';
import { OverviewTab } from './tabs/OverviewTab';

export type TabId = 'overview' | 'analysis' | 'orders';

export interface TabDef {
  id: TabId;
  label: string;
  /** Rendered inside <DashboardContext>, so it may call useDashboard(). */
  component: ComponentType;
}

/** The dashboard screens, in tab order. */
export const TABS: TabDef[] = [
  { id: 'overview', label: 'dash.tab.overview', component: OverviewTab },
  { id: 'analysis', label: 'dash.tab.analysis', component: AnalysisTab },
  { id: 'orders', label: 'dash.tab.orders', component: OrdersTab },
];
