import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'solid' | 'link' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary:
    'w-full rounded-xl bg-accent-solid px-4 py-3 text-base font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50',
  // Bordered, the same size as primary, for the actions stacked under it; the 1px border comes out of the padding.
  secondary:
    'w-full cursor-pointer rounded-xl border border-line bg-card px-4 py-[calc(0.75rem-1px)] text-base font-medium text-fg hover:border-muted disabled:cursor-not-allowed disabled:opacity-50',
  // Primary colours at toolbar size, for the one action a toolbar leads with.
  solid:
    'cursor-pointer rounded-lg bg-accent-solid px-3 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-hover',
  // Compact bordered button for toolbars.
  outline:
    'cursor-pointer rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-fg hover:border-muted disabled:cursor-not-allowed disabled:opacity-50',
  // Looks like a text link but is a real button (it runs an action, it does not navigate).
  link: 'cursor-pointer text-left text-accent-text underline underline-offset-4 hover:text-accent-hover',
  // Same look as a muted footer link.
  quiet: 'cursor-pointer rounded text-muted underline-offset-4 hover:text-fg hover:underline',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={`${VARIANTS[variant]} ${className}`} {...props} />;
}
