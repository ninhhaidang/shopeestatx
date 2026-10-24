import { t } from '../i18n/index.js';
import { Skeleton } from '../ui/components/Skeleton';

/** Loading placeholder with the same layout as the Tổng quan screen; `message` is the progress line. */
export function OverviewSkeleton({ message }: { message?: string }) {
  return (
    <div role="status" aria-label={t('dash.loading')} className="grid gap-4 @2xl:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4 @2xl:col-span-2 @2xl:flex-row @2xl:items-end @2xl:justify-between @2xl:gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-64 max-w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2.5 @2xl:max-w-xl @2xl:grid-cols-4">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[4.25rem]" />
          ))}
        </div>
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      {message && <p className="text-sm text-muted @2xl:col-span-2">{message}</p>}
    </div>
  );
}
