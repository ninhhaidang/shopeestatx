import { useRef, useState } from 'react';
import { copyShareImage, type ShareData } from '../../../dashboard/share-image.js';
import { t } from '../../../i18n/index.js';
import { useShareCanvas } from './ShareDialog';

const action = 'cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold';

/** The year's share image, ready on Tổng quan: a live thumbnail, one-click copy, and a way into the full dialog. */
export function BragCard({ data, year, onCustomize }: { data: ShareData; year: number; onCustomize: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);
  useShareCanvas(canvas, data, 'label', 'square');

  const copy = () => copyShareImage(data, 'label', 'square').then(() => setCopied('done'), () => setCopied('failed'));

  return (
    // Brand colours in both themes, like the image itself.
    <section
      aria-label={t('share.card.title', { year })}
      className="flex items-center gap-5 rounded-2xl bg-[linear-gradient(135deg,#ee4d2d,#c8331a)] p-4 text-white @5xl:max-w-xl @5xl:flex-1"
    >
      <canvas
        ref={canvas}
        aria-label={t('share.preview')}
        className="size-24 shrink-0 -rotate-4 rounded-md shadow-[0_6px_18px_rgba(0,0,0,0.3)] @md:size-28"
      />
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-snug">{t('share.card.title', { year })}</h2>
        <p className="mt-0.5 text-sm text-white/85">{t('share.card.sub')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`${action} bg-white text-[#c8331a] hover:bg-white/90`} onClick={() => void copy()}>
            {t('share.copy')}
          </button>
          <button type="button" className={`${action} border border-white/60 hover:bg-white/10`} onClick={onCustomize}>
            {t('share.customize')}
          </button>
        </div>
        {copied && (
          <p role="status" className="mt-1.5 text-xs text-white/90">
            {t(`share.copy.${copied}`)}
          </p>
        )}
      </div>
    </section>
  );
}
