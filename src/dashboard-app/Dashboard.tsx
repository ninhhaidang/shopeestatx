import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { orderYears } from '../dashboard/month.js';
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
import { TABS, type TabId } from './tabs';
import { formatUpdated } from './updated';
import { useOrderData } from './useOrderData';

const ALL_TIME: RangeSelection = { preset: 'all' };
const currentTime = () => new Date();

/**
 * Dashboard root: top bar (logo, tabs, global date range, refresh, theme) and the active screen.
 * One layout for every width: below the container's 48rem the tabs drop to a bottom bar and the
 * toolbar wraps under the logo (container queries, ADR-0002).
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
  const context = useMemo(() => {
    if (!data) return null;
    const showOrders = (filter: OrdersFilter) => {
      setOrdersFilter(filter);
      setTab('orders');
      // The clicked row unmounts with the tab; keep focus on the tab it led to.
      tabRefs.current.orders?.focus();
    };
    return { data, orders, range, selection, setSelection, resetRange: () => setSelection(ALL_TIME), now: clock, refresh: orderData.refresh, ordersFilter, showOrders };
  }, [data, orders, range, selection, clock, ordersFilter]);

  const onTabKeyDown = (e: KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    openTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

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
      <div className="grid h-full min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] @3xl:grid-cols-[auto_minmax(0,1fr)_auto] @3xl:grid-rows-[auto_auto_minmax(0,1fr)] @6xl:grid-cols-[auto_minmax(0,1fr)_auto_auto] @6xl:grid-rows-[auto_minmax(0,1fr)]">
        <div className="col-start-1 row-start-1 flex items-center px-4 pt-3 @3xl:py-3">
          <Logo />
        </div>

        <nav
          className="col-span-full row-start-5 border-t border-line bg-card @3xl:border-0 @3xl:bg-transparent @3xl:[grid-column:2] @3xl:row-start-1 @3xl:self-center"
        >
          <div role="tablist" aria-label={t('dash.tabs.label')} className="flex @3xl:gap-1">
            {TABS.map((def, i) => {
              const selected = def.id === tab;
              return (
                <button
                  key={def.id}
                  ref={el => {
                    tabRefs.current[def.id] = el;
                  }}
                  role="tab"
                  type="button"
                  id={`tab-${def.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${def.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => openTab(def.id)}
                  onKeyDown={e => onTabKeyDown(e, i)}
                  className={`flex-1 cursor-pointer px-3 py-3 text-sm @3xl:flex-none @3xl:rounded-lg @3xl:py-1.5 ${
                    selected
                      ? 'border-t-2 border-accent-text font-semibold text-accent-text @3xl:border-t-0 @3xl:bg-card @3xl:text-fg @3xl:shadow-[0_0_0_1px_var(--line)]'
                      : 'border-t-2 border-transparent text-muted hover:text-fg @3xl:border-t-0'
                  }`}
                >
                  {t(def.label)}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="col-span-full row-start-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-3 @3xl:row-start-2 @6xl:[grid-column:3] @6xl:row-start-1 @6xl:p-3">
          <RangePicker value={selection} onChange={setSelection} years={years} now={clock} />
          <Button variant="outline" disabled={phase === 'loading' || refreshing} onClick={orderData.refresh}>
            {t('dash.refresh')}
          </Button>
          <div className="flex flex-col text-xs text-muted">
            {stamp && <span>{formatUpdated(stamp, clock)}</span>}
            <span role="status" className={notice?.kind === 'error' ? 'text-bad' : undefined}>{status}</span>
          </div>
        </div>

        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3 justify-self-end px-4 py-3 @3xl:col-start-3 @6xl:col-start-4">
          {data?.user && <AccountChip user={data.user} />}
          <ThemeToggle />
        </div>

        <main
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={-1}
          // relative: absolute children (sr-only labels) must be clipped here, or they stretch the page and add a 2nd scrollbar.
          className="relative col-span-full row-start-4 min-h-0 min-w-0 overflow-y-auto px-4 pb-8 pt-2 outline-none @3xl:row-start-3 @3xl:px-6 @6xl:row-start-2"
        >
          <div className="mx-auto max-w-[104rem]">{content}</div>
        </main>
      </div>
    </div>
  );
}
