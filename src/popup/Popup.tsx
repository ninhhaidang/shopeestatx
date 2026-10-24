import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { Button } from '../ui/components/Button';
import { Logo } from '../ui/components/Logo';
import { ThemeToggle } from '../ui/components/ThemeToggle';
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

/** Popup launcher: greeting, start button, Shopee warning, links, theme switch. */
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

  const blocked = onShopee !== true;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 bg-bg p-4 text-fg">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-col gap-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
            {user.avatar && (
              <img
                src={user.avatar}
                alt=""
                className="size-10 rounded-full"
                onError={(e) => (e.currentTarget.hidden = true)}
              />
            )}
            <p className="flex min-w-0 flex-col text-sm text-muted">
              <span>{t('popup.hello')}</span>
              <span className="truncate text-base font-semibold text-fg">{user.name}</span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-card p-4">
            <h1 className="font-serif text-lg font-semibold">{t('popup.featureTitle')}</h1>
            <p className="mt-1 text-sm text-muted">{t('popup.featureDesc')}</p>
          </div>
        )}

        <Button disabled={blocked} onClick={() => void host.startAnalysis()}>
          {t('popup.btnStart')}
        </Button>

        {onShopee === false && (
          <p role="status" className="flex flex-col gap-1 rounded-xl border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg">
            <span>{t('popup.warning')}</span>
            <Button variant="link" className="self-start" onClick={() => host.openLogin()}>
              {t('popup.openShopee')}
            </Button>
          </p>
        )}
      </main>

      <footer>
        <nav aria-label={t('popup.links')} className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {EXTERNAL_LINKS.map((link) => (
            <a key={link.key} className={linkClass} href={link.href} target="_blank" rel="noopener noreferrer">
              {'label' in link ? link.label : t(link.key)}
            </a>
          ))}
          <Button variant="quiet" onClick={() => host.openHelp()}>
            {t('popup.help')}
          </Button>
          <Button variant="quiet" onClick={() => host.openPrivacy()}>
            {t('popup.privacy')}
          </Button>
        </nav>
      </footer>
    </div>
  );
}
