import { Dialog, DialogBackdrop, DialogClose, DialogContent, DialogTitle } from '@ui-sdk/react/dialog';
import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
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
import type { ShareStyle } from '../../share-style';

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

/** Keeps a canvas showing the share image for these choices; `scale` below 1 for a thumbnail. */
export function useShareCanvas(canvas: RefObject<HTMLCanvasElement | null>, data: ShareData, template: ShareTemplate, ratio: ShareRatio, scale = 1): void {
  useEffect(() => {
    let live = true;
    const draw = () => live && canvas.current && drawShareImage(canvas.current, data, template, ratio, scale);
    draw();
    // Draw again once the bundled typeface is ready for canvas use.
    void document.fonts?.load('700 40px "Be Vietnam Pro"').then(draw, () => {});
    return () => {
      live = false;
    };
  }, [canvas, data, template, ratio, scale]);
}

function Thumbnail({ data, template, ratio }: { data: ShareData; template: ShareTemplate; ratio: ShareRatio }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useShareCanvas(canvas, data, template, ratio, 0.12);
  return <canvas ref={canvas} aria-hidden="true" className="h-14 w-auto max-w-full rounded-sm shadow-sm" />;
}

/** The artworks as live thumbnails of this very image: a grid, or one scrolling row on narrow screens (side panel). */
function TemplatePicker({ data, ratio, value, onChange }: { data: ShareData; ratio: ShareRatio; value: ShareTemplate; onChange: (next: ShareTemplate) => void }) {
  const id = useId();
  const row = useRef<HTMLDivElement>(null);
  // Open with the remembered artwork in view when the thumbnails scroll sideways (a no-op for the grid).
  useEffect(() => {
    const el = row.current;
    const picked = el?.querySelector<HTMLElement>('[data-checked]');
    if (el && picked) el.scrollLeft = picked.offsetLeft - (el.clientWidth - picked.offsetWidth) / 2;
  }, []);
  return (
    <div>
      <p id={id} className="mb-1.5 text-sm font-medium">{t('share.template')}</p>
      <div ref={row} className="relative overflow-x-auto pb-1 md:overflow-visible md:pb-0">
      <SegmentedControl aria-labelledby={id} value={value} onValueChange={next => next && onChange(next)} className="flex w-max gap-1.5 md:grid md:w-auto md:grid-cols-4">
        {SHARE_TEMPLATES.map(option => (
          <SegmentedControlItem
            key={option}
            value={option}
            className="flex w-20 shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg md:w-auto border border-line bg-card p-1 pb-1.5 text-xs leading-tight text-fg hover:border-muted data-checked:border-fg data-checked:bg-bg data-checked:font-semibold"
          >
            <Thumbnail data={data} template={option} ratio={ratio} />
            {t(`share.template.${option}`)}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      </div>
    </div>
  );
}

/** A period the image can sum up: the latest year, or the dashboard's selected range. */
export interface ShareOption {
  key: 'year' | 'range';
  label: string;
  data: ShareData;
}

/**
 * Pick a period, an artwork and a size, see it, copy or download it. The image only goes to the clipboard or the computer.
 * The artwork and size are the dashboard's remembered `style`; changing them updates it.
 */
export function ShareDialog({ options, style, onStyle, onClose }: { options: ShareOption[]; style: ShareStyle; onStyle: (next: ShareStyle) => void; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [period, setPeriod] = useState(options[0].key);
  const { template, ratio } = style;
  const setTemplate = (next: ShareTemplate) => onStyle({ template: next, ratio });
  const setRatio = (next: ShareRatio) => onStyle({ template, ratio: next });
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);
  const data = (options.find(o => o.key === period) ?? options[0]).data;

  useShareCanvas(canvas, data, template, ratio);
  useEffect(() => setCopied(null), [data, template, ratio]);

  const copy = () => copyShareImage(data, template, ratio).then(() => setCopied('done'), () => setCopied('failed'));

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <DialogContent className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-card p-0 text-fg">
        {/* minmax(0,…) and min-w-0: the scrolling thumbnail row must not widen the dialog. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-5 @container md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex min-h-64 items-center justify-center rounded-xl bg-bg p-3">
            <canvas ref={canvas} aria-label={t('share.preview')} className="max-h-[62vh] w-auto max-w-full rounded-md shadow-md" />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <DialogTitle className="text-lg font-semibold">{t('share.title')}</DialogTitle>
            {options.length > 1 && (
              <Choice label={t('share.period')} options={options.map(o => o.key)} value={period} onChange={setPeriod} name={key => options.find(o => o.key === key)!.label} />
            )}
            <TemplatePicker data={data} ratio={ratio} value={template} onChange={setTemplate} />
            <div>
              <Choice label={t('share.ratio')} options={RATIOS} value={ratio} onChange={setRatio} name={o => t(`share.ratio.${o}`)} />
              <p className="mt-1.5 text-xs text-muted">
                {t(`share.ratio.${ratio}.use`)} <span className="num">{SHARE_RATIOS[ratio].join(' × ')} px</span>
              </p>
            </div>
            <p className="text-xs text-muted">{t('share.privacy')}</p>
            <div className="mt-auto flex flex-col gap-2">
              <p role="status" className={`text-sm ${copied === 'failed' ? 'text-bad' : 'text-good'}`}>{copied && t(`share.copy.${copied}`)}</p>
              <Button onClick={() => downloadShareImage(data, template, ratio)}>{t('share.download')}</Button>
              <Button variant="outline" className="py-2.5" onClick={() => void copy()}>{t('share.copy')}</Button>
              <DialogClose render={<Button variant="outline" className="py-2.5" />}>{t('share.close')}</DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
