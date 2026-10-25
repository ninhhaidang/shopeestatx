import type { ComponentType } from 'react';
import type { DisplayStyle } from '../ui/theme/style';
import { AnalysisTab } from './tabs/AnalysisTab';
import { AnalysisTabWarm } from './tabs/analysis/AnalysisTabWarm';
import { OrdersTab } from './tabs/OrdersTab';
import { OrdersTabWarm } from './tabs/orders/OrdersTabWarm';
import { OverviewTab } from './tabs/OverviewTab';
import { OverviewTabWarm } from './tabs/overview/OverviewTabWarm';

export type TabId = 'overview' | 'analysis' | 'orders';

export interface TabDef {
  id: TabId;
  label: string;
  /** Rendered inside <DashboardContext>, so it may call useDashboard(). */
  fintech: ComponentType;
  warm: ComponentType;
}

/** The dashboard screens, in tab order, one component per display-style. */
export const TABS: TabDef[] = [
  { id: 'overview', label: 'dash.tab.overview', fintech: OverviewTab, warm: OverviewTabWarm },
  { id: 'analysis', label: 'dash.tab.analysis', fintech: AnalysisTab, warm: AnalysisTabWarm },
  { id: 'orders', label: 'dash.tab.orders', fintech: OrdersTab, warm: OrdersTabWarm },
];

/** Pure (tabId, displayStyle) -> component lookup, so adding a third style never touches Dashboard.tsx. */
export function resolveTabComponent(tabId: TabId, style: DisplayStyle): ComponentType {
  const def = TABS.find((d) => d.id === tabId)!;
  return style === 'warm' ? def.warm : def.fintech;
}
