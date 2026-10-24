import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { orderYears } from '../dashboard/month.js';
import { filterByRange, resolveRange, type RangeSelection } from '../dashboard/range.js';
import { t } from '../i18n/index.js';
import { Button } from '../ui/components/Button';
import { Logo } from '../ui/components/Logo';
import { StateMessage } from '../ui/components/StateMessage';
import { ThemeToggle } from '../ui/components/ThemeToggle';
import { AccountChip } from './AccountChip';
import { DashboardContext } from './context';
import type { DashboardHost } from './host';
import { OverviewSkeleton } from './OverviewSkeleton';
import { RangePicker } from './RangePicker';
import { TABS, type TabId } from './tabs';
import { formatUpdated } from './updated';
import { useOrderData } from './useOrderData';

const ALL_TIME: RangeSelection = { preset: 'all' };

/**
 * Dashboard root: top bar (logo, tabs, global date range, refresh, theme) and the active screen.
 * One layout for every width: below the container's 42rem the tabs drop to a bottom bar and the
 * toolbar wraps under the logo (container queries, ADR-0002).
 */
export function Dashboard({ host, now = () => new Date() }: { host: DashboardHost; now?: () => Date }) {
  const orderData = useOrderData(host);
  const { phase, data, refreshing, notice, progress, stalled, scanning } = orderData;
  const [tab, setTab] = useState<TabId>('overview');
  const [selection, setSelection] = useState<RangeSelection>(ALL_TIME);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Re-read the clock whenever fresh data arrives, so "Cập nhật" and the month comparison stay current.
  const clock = useMemo(() => now(), [data]);
  const range = useMemo(() => resolveRange(selection, clock), [selection, clock]);
  const years = useMemo(() => (data ? orderYears(data.orders) : []), [data]);
  const orders = useMemo(() => (data ? filterByRange(data.orders, range) : []), [data, range]);
  const context = useMemo(
    () => (data ? { data, orders, range, selection, resetRange: () => setSelection(ALL_TIME), now: clock, refresh: orderData.refresh } : null),
      [data, orders, range, selection, clock],
  );

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
    setTab(TABS[next].id);
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
    const Active = TABS.find(def => def.id === tab)!.Component;
    content = (
      <DashboardContext.Provider value={context}>
        <Active />
      </DashboardContext.Provider>
    );
  }

  return (
    <div className="@container h-dvh bg-bg text-fg">
      <div className="grid h-full grid-cols-[auto_1fr_auto_auto] grid-rows-[auto_auto_minmax(0,1fr)_auto] @5xl:grid-rows-[auto_minmax(0,1fr)]">
        <div className="col-start-1 row-start-1 flex items-center px-2 py-3 @5xl:px-4">
          <Logo />
        </div>

        <nav
          className="col-span-full row-start-4 border-t border-line bg-card @5xl:border-0 @5xl:bg-transparent @5xl:[grid-column:2] @5xl:row-start-1 @5xl:self-center"
        >
          <div role="tablist" aria-label={t('dash.tabs.label')} className="flex @5xl:gap-1">
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
                  onClick={() => setTab(def.id)}
                  onKeyDown={e => onTabKeyDown(e, i)}
                  className={`flex-1 cursor-pointer px-3 py-3 text-sm @5xl:flex-none @5xl:rounded-lg @5xl:py-1.5 ${
                    selected
                      ? 'border-t-2 border-accent-text font-semibold text-accent-text @5xl:border-t-0 @5xl:bg-card @5xl:text-fg @5xl:shadow-[0_0_0_1px_var(--line)]'
                      : 'border-t-2 border-transparent text-muted hover:text-fg @5xl:border-t-0'
                  }`}
                >
                  {t(def.label)}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="col-span-full row-start-2 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-3 @5xl:[grid-column:3] @5xl:row-start-1 @5xl:p-3">
          <RangePicker value={selection} onChange={setSelection} years={years} now={clock} />
          <Button variant="outline" disabled={phase === 'loading' || refreshing} onClick={orderData.refresh}>
            {t('dash.refresh')}
          </Button>
          <div className="flex flex-col text-xs text-muted">
            {stamp && <span>{formatUpdated(stamp, clock)}</span>}
            <span role="status" className={notice?.kind === 'error' ? 'text-bad' : undefined}>{status}</span>
          </div>
        </div>

        <div className="col-start-4 row-start-1 flex items-center gap-3 px-2 py-3 @5xl:px-4">
          {data?.user && <AccountChip user={data.user} />}
          <ThemeToggle />
        </div>

        <main
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={-1}
          className="col-span-full row-start-3 min-h-0 overflow-y-auto px-4 pb-6 pt-2 @5xl:row-start-2 @5xl:px-6"
        >
          <div className="mx-auto max-w-6xl">{content}</div>
        </main>
      </div>
    </div>
  );
}
