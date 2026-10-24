import { t } from '../../i18n/index.js';
import { Button } from '../../ui/components/Button';
import { useDashboard } from '../context';

/** Warns that the cache predates the refund/savings fields and offers the re-scan that fills them in. */
export function RescanBanner({ className = '' }: { className?: string }) {
  const { refresh } = useDashboard();
  return (
    <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg ${className}`}>
      <span>{t('stats.rescan')}</span>
      <Button variant="link" onClick={refresh}>{t('stats.rescan.btn')}</Button>
    </div>
  );
}
