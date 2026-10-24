/** Placeholder block shown while data loads. Size it with className to match the real content. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-line ${className}`} />;
}
