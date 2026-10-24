import type { ComponentType } from 'react';
import { t } from '../i18n/index.js';
import { OverviewTab } from './tabs/OverviewTab';
import { OrdersTab } from './tabs/OrdersTab';
import { PlaceholderTab } from './tabs/PlaceholderTab';

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
    Component: () => <PlaceholderTab title={t('dash.tab.analysis')} message={t('dash.placeholder.analysis')} />,
  },
  { id: 'orders', label: 'dash.tab.orders', Component: OrdersTab },
];
