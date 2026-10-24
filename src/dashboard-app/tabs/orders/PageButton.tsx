import type { ReactNode } from 'react';

export function PageButton({
  label, current, disabled, onClick, children,
}: { label: string; current?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`num min-w-8 cursor-pointer rounded-md border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 ${
        current ? 'border-accent-text bg-accent-solid font-semibold text-on-accent' : 'border-line bg-card text-fg'
      }`}
    >
      {children}
    </button>
  );
}
