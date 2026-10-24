import type { ReactNode } from 'react';
import { Button } from './Button';

interface StateMessageProps {
  title: string;
  message?: ReactNode;
  /** Error states interrupt (role=alert); empty states are polite (role=status). */
  tone?: 'neutral' | 'error';
  action?: { label: string; onClick: () => void };
}

/** Centered empty / error panel with an optional action. */
export function StateMessage({ title, message, tone = 'neutral', action }: StateMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-xl border border-line bg-card p-6 text-center"
    >
      <h2 className={`font-serif text-lg font-semibold ${tone === 'error' ? 'text-bad' : ''}`}>{title}</h2>
      {message && <p className="text-sm text-muted">{message}</p>}
      {action && (
        <div className="mt-2 w-full max-w-xs">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}
