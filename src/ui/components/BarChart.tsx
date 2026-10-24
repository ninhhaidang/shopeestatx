import { useEffect, useRef } from 'react';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';
import { t } from '../../i18n/index.js';
import { useTheme } from '../theme/ThemeProvider';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export interface BarChartProps {
  /** Names the chart for assistive tech and the data table. */
  title: string;
  labels: string[];
  values: number[];
  /** Header of the label column in the data table, e.g. "Tháng". */
  labelHeader: string;
  /** Header of the value column and tooltip series name, e.g. "Chi tiêu". */
  valueHeader: string;
  formatValue: (value: number) => string;
  /** Compact form for the y axis. */
  formatTick: (value: number) => string;
}

/** Colours come from the active theme's tokens, so the chart follows Light/Dark. */
function readColors() {
  const css = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return { bar: pick('--accent', '#ee4d2d'), hover: pick('--accent-strong', '#c2371b'), text: pick('--muted', '#5b6470'), grid: pick('--line', '#d6dbe1') };
}

/**
 * Chart.js bar chart. The canvas is a picture for sighted users; the same numbers are always
 * available as a table below it (keyboard and screen reader friendly).
 */
export function BarChart({ title, labels, values, labelHeader, valueHeader, formatValue, formatTick }: BarChartProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  // Latest formatters without re-creating the chart on every render.
  const fmt = useRef({ formatValue, formatTick });
  fmt.current = { formatValue, formatTick };

  useEffect(() => {
    if (!canvas.current) return;
    const c = readColors();
    const chart = new Chart(canvas.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: valueHeader, data: values, backgroundColor: c.bar, hoverBackgroundColor: c.hover, borderRadius: 4 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => fmt.current.formatValue(ctx.raw as number) } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: c.text, callback: v => fmt.current.formatTick(v as number) }, grid: { color: c.grid } },
          x: { ticks: { color: c.text }, grid: { display: false } },
        },
      },
    });
    return () => chart.destroy();
  }, [labels, values, valueHeader, theme]);

  return (
    <div>
      <div className="relative h-44 @2xl:h-60">
        <canvas ref={canvas} role="img" aria-label={t('dash.chart.summary', { title, count: labels.length })} />
      </div>
      <details className="mt-3 text-sm">
        <summary className="w-fit cursor-pointer rounded text-muted hover:text-fg">{t('dash.chart.showTable')}</summary>
        <table className="num mt-2 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 font-medium">{labelHeader}</th>
              <th scope="col" className="py-1 text-right font-medium">{valueHeader}</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="py-1 font-normal">{label}</th>
                <td className="py-1 text-right">{formatValue(values[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
