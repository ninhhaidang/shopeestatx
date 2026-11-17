import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { t } from '../../i18n/index.js';

export interface MonthPoint {
  /** 1-12 */
  month: number;
  year: number;
  total: number;
}

interface MonthChartProps {
  /** Names the chart for assistive tech. */
  title: string;
  /** One point per calendar month, oldest first, no gaps. */
  points: MonthPoint[];
  /** Months drawn at full strength; the others are dimmed. */
  active: boolean[];
  onSelect: (index: number) => void;
  formatValue: (value: number) => string;
  /** Compact form for the axis and the peak label. */
  formatTick: (value: number) => string;
}

const HEIGHT = 340;
const TOP = 26;
const BOTTOM = 46;
const LEFT = 46;
const RIGHT = 6;

/** A round axis top and step, giving three to five gridlines. */
function axis(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 1, step: 1 };
  const pow = 10 ** Math.floor(Math.log10(max));
  const lead = max / pow;
  const step = (lead <= 1 ? 0.25 : lead <= 2 ? 0.5 : lead <= 5 ? 1 : 2) * pow;
  return { top: Math.ceil(max / step) * step, step };
}

/**
 * Net spend per month as bars: years are banded on the axis, the peak is labelled, hovering or
 * arrowing to a month shows its figure and Enter/click picks it. Drawn in SVG so it follows the
 * theme tokens and the UI typeface without a chart library.
 */
export function MonthChart({ title, points, active, onSelect, formatValue, formatTick }: MonthChartProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    // jsdom has no ResizeObserver; the default width is fine there.
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const plotW = width - LEFT - RIGHT;
    const plotH = HEIGHT - TOP - BOTTOM;
    const step = plotW / Math.max(points.length, 1);
    const barW = Math.min(34, Math.max(2, step - (step > 8 ? 2 : 1)));
    const { top, step: tickStep } = axis(Math.max(0, ...points.map(p => p.total)));
    const ticks = Array.from({ length: Math.round(top / tickStep) + 1 }, (_, i) => i * tickStep);
    const y = (value: number) => TOP + plotH * (1 - value / top);
    // Consecutive months of one year form a band that carries the year label.
    const years: { year: number; from: number; to: number }[] = [];
    points.forEach((p, i) => {
      const last = years.at(-1);
      if (last?.year === p.year) last.to = i;
      else years.push({ year: p.year, from: i, to: i });
    });
    let peak = -1;
    points.forEach((p, i) => {
      if (active[i] && p.total > 0 && (peak < 0 || p.total > points[peak].total)) peak = i;
    });
    return { plotW, plotH, step, barW, ticks, y, years, peak };
  }, [width, points, active]);

  const { plotH, step, barW, ticks, y, years, peak } = geometry;
  const centre = (i: number) => LEFT + i * step + step / 2;
  const baseline = TOP + plotH;

  const onKeyDown = (e: KeyboardEvent) => {
    const last = points.length - 1;
    const at = hover ?? last;
    if (e.key === 'ArrowLeft') setHover(Math.max(0, at - 1));
    else if (e.key === 'ArrowRight') setHover(Math.min(last, at + 1));
    else if (e.key === 'Home') setHover(0);
    else if (e.key === 'End') setHover(last);
    else if ((e.key === 'Enter' || e.key === ' ') && hover !== null) onSelect(hover);
    else return;
    e.preventDefault();
  };

  const shown = hover !== null ? points[hover] : null;

  return (
    <div
      ref={wrap}
      role="group"
      tabIndex={0}
      aria-label={t('dash.chart.keys', { title })}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      onBlur={() => setHover(null)}
      className="relative rounded-lg"
    >
      <svg role="img" aria-label={t('dash.chart.summary', { title, count: points.length })} width={width} height={HEIGHT} className="block">
        {ticks.map(tick => (
          <g key={tick}>
            <line x1={LEFT} x2={width - RIGHT} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeWidth={1} />
            <text x={LEFT - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{formatTick(tick)}</text>
          </g>
        ))}

        {years.map((band, i) => {
          const x0 = LEFT + band.from * step;
          const x1 = LEFT + (band.to + 1) * step;
          return (
            <g key={band.year}>
              {i > 0 && <line x1={x0} x2={x0} y1={TOP} y2={baseline + 30} stroke="var(--line)" strokeWidth={1} />}
              {x1 - x0 >= 34 && (
                <text x={(x0 + x1) / 2} y={baseline + 34} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--fg)">{band.year}</text>
              )}
            </g>
          );
        })}

        {hover !== null && <rect x={LEFT + hover * step} y={TOP} width={step} height={plotH} fill="var(--fg)" opacity={0.06} />}

        {points.map((p, i) => {
          const h = Math.max(p.total > 0 ? 2 : 0, baseline - y(p.total));
          const r = Math.min(4, barW / 2, h);
          const x = centre(i) - barW / 2;
          return (
            <g key={`${p.month}/${p.year}`}>
              {h > 0 && (
                <path
                  d={`M${x},${baseline}v${-(h - r)}q0,${-r} ${r},${-r}h${barW - 2 * r}q${r},0 ${r},${r}v${h - r}z`}
                  fill={hover === i ? 'var(--accent-strong)' : 'var(--accent-fill)'}
                  opacity={active[i] ? 1 : 0.28}
                />
              )}
              {step >= 22 && (
                <text x={centre(i)} y={baseline + 15} textAnchor="middle" fontSize={10} fill="var(--muted)">{p.month}</text>
              )}
            </g>
          );
        })}

        {peak >= 0 && hover === null && (
          <text
            x={Math.min(width - RIGHT - 24, Math.max(LEFT + 24, centre(peak)))}
            y={y(points[peak].total) - 7}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="var(--fg)"
          >
            {formatTick(points[peak].total)}
          </text>
        )}

        {/* Hit targets: the whole column, not just the bar. */}
        {points.map((p, i) => (
          <rect
            key={`${p.month}/${p.year}`}
            data-month={`${p.month}/${p.year}`}
            x={LEFT + i * step}
            y={TOP}
            width={step}
            height={plotH + BOTTOM}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHover(i)}
            onClick={() => onSelect(i)}
          />
        ))}
      </svg>

      {shown && hover !== null && (
        <div
          role="status"
          data-testid="chart-tip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(width - 84, Math.max(84, centre(hover))), top: Math.max(54, y(shown.total) - 8) }}
        >
          <p className="text-muted">{t('dash.chart.monthOf', { month: shown.month, year: shown.year })}</p>
          <p className="num text-sm font-semibold">{formatValue(shown.total)}</p>
        </div>
      )}
    </div>
  );
}

