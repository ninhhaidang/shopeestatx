interface RankRow {
  key: string;
  name: string;
  /** Small line under the name, e.g. "4 đơn". */
  note?: string;
  value: string;
  /** 0-1: this row against the largest one, drawn as the bar. */
  share: number;
}

/**
 * A ranked list: position, full name (two lines at most), a bar for scale and the figure.
 * With `onSelect` each row is a button; `action` names what it does and replaces the note on hover/focus.
 */
export function RankList({ label, rows, onSelect, action }: { label: string; rows: RankRow[]; onSelect?: (key: string) => void; action?: string }) {
  const grid = 'grid items-start gap-x-2.5 text-sm';
  return (
    <ol aria-label={label} className={`grid ${onSelect ? 'gap-0.5' : 'gap-3.5'}`}>
      {rows.map((row, i) => {
        const cells = (
          <>
            <span className="num text-muted">{i + 1}</span>
            <span className="block min-w-0">
              <span className="line-clamp-2 [overflow-wrap:anywhere]" title={row.name}>{row.name}</span>
              <span aria-hidden="true" className="mt-1.5 block h-1 rounded-full bg-line">
                <span className="block h-full rounded-full bg-accent-fill" style={{ width: `${Math.max(2, row.share * 100)}%` }} />
              </span>
              {row.note && <span className={`mt-1 block text-xs text-muted ${action ? 'group-hover:hidden group-focus-visible:hidden' : ''}`}>{row.note}</span>}
              {action && (
                <span className="sr-only text-xs font-medium text-accent-text group-hover:not-sr-only group-hover:mt-1 group-hover:block group-focus-visible:not-sr-only group-focus-visible:mt-1 group-focus-visible:block">
                  {action} ›
                </span>
              )}
            </span>
            <span className="num font-semibold">{row.value}</span>
          </>
        );
        return (
          <li key={row.key}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(row.key)}
                className={`${grid} group -mx-2 w-[calc(100%+1rem)] cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto_0.5rem] rounded-lg px-2 py-1.5 text-left hover:bg-bg focus-visible:bg-bg`}
              >
                {cells}
                <span aria-hidden="true" className="text-muted group-hover:text-fg">›</span>
              </button>
            ) : (
              <div className={`${grid} grid-cols-[1.25rem_minmax(0,1fr)_auto]`}>{cells}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
