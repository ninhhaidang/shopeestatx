import { useId, type ReactNode } from 'react';
import manifest from '../manifest.json';
import { t } from '../i18n/index.js';
import { Button } from '../ui/components/Button';
import { Logo } from '../ui/components/Logo';
import { ThemeToggle } from '../ui/components/ThemeToggle';
import type { WelcomeHost } from './host';

const FEATURES = ['featureGetHistory', 'featureAnalytics', 'featureExport'] as const;
const PERMISSIONS = [
  { name: 'activeTab', key: 'welcome.permission.activeTab' },
  { name: 'storage', key: 'welcome.permission.storage' },
  { name: 'scripting', key: 'welcome.permission.scripting' },
  { name: 'shopee.vn', key: 'welcome.permission.host' },
] as const;
const STEPS = [1, 2, 3, 4] as const;

const cardClass = 'rounded-xl border border-line bg-card p-4';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-serif text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** First-run page: what the extension does, why it needs each permission, how to use it. */
export function Welcome({ host }: { host: WelcomeHost }) {
  const openPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    host.openPrivacy();
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <header className="flex flex-col items-center gap-2 border-b border-line pb-8 text-center">
          <h1>
            <Logo className="text-[length:inherit]! text-4xl sm:text-5xl" />
          </h1>
          <p className="text-base text-muted sm:text-lg">{t('welcome.tagline')}</p>
          <span className="rounded-full border border-line bg-card px-3 py-0.5 text-xs text-muted">v{manifest.version}</span>
        </header>

        <main className="flex flex-col gap-8">
          <Section title={t('welcome.sectionWhatDoes')}>
            <div className="grid gap-3 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature} className={cardClass}>
                  <h3 className="text-base font-semibold">{t(`welcome.${feature}`)}</h3>
                  <p className="mt-1 text-sm text-muted">{t(`welcome.${feature}Desc`)}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t('welcome.sectionWhyPermissions')}>
            <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-card">
              {PERMISSIONS.map((p) => (
                <li key={p.name} className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
                  <code className="shrink-0 font-mono text-sm font-semibold text-accent-text sm:w-28">{p.name}</code>
                  <span className="text-sm text-muted">{t(p.key)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              {t('welcome.privacyNote')}{' '}
              <a className="text-accent-text underline underline-offset-4 hover:text-accent-hover" href="privacy.html" onClick={openPrivacy}>
                {t('popup.privacy')}
              </a>
            </p>
          </Section>

          <Section title={t('welcome.sectionHowToUse')}>
            <ol aria-label={t('welcome.sectionHowToUse')} className="flex flex-col gap-3">
              {STEPS.map((n) => (
                <li key={n} className={`${cardClass} flex gap-4`}>
                  <span aria-hidden="true" className="num font-serif text-2xl font-semibold text-accent-text">
                    {String(n).padStart(2, '0')}
                  </span>
                  <div>
                    <strong className="font-semibold">{t(`welcome.step${n}Title`)}</strong>
                    <p className="text-sm text-muted">{t(`welcome.step${n}Desc`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <div className="flex flex-col items-center gap-2 text-center">
            <Button className="sm:w-auto sm:px-8" onClick={() => host.openShopee()}>
              {t('welcome.ctaButton')}
            </Button>
            <p className="text-sm text-muted">{t('welcome.ctaNote')}</p>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line pt-6 text-sm text-muted">
          <span>{t('welcome.footerDisclaimer')}</span>
          <a className="underline underline-offset-4 hover:text-fg" href="privacy.html" onClick={openPrivacy}>
            {t('popup.privacy')}
          </a>
          <a
            className="underline underline-offset-4 hover:text-fg"
            href="https://github.com/ninhhaidang/shopeestatx"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
