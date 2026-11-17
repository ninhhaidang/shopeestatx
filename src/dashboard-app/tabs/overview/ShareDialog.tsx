import { useEffect, useRef, useState } from 'react';
import {
  downloadShareImage,
  drawShareImage,
  SHARE_RATIOS,
  SHARE_TEMPLATES,
  type ShareData,
  type ShareRatio,
  type ShareTemplate,
} from '../../../dashboard/share-image.js';
import { t } from '../../../i18n/index.js';
import { Button } from '../../../ui/components/Button';

const RATIOS = Object.keys(SHARE_RATIOS) as ShareRatio[];

function Choice<T extends string>({ label, options, value, onChange, name }: { label: string; options: T[]; value: T; onChange: (next: T) => void; name: (option: T) => string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${option === value ? 'border-fg bg-fg text-card' : 'border-line bg-card text-fg hover:border-muted'}`}
          >
            {name(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Pick an artwork and a size, see it, download it. The image is only saved to the computer. */
export function ShareDialog({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<ShareTemplate>('label');
  const [ratio, setRatio] = useState<ShareRatio>('square');

  useEffect(() => {
    const el = dialog.current;
    if (!el || el.open) return;
    // jsdom (tests) has no showModal.
    if (el.showModal) el.showModal();
    else el.setAttribute('open', '');
  }, []);

  useEffect(() => {
    let live = true;
    const draw = () => live && canvas.current && drawShareImage(canvas.current, data, template, ratio);
    draw();
    // Draw again once the bundled typeface is ready for canvas use.
    void document.fonts?.load('700 40px "Be Vietnam Pro"').then(draw, () => {});
    return () => {
      live = false;
    };
  }, [data, template, ratio]);

  return (
    <dialog
      ref={dialog}
      aria-label={t('share.title')}
      onClose={onClose}
      onClick={e => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-2xl border border-line bg-card p-0 text-fg backdrop:bg-black/50"
    >
      <div className="grid gap-5 p-5 @container md:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-h-64 items-center justify-center rounded-xl bg-bg p-3">
          <canvas ref={canvas} aria-label={t('share.preview')} className="max-h-[62vh] w-auto max-w-full rounded-md shadow-md" />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t('share.title')}</h2>
          <Choice label={t('share.template')} options={SHARE_TEMPLATES} value={template} onChange={setTemplate} name={o => t(`share.template.${o}`)} />
          <div>
            <Choice label={t('share.ratio')} options={RATIOS} value={ratio} onChange={setRatio} name={o => t(`share.ratio.${o}`)} />
            <p className="mt-1.5 text-xs text-muted">
              {t(`share.ratio.${ratio}.use`)} <span className="num">{SHARE_RATIOS[ratio].join(' × ')} px</span>
            </p>
          </div>
          <p className="text-xs text-muted">{t('share.privacy')}</p>
          <div className="mt-auto flex flex-col gap-2">
            <Button onClick={() => downloadShareImage(data, template, ratio)}>{t('share.download')}</Button>
            <Button variant="outline" className="py-2.5" onClick={onClose}>{t('share.close')}</Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
