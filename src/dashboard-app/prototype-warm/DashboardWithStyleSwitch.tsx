// PROTOTYPE — throwaway. Bản sao tối giản của Dashboard.tsx thật, chỉ để trả lời câu hỏi
// "Phân tích/Đơn hàng trông thế nào ở display-style warm". KHÔNG sửa Dashboard.tsx/tabs.tsx thật —
// mount component này thay vì <Dashboard> trong dev-preview khi muốn xem song song fintech/warm.
// Xem docs/adr/0003-display-style-independent-of-theme.md.
import { useMemo, useState } from 'react';
import { filterByRange, resolveRange, type RangeSelection } from '../../dashboard/range.js';
import { Button } from '../../ui/components/Button';
import { Logo } from '../../ui/components/Logo';
import { StateMessage } from '../../ui/components/StateMessage';
import { ThemeToggle } from '../../ui/components/ThemeToggle';
import { DashboardContext } from '../context';
import type { DashboardHost } from '../host';
import { OverviewSkeleton } from '../OverviewSkeleton';
import { OverviewTab } from '../tabs/OverviewTab';
import { useOrderData } from '../useOrderData';
import { AnalysisTabWarm } from './AnalysisTab.warm.prototype';
import { OrdersTabWarm } from './OrdersTab.warm.prototype';
import { AnalysisTab } from '../tabs/AnalysisTab';
import { OrdersTab } from '../tabs/OrdersTab';
import { StyleSwitcher, readStyleFromUrl, type StyleKey } from './StyleSwitcher';
import './warm.prototype.css';

const ALL_TIME: RangeSelection = { preset: 'all' };
type TabId = 'overview' | 'analysis' | 'orders';
const TAB_LABEL: Record<TabId, string> = { overview: 'Tổng quan', analysis: 'Phân tích', orders: 'Đơn hàng' };

export function DashboardWithStyleSwitch({ host, now = () => new Date() }: { host: DashboardHost; now?: () => Date }) {
  const orderData = useOrderData(host);
  const { phase, data } = orderData;
  const [tab, setTab] = useState<TabId>('analysis');
  const [selection] = useState<RangeSelection>(ALL_TIME);
  const [style, setStyle] = useState<StyleKey>(readStyleFromUrl());

  const clock = useMemo(() => now(), [data]);
  const range = useMemo(() => resolveRange(selection, clock), [selection, clock]);
  const orders = useMemo(() => (data ? filterByRange(data.orders, range) : []), [data, range]);
  const context = useMemo(
    () => (data ? { data, orders, range, selection, resetRange: () => {}, now: clock, refresh: orderData.refresh } : null),
    [data, orders, range, selection, clock],
  );

  let content;
  if (phase === 'loading') content = <OverviewSkeleton />;
  else if (!context) content = <StateMessage title="Không có dữ liệu" message="" action={{ label: 'Thử lại', onClick: orderData.refresh }} />;
  else {
    const Active =
      tab === 'overview' ? OverviewTab
      : tab === 'analysis' ? (style === 'warm' ? AnalysisTabWarm : AnalysisTab)
      : style === 'warm' ? OrdersTabWarm : OrdersTab;
    content = (
      <DashboardContext.Provider value={context}>
        <Active />
      </DashboardContext.Provider>
    );
  }

  return (
    <div className="h-dvh bg-bg text-fg" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--line)' }}>
        <Logo />
        <div role="tablist" style={{ display: 'flex', gap: '0.25rem' }}>
          {(['overview', 'analysis', 'orders'] as TabId[]).map(id => (
            <Button key={id} variant={tab === id ? 'primary' : 'outline'} className="!w-auto !px-3 !py-1.5" onClick={() => setTab(id)}>
              {TAB_LABEL[id]}
            </Button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}><ThemeToggle /></div>
      </div>
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>{content}</div>
      </main>
      <StyleSwitcher style={style} onChange={setStyle} />
    </div>
  );
}
