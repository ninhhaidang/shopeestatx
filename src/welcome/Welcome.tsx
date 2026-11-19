import { useId, type ReactNode } from 'react';
import manifest from '../manifest.json';
import { t } from '../i18n/index.js';
import { Button } from '../ui/components/Button';
import { Logo } from '../ui/components/Logo';
import { ThemeToggle } from '../ui/components/ThemeToggle';
import { card, chip } from '../ui/styles/classes';
import type { WelcomeHost } from './host';

const FEATURES = ['featureGetHistory', 'featureAnalytics', 'featureExport'] as const;
const PERMISSIONS = [
  { name: 'activeTab', key: 'welcome.permission.activeTab' },
  { name: 'storage', key: 'welcome.permission.storage' },
  { name: 'scripting', key: 'welcome.permission.scripting' },
  { name: 'sidePanel', key: 'welcome.permission.sidePanel' },
  { name: 'shopee.vn', key: 'welcome.permission.host' },
] as const;
const STEPS = [1, 2, 3, 4] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`${card} flex flex-col gap-4`}>
      <h2 id={id} className="text-lg font-semibold">
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
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-2 flex flex-col items-start gap-3">
          <span className={chip}>v{manifest.version}</span>
          <h1 className="text-3xl font-semibold text-balance">{t('welcome.tagline')}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button className="sm:w-auto sm:px-8" onClick={() => host.openShopee()}>
              {t('welcome.ctaButton')}
            </Button>
            <p className="text-sm text-muted">{t('welcome.ctaNote')}</p>
          </div>
        </header>

        <main className="flex flex-col gap-4">
          <Section title={t('welcome.sectionWhatDoes')}>
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature} className="bg-card p-3">
                  <h3 className="text-sm font-semibold">{t(`welcome.${feature}`)}</h3>
                  <p className="mt-1 text-sm text-muted">{t(`welcome.${feature}Desc`)}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t('welcome.sectionWhyPermissions')}>
            <dl className="flex flex-col divide-y divide-line rounded-xl border border-line text-sm">
              {PERMISSIONS.map((p) => (
                <div key={p.name} className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
                  <dt className="shrink-0 font-mono font-semibold text-accent-text sm:w-28">{p.name}</dt>
                  <dd className="text-muted">{t(p.key)}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-lg bg-[color-mix(in_srgb,var(--good)_var(--tint),transparent)] p-3 text-sm text-good">
              <span className="font-medium">{t('welcome.privacyNote')}</span>{' '}
              <a className="underline underline-offset-4" href="/privacy.html" onClick={openPrivacy}>
                {t('popup.privacy')}
              </a>
            </p>
          </Section>

          <Section title={t('welcome.sectionHowToUse')}>
            <ol aria-label={t('welcome.sectionHowToUse')} className="flex flex-col gap-4">
              {STEPS.map((n) => (
                <li key={n} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
                  <span aria-hidden="true" className="num text-lg font-semibold leading-6 text-accent-text">
                    {n}
                  </span>
                  <div>
                    <strong className="font-semibold">{t(`welcome.step${n}Title`)}</strong>
                    <p className="text-sm text-muted">{t(`welcome.step${n}Desc`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </main>

        <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-muted">
          <span>{t('welcome.footerDisclaimer')}</span>
          <a className="underline-offset-4 hover:text-fg hover:underline" href="/privacy.html" onClick={openPrivacy}>
            {t('popup.privacy')}
          </a>
          <a className="underline-offset-4 hover:text-fg hover:underline" href="https://github.com/ninhhaidang/shopeestatx" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
