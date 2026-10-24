import type { UserProfile } from '../types/index.js';

/** The Shopee account the orders belong to: avatar (hidden if it fails to load) and name. */
export function AccountChip({ user }: { user: UserProfile }) {
  const name = user.username || user.name || '';
  if (!name && !user.avatar) return null;
  return (
    <div data-testid="account" title={name} className="flex min-w-0 items-center gap-2">
      {user.avatar && (
        <img src={user.avatar} alt="" className="size-7 rounded-full" onError={e => (e.currentTarget.hidden = true)} />
      )}
      <span className="hidden max-w-40 truncate text-sm @2xl:inline">{name}</span>
    </div>
  );
}
