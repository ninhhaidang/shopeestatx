import { Dialog, DialogBackdrop, DialogClose, DialogContent, DialogTitle } from '@ui-sdk/react/dialog';
import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import { useEffect, useId, useRef, useState } from 'react';
import {
  copyShareImage,
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
  const id = useId();
  return (
    <div>
      <p id={id} className="mb-1.5 text-sm font-medium">{label}</p>
      <SegmentedControl aria-labelledby={id} value={value} onValueChange={next => next && onChange(next)} className="flex flex-wrap gap-1.5">
        {options.map(option => (
          <SegmentedControlItem
            key={option}
            value={option}
            className="cursor-pointer rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-fg hover:border-muted data-checked:border-fg data-checked:bg-fg data-checked:text-card"
          >
            {name(option)}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </div>
  );
}

/** Pick an artwork and a size, see it, copy or download it. The image only goes to the clipboard or the computer. */
export function ShareDialog({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<ShareTemplate>('label');
  const [ratio, setRatio] = useState<ShareRatio>('square');
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);

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
  useEffect(() => setCopied(null), [template, ratio]);

  const copy = () => copyShareImage(data, template, ratio).then(() => setCopied('done'), () => setCopied('failed'));

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <DialogContent className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-card p-0 text-fg">
        <div className="grid gap-5 p-5 @container md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex min-h-64 items-center justify-center rounded-xl bg-bg p-3">
            <canvas ref={canvas} aria-label={t('share.preview')} className="max-h-[62vh] w-auto max-w-full rounded-md shadow-md" />
          </div>
          <div className="flex flex-col gap-4">
            <DialogTitle className="text-lg font-semibold">{t('share.title')}</DialogTitle>
            <Choice label={t('share.template')} options={SHARE_TEMPLATES} value={template} onChange={setTemplate} name={o => t(`share.template.${o}`)} />
            <div>
              <Choice label={t('share.ratio')} options={RATIOS} value={ratio} onChange={setRatio} name={o => t(`share.ratio.${o}`)} />
              <p className="mt-1.5 text-xs text-muted">
                {t(`share.ratio.${ratio}.use`)} <span className="num">{SHARE_RATIOS[ratio].join(' × ')} px</span>
              </p>
            </div>
            <p className="text-xs text-muted">{t('share.privacy')}</p>
            <div className="mt-auto flex flex-col gap-2">
              <p role="status" className={`text-sm ${copied === 'failed' ? 'text-bad' : 'text-good'}`}>{copied && t(`share.copy.${copied}`)}</p>
              <Button onClick={() => void copy()}>{t('share.copy')}</Button>
              <Button variant="outline" className="py-2.5" onClick={() => downloadShareImage(data, template, ratio)}>{t('share.download')}</Button>
              <DialogClose render={<Button variant="outline" className="py-2.5" />}>{t('share.close')}</DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
