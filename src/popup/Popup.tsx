import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { Button } from '../ui/components/Button';
import { Logo } from '../ui/components/Logo';
import { ThemeToggle } from '../ui/components/ThemeToggle';
import { card } from '../ui/styles/classes';
import type { PopupHost, PopupUser } from './host';

const EXTERNAL_LINKS = [
  { key: 'popup.support', href: 'https://www.buymeacoffee.com/ninhhaidang' },
  { key: 'popup.github', label: 'GitHub', href: 'https://github.com/ninhhaidang/shopee-orders-statics' },
  {
    key: 'popup.rate',
    href: 'https://chromewebstore.google.com/detail/shopeestatx/hhcfonmapcabjmaghpapehegbmhdceim',
  },
] as const;

const linkClass =
  'rounded text-muted underline-offset-4 hover:text-fg hover:underline cursor-pointer';

/** Popup launcher: greeting, start button (or Open Shopee when the tab is not Shopee), links, theme switch. */
export function Popup({ host }: { host: PopupHost }) {
  const [user, setUser] = useState<PopupUser | null>(null);
  // Assume we are on Shopee until the host says otherwise, so the warning never flashes for logged-in users.
  const [onShopee, setOnShopee] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    void host.getUser().then((u) => live && setUser(u));
    void host.isOnShopee().then((on) => live && setOnShopee(on));
    return () => {
      live = false;
    };
  }, [host]);

  return (
    <div className="flex w-full min-w-0 flex-col bg-bg text-fg">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="px-4 pb-4">
        <div className={`${card} flex flex-col gap-4`}>
          {user ? (
            <div className="flex items-center gap-3">
              {/* The initial shows when there is no avatar or it fails to load. */}
              <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-bg text-sm font-semibold text-muted">
                {user.name.slice(0, 1).toUpperCase()}
                {user.avatar && (
                  <img src={user.avatar} alt="" className="absolute inset-0 size-full object-cover" onError={(e) => (e.currentTarget.hidden = true)} />
                )}
              </span>
              <p className="flex min-w-0 flex-col">
                <span className="text-xs text-muted">{t('popup.hello')}</span>
                <span className="truncate font-semibold">{user.name}</span>
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-base font-semibold">{t('popup.featureTitle')}</h1>
              <p className="mt-0.5 text-sm text-muted">{t('popup.featureDesc')}</p>
            </div>
          )}

          {onShopee === false ? (
            <>
              <p role="status" className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn-fg">
                {t('popup.warning')}
              </p>
              <Button onClick={() => host.openLogin()}>{t('popup.openShopee')}</Button>
            </>
          ) : (
            <Button disabled={onShopee !== true} onClick={() => void host.startAnalysis()}>
              {t('popup.btnStart')}
            </Button>
          )}
        </div>
      </main>

      <footer className="flex flex-col gap-1.5 border-t border-line px-4 py-3 text-xs">
        <div className="flex gap-4">
          <Button variant="quiet" onClick={() => host.openHelp()}>
            {t('popup.help')}
          </Button>
          <Button variant="quiet" onClick={() => host.openPrivacy()}>
            {t('popup.privacy')}
          </Button>
        </div>
        <nav aria-label={t('popup.links')} className="flex gap-4">
          {EXTERNAL_LINKS.map((link) => (
            <a key={link.key} className={linkClass} href={link.href} target="_blank" rel="noopener noreferrer">
              {'label' in link ? link.label : t(link.key)}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
