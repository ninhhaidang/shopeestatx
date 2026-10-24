import { t } from '../../i18n/index.js';
import { StateMessage } from '../../ui/components/StateMessage';
import { useDashboard } from '../context';

/** Shown by a tab when the global date range holds no orders; offers to widen it. */
export function NoOrdersInRange() {
  const { resetRange } = useDashboard();
  return (
    <StateMessage
      title={t('dash.noOrdersInRange.title')}
      message={t('dash.noOrdersInRange.message')}
      action={{ label: t('dash.noOrdersInRange.action'), onClick: resetRange }}
    />
  );
}
