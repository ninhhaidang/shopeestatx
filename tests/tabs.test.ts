import { describe, expect, it } from 'vitest';
import { AnalysisTab } from '../src/dashboard-app/tabs/AnalysisTab';
import { AnalysisTabWarm } from '../src/dashboard-app/tabs/analysis/AnalysisTabWarm';
import { OrdersTab } from '../src/dashboard-app/tabs/OrdersTab';
import { OrdersTabWarm } from '../src/dashboard-app/tabs/orders/OrdersTabWarm';
import { OverviewTab } from '../src/dashboard-app/tabs/OverviewTab';
import { OverviewTabWarm } from '../src/dashboard-app/tabs/overview/OverviewTabWarm';
import { resolveTabComponent, type TabId } from '../src/dashboard-app/tabs';
import type { DisplayStyle } from '../src/ui/theme/style';

const CASES: Array<[TabId, DisplayStyle, unknown]> = [
  ['overview', 'fintech', OverviewTab],
  ['overview', 'warm', OverviewTabWarm],
  ['analysis', 'fintech', AnalysisTab],
  ['analysis', 'warm', AnalysisTabWarm],
  ['orders', 'fintech', OrdersTab],
  ['orders', 'warm', OrdersTabWarm],
];

describe('resolveTabComponent', () => {
  it.each(CASES)('%s / %s resolves to the expected component', (tabId, style, expected) => {
    expect(resolveTabComponent(tabId, style)).toBe(expected);
  });
});
