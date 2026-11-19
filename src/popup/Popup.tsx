import { useEffect, useState, type ReactNode } from 'react';
import { formatUpdated } from '../dashboard-app/updated';
import { t } from '../i18n/index.js';
import icon from '../icons/icon.svg';
import { Button } from '../ui/components/Button';
import { Logo } from '../ui/components/Logo';
import { ThemeToggle } from '../ui/components/ThemeToggle';
import { card } from '../ui/styles/classes';
import type { PopupCache, PopupHost, PopupUser } from './host';

const EXTERNAL_LINKS = [
  {
    key: 'popup.rate',
    href: 'https://chromewebstore.google.com/detail/shopeestatx/hhcfonmapcabjmaghpapehegbmhdceim',
  },
  { key: 'popup.support', href: 'https://www.buymeacoffee.com/ninhhaidang' },
  { key: 'popup.github', label: 'GitHub', href: 'https://github.com/ninhhaidang/shopee-orders-statics' },
] as const;

const rowClass = 'flex cursor-pointer items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-bg';

/** One menu row, laid out like a Top shop row: › opens an extension page, ↗ a site in a new tab. */
function RowContent({ children, external }: { children: ReactNode; external?: boolean }) {
  return (
    <>
      <span>{children}</span>
      <span aria-hidden="true" className="text-muted">
        {external ? '↗' : '›'}
      </span>
    </>
  );
}

/** Popup launcher: account and cached-data summary, share image and saved dashboard (with cached orders), start (or Open Shopee), links. */
export function Popup({ host, now = new Date() }: { host: PopupHost; now?: Date }) {
  const [user, setUser] = useState<PopupUser | null>(null);
  const [cache, setCache] = useState<PopupCache | null>(null);
  // Assume we are on Shopee until the host says otherwise, so the warning never flashes for logged-in users.
  const [onShopee, setOnShopee] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    void host.getUser().then((u) => live && setUser(u));
    void host.getCache().then((c) => live && setCache(c));
    void host.isOnShopee().then((on) => live && setOnShopee(on));
    return () => {
      live = false;
    };
  }, [host]);

  const summary = cache && [t('popup.orders', { n: cache.orders.toLocaleString('vi-VN') }), formatUpdated(cache.updatedAt, now)].join(' · ');

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 bg-bg p-4 text-fg">
      <header className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <img src={icon} alt="" className="size-6" />
          <Logo className="text-lg" />
        </span>
        <ThemeToggle />
      </header>

      <main className={`${card} flex flex-col gap-3`}>
        {user ? (
          <div className="flex items-center gap-3">
            {/* The initial shows when there is no avatar or it fails to load. */}
            <span aria-hidden="true" className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-bg font-semibold text-muted">
              {user.name.slice(0, 1).toUpperCase()}
              {user.avatar && (
                <img src={user.avatar} alt="" className="absolute inset-0 size-full object-cover" onError={(e) => (e.currentTarget.hidden = true)} />
              )}
            </span>
            <p className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">
                <span className="font-normal text-muted">{t('popup.hello')}, </span>
                {user.name}
              </span>
              {summary && <span className="text-xs text-muted">{summary}</span>}
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-base font-semibold">{t('popup.featureTitle')}</h1>
            <p className="mt-0.5 text-sm text-muted">{t('popup.featureDesc')}</p>
            {summary && <p className="mt-1 text-xs text-muted">{summary}</p>}
          </div>
        )}

        {/* With cached orders the share image leads; scanning again becomes a secondary action. */}
        {cache && (
          <>
            <Button onClick={() => host.openDashboard(true)}>{t('share.open')}</Button>
            <Button variant="secondary" onClick={() => host.openDashboard()}>
              {t('popup.openDashboard')}
            </Button>
          </>
        )}

        {onShopee === false ? (
          <>
            <p role="status" className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn-fg">
              {t('popup.warning')}
            </p>
            <Button variant={cache ? 'secondary' : 'primary'} onClick={() => host.openLogin()}>{t('popup.openShopee')}</Button>
          </>
        ) : (
          <Button variant={cache ? 'secondary' : 'primary'} disabled={onShopee !== true} onClick={() => void host.startAnalysis()}>
            {t('popup.btnStart')}
          </Button>
        )}
      </main>

      <nav aria-label={t('popup.links')} className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        <button type="button" className={rowClass} onClick={() => host.openHelp()}>
          <RowContent>{t('popup.help')}</RowContent>
        </button>
        <button type="button" className={rowClass} onClick={() => host.openPrivacy()}>
          <RowContent>{t('popup.privacy')}</RowContent>
        </button>
        {EXTERNAL_LINKS.map((link) => (
          <a key={link.key} className={rowClass} href={link.href} target="_blank" rel="noopener noreferrer">
            <RowContent external>{'label' in link ? link.label : t(link.key)}</RowContent>
          </a>
        ))}
      </nav>
    </div>
  );
}
