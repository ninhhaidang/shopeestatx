import { Tabs, TabsList, TabsPanel, TabsTab } from '@ui-sdk/react/tabs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { monthOf, orderYears } from '../dashboard/month.js';
import { shareDataOf } from '../dashboard/share-image.js';
import { tierBetween } from '../dashboard/tier.js';
import { needsRescan } from '../dashboard/stats.js';
import { filterByRange, resolveRange, type RangeSelection } from '../dashboard/range.js';
import { t } from '../i18n/index.js';
import { Button } from '../ui/components/Button';
import { Logo } from '../ui/components/Logo';
import { StateMessage } from '../ui/components/StateMessage';
import { ThemeToggle } from '../ui/components/ThemeToggle';
import { AccountChip } from './AccountChip';
import { DashboardContext, type OrdersFilter } from './context';
import type { DashboardHost } from './host';
import { OverviewSkeleton } from './OverviewSkeleton';
import { RangePicker } from './RangePicker';
import { loadShareStyle, saveShareStyle, type ShareStyle } from './share-style';
import { ShareDialog, type ShareOption } from './tabs/overview/ShareDialog';
import { TABS, type TabId } from './tabs';
import { formatUpdated } from './updated';
import { useOrderData } from './useOrderData';

const ALL_TIME: RangeSelection = { preset: 'all' };
const currentTime = () => new Date();

/**
 * Dashboard root: top bar (logo, tabs, global date range, refresh, share image, theme) and the active screen.
 * One layout for every width: below the container's 48rem the tabs take their own row under the logo
 * and the toolbar wraps under them (container queries, ADR-0002).
 */