/** The same figures as a year-by-month grid: twelve columns, one row per year, the busier cells tinted. */
export function MonthMatrix({ title, points, formatTick }: Pick<MonthChartProps, 'title' | 'points' | 'formatTick'>) {
  const years = [...new Set(points.map(p => p.year))];
  const byKey = new Map(points.map(p => [`${p.year}-${p.month}`, p.total]));
  const max = Math.max(1, ...points.map(p => p.total));
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div role="region" aria-label={title} tabIndex={0} className="overflow-x-auto rounded-lg">
      <table className="num w-full min-w-[46rem] border-separate border-spacing-0.5 text-xs">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="text-muted">
            <th scope="col" className="px-2 py-1.5 text-left font-medium">{t('dash.chart.year')}</th>
            {months.map(m => (
              <th key={m} scope="col" className="px-1 py-1.5 text-right font-medium">{t('analysis.heatmap.month', { n: m })}</th>
            ))}
            <th scope="col" className="px-2 py-1.5 text-right font-medium">{t('dash.chart.yearTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {years.map(year => (
            <tr key={year}>
              <th scope="row" className="px-2 py-2 text-left text-sm font-semibold">{year}</th>
              {months.map(m => {
                const value = byKey.get(`${year}-${m}`);
                return (
                  <td
                    key={m}
                    className={`rounded-md px-1 py-2 text-right ${value ? '' : 'text-muted'}`}
                    style={value ? { background: `color-mix(in srgb, var(--accent) ${Math.round(6 + 34 * (value / max))}%, transparent)` } : undefined}
                  >
                    {value === undefined ? '' : value === 0 ? '–' : formatTick(value)}
                  </td>
                );
              })}
              <td className="px-2 py-2 text-right text-sm font-semibold">
                {formatTick(points.reduce((sum, p) => (p.year === year ? sum + p.total : sum), 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
