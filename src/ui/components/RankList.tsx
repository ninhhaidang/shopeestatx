interface RankRow {
  key: string;
  name: string;
  /** Small line under the name, e.g. "4 đơn". */
  note?: string;
  value: string;
  /** 0-1: this row against the largest one, drawn as the bar. */
  share: number;
}

/** A ranked list: position, full name (two lines at most), a bar for scale and the figure. */
export function RankList({ label, rows }: { label: string; rows: RankRow[] }) {
  return (
    <ol aria-label={label} className="grid gap-3.5">
      {rows.map((row, i) => (
        <li key={row.key} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-2.5 text-sm">
          <span className="num text-muted">{i + 1}</span>
          <div className="min-w-0">
            <p className="line-clamp-2 [overflow-wrap:anywhere]" title={row.name}>{row.name}</p>
            <div aria-hidden="true" className="mt-1.5 h-1 rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, row.share * 100)}%` }} />
            </div>
            {row.note && <p className="mt-1 text-xs text-muted">{row.note}</p>}
          </div>
          <span className="num font-semibold">{row.value}</span>
        </li>
      ))}
    </ol>
  );
}
