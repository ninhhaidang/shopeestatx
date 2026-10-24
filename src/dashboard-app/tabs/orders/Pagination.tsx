import { t } from '../../../i18n/index.js';
import { PageButton } from './PageButton';

/** Page numbers to show: all of them up to 7, else first, last and the neighbours of the current page (null = gap). */
function pageItems(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items: (number | null)[] = [1];
  if (page > 3) items.push(null);
  for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) items.push(i);
  if (page < pages - 2) items.push(null);
  items.push(pages);
  return items;
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  return (
    <nav aria-label={t('orders.pagination')} className="flex flex-wrap items-center gap-1">
      <PageButton label={t('orders.prevPage')} disabled={page === 1} onClick={() => onPage(page - 1)}>‹</PageButton>
      {pageItems(page, pages).map((item, i) =>
        item === null ? (
          <span key={`gap-${i}`} aria-hidden="true">…</span>
        ) : (
          <PageButton key={item} label={t('orders.page', { n: item })} current={item === page} onClick={() => onPage(item)}>
            {item}
          </PageButton>
        ),
      )}
      <PageButton label={t('orders.nextPage')} disabled={page === pages} onClick={() => onPage(page + 1)}>›</PageButton>
    </nav>
  );
}