export function Dashboard({ host, now = currentTime }: { host: DashboardHost; now?: () => Date }) {
  const orderData = useOrderData(host);
  const { phase, data, refreshing, notice, progress, stalled, scanning } = orderData;
  const [tab, setTab] = useState<TabId>('overview');
  // Set only by "open these orders" links; any other way into a tab starts unfiltered.
  const [ordersFilter, setOrdersFilter] = useState<OrdersFilter>({});
  const openTab = (id: TabId) => {
    setOrdersFilter({});
    setTab(id);
  };
  const [selection, setSelection] = useState<RangeSelection>(ALL_TIME);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [inSidePanel, setInSidePanel] = useState(false);
  useEffect(() => {
    host.inSidePanel?.().then(setInSidePanel, () => {});
  }, [host]);

  const [clock, setClock] = useState(now);
  useEffect(() => {
    const sync = () => setClock(now());
    sync();
    const timer = window.setInterval(sync, 60_000);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [now, data]);
  const range = useMemo(() => resolveRange(selection, clock), [selection, clock]);
  const years = useMemo(() => (data ? orderYears(data.orders) : []), [data]);
  const orders = useMemo(() => (data ? filterByRange(data.orders, range) : []), [data, range]);
  const stale = useMemo(() => (data ? needsRescan(data.orders) : false), [data]);
  // The image leads with the latest year that has orders: a year-end summary.
  const yearShare = useMemo(() => {
    const year = years[0];
    if (!data || year === undefined) return null;
    const tier = tierBetween(data.orders, new Date(year, 0, 1), new Date(year, 11, 31));
    const share = shareDataOf(data.orders.filter(o => monthOf(o)?.year === year), !stale, tier, year);
    return share.orders > 0 ? { year, data: share } : null;
  }, [data, years, stale]);
  const canShare = phase === 'ready' && (yearShare !== null || orders.length > 0);
  const [sharing, setSharing] = useState(false);
  const [shareStyle, setShareStyleState] = useState(loadShareStyle);
  const setShareStyle = (next: ShareStyle) => {
    setShareStyleState(next);
    saveShareStyle(next);
  };
  const sharedOnOpen = useRef(false);
  useEffect(() => {
    if (!host.shareOnOpen || sharedOnOpen.current || !canShare) return;
    sharedOnOpen.current = true;
    setSharing(true);
  }, [host, canShare]);
  const shareOptions = useMemo(() => {
    if (!sharing || !canShare) return null;
    const options: ShareOption[] = [];
    if (yearShare) options.push({ key: 'year', label: t('share.period.year', { year: yearShare.year }), data: yearShare.data });
    if (orders.length > 0) options.push({ key: 'range', label: t('share.period.range'), data: shareDataOf(orders, !stale, data ? tierBetween(data.orders, range.start, range.end) : null) });
    return options;
  }, [sharing, canShare, yearShare, orders, stale, data, range]);
  const context = useMemo(() => {
    if (!data) return null;
    const showOrders = (filter: OrdersFilter) => {
      setOrdersFilter(filter);
      setTab('orders');
      // The clicked row unmounts with the tab; keep focus on the tab it led to.
      tabRefs.current.orders?.focus();
    };
    return { data, orders, range, selection, setSelection, resetRange: () => setSelection(ALL_TIME), now: clock, refresh: orderData.refresh, ordersFilter, showOrders, yearShare, shareStyle, openShare: () => setSharing(true) };
  }, [data, orders, range, selection, clock, ordersFilter, yearShare, shareStyle]);

  const stamp = data?.cachedAt ?? data?.fetchedAt;
  const progressText =
    progress !== null ? t('dash.progress', { count: progress })
    : scanning ? t('dash.connecting')
    : undefined;
  const status = refreshing ? (progressText ?? t('dash.refreshing')) : notice?.text;

  let content;
  if (phase === 'loading') {
    content = (
      <>
        <OverviewSkeleton message={progressText} />
        {stalled && <p className="mt-3 text-sm text-warn-fg">{t('dash.stalled')}</p>}
      </>
    );
  } else if (phase === 'error') {
    content = (
      <StateMessage tone="error" title={t('dash.error.title')} message={orderData.error} action={{ label: t('dash.error.retry'), onClick: orderData.refresh }} />
    );
  } else if (phase === 'empty' || !context) {
    content = (
      <StateMessage title={t('dash.empty.title')} message={t('dash.empty.message')} action={{ label: t('dash.empty.action'), onClick: orderData.refresh }} />
    );
  } else {
    const Active = TABS.find((def) => def.id === tab)!.component;
    content = (
      <DashboardContext.Provider value={context}>
        <Active />
      </DashboardContext.Provider>
    );
  }

  return (
    <div className="@container h-dvh bg-bg text-fg">
      <Tabs
        value={tab}
        onValueChange={next => next && openTab(next)}
        loop
        className="grid h-full min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_auto_minmax(0,1fr)] @3xl:grid-cols-[auto_minmax(0,1fr)_auto] @3xl:grid-rows-[auto_auto_minmax(0,1fr)] @6xl:grid-cols-[auto_minmax(0,1fr)_auto_auto] @6xl:grid-rows-[auto_minmax(0,1fr)]"
      >
        <div className="col-start-1 row-start-1 flex items-center px-4 pt-3 @3xl:py-3">
          <Logo />
        </div>

        <nav
          className="col-span-full row-start-2 mt-1 border-b border-line @3xl:mt-0 @3xl:border-0 @3xl:[grid-column:2] @3xl:row-start-1 @3xl:self-center"
        >
          <TabsList aria-label={t('dash.tabs.label')} className="flex @3xl:gap-1">
            {TABS.map(def => (
              <TabsTab
                key={def.id}
                value={def.id}
                ref={(el: HTMLButtonElement | null) => {
                  tabRefs.current[def.id] = el;
                }}
                className={({ selected }) =>
                  `-mb-px flex-1 cursor-pointer px-3 py-2.5 text-sm @3xl:mb-0 @3xl:flex-none @3xl:rounded-lg @3xl:py-1.5 ${
                    selected
                      ? 'border-b-2 border-accent-text font-semibold text-accent-text @3xl:border-b-0 @3xl:bg-card @3xl:text-fg @3xl:shadow-[0_0_0_1px_var(--line)]'
                      : 'border-b-2 border-transparent text-muted hover:text-fg @3xl:border-b-0'
                  }`
                }
              >
                {t(def.label)}
              </TabsTab>
            ))}
          </TabsList>
        </nav>

        <div className="col-span-full row-start-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-3 pb-3 @3xl:row-start-2 @3xl:pt-0 @6xl:[grid-column:3] @6xl:row-start-1 @6xl:p-3">
          <RangePicker value={selection} onChange={setSelection} years={years} now={clock} />
          {/* Under 28rem (side panel) the label hides so the update time fits on the same row. */}
          <Button variant="outline" className="inline-flex items-center gap-1.5 @max-md:p-1.5" title={t('dash.refresh')} disabled={phase === 'loading' || refreshing} onClick={orderData.refresh}>
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`size-4 ${refreshing ? 'motion-safe:animate-spin' : ''}`}>
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" />
            </svg>
            <span className="@max-md:sr-only">{t('dash.refresh')}</span>
          </Button>
          {canShare && (
            <Button variant="solid" className="inline-flex items-center gap-1.5" onClick={() => setSharing(true)}>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M2.5 5.5a1 1 0 0 1 1-1h2l1-1.5h3l1 1.5h2a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z" />
                <circle cx="8" cy="8.5" r="2.25" />
              </svg>
              {t('share.open')}
            </Button>
          )}
          <div className="order-2 flex flex-col text-xs text-muted @3xl:order-none">
            {stamp && <span>{formatUpdated(stamp, clock)}</span>}
            <span role="status" className={notice?.kind === 'error' ? 'text-bad' : undefined}>{status}</span>
          </div>
        </div>

        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3 justify-self-end px-4 py-3 @3xl:col-start-3 @6xl:col-start-4">
          {data?.user && <AccountChip user={data.user} />}
          <ThemeToggle />
          {inSidePanel && host.openInTab && (
            <Button variant="outline" className="p-1.5" aria-label={t('dash.openInTab')} title={t('dash.openInTab')} onClick={host.openInTab}>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" />
              </svg>
            </Button>
          )}
        </div>

        <main
          // relative: absolute children (sr-only labels) must be clipped here, or they stretch the page and add a 2nd scrollbar.
          className="relative col-span-full row-start-4 min-h-0 min-w-0 overflow-y-auto px-4 pb-8 pt-2 outline-none @3xl:row-start-3 @3xl:px-6 @6xl:row-start-2"
        >
          {TABS.map(def => (
            <TabsPanel key={def.id} value={def.id} className="mx-auto max-w-[104rem] outline-none">
              {content}
            </TabsPanel>
          ))}
        </main>
      </Tabs>
      {shareOptions && <ShareDialog options={shareOptions} style={shareStyle} onStyle={setShareStyle} onClose={() => setSharing(false)} />}
    </div>
  );
}
