import { t } from '../i18n/index.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Cập nhật: 2 giờ trước" for the time the data was last fetched. */
export function formatUpdated(timestamp: string, now: Date): string {
  const diff = Math.max(0, now.getTime() - new Date(timestamp).getTime());
  const when =
    diff < MINUTE ? t('dash.updated.justNow')
    : diff < HOUR ? t('dash.updated.minutes', { n: Math.floor(diff / MINUTE) })
    : diff < DAY ? t('dash.updated.hours', { n: Math.floor(diff / HOUR) })
    : t('dash.updated.days', { n: Math.floor(diff / DAY) });
  return t('dash.updated', { when });
}
