import { useRef } from 'react';
import { downloadShareImage, type ShareData } from '../../../dashboard/share-image.js';
import { t } from '../../../i18n/index.js';
import type { ShareStyle } from '../../share-style';
import { useShareCanvas } from './ShareDialog';

const action = 'cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold';

/** The year's share image in the artwork and size picked last: a live thumbnail, one-click save, and a way into the full dialog. */
export function BragCard({ data, year, style, onCustomize }: { data: ShareData; year: number; style: ShareStyle; onCustomize: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useShareCanvas(canvas, data, style.template, style.ratio);

  return (
    // Brand colours in both themes, like the image itself.
    <section
      aria-label={t('share.card.title', { year })}
      className="flex items-center gap-5 rounded-2xl bg-[linear-gradient(135deg,#ee4d2d,#c8331a)] p-4 text-white @5xl:max-w-xl @5xl:flex-1"
    >
      <canvas
        ref={canvas}
        aria-label={t('share.preview')}
        className="h-24 w-auto max-w-28 shrink-0 -rotate-4 rounded-md object-contain shadow-[0_6px_18px_rgba(0,0,0,0.3)] @md:h-28 @md:max-w-36"
      />
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-snug">{t('share.card.title', { year })}</h2>
        <p className="mt-0.5 text-sm text-white/85">{t('share.card.sub')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`${action} border-white bg-white text-[#c8331a] hover:bg-white/90`} onClick={() => downloadShareImage(data, style.template, style.ratio)}>
            {t('share.download')}
          </button>
          <button type="button" className={`${action} border-white/60 hover:bg-white/10`} onClick={onCustomize}>
            {t('share.customize')}
          </button>
        </div>
      </div>
    </section>
  );
}
