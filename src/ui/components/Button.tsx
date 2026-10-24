import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'link' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary:
    'w-full rounded-xl bg-accent-solid px-4 py-3 text-base font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50',
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
