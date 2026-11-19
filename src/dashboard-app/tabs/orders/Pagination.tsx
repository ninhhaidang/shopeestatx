import {
  Pagination as Pages,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from '@ui-sdk/react/pagination';
import { t } from '../../../i18n/index.js';

const pageButton =
  'num min-w-8 cursor-pointer rounded-md border border-line bg-card px-2 py-1 text-fg data-disabled:cursor-not-allowed data-disabled:opacity-40 data-current:border-accent-text data-current:bg-accent-solid data-current:font-semibold data-current:text-on-accent';

/** First, last and the neighbours of the current page, with a gap (…) between. */
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  return (
    <Pages aria-label={t('orders.pagination')} page={page} pageCount={pages} onPageChange={onPage}>
      <PaginationList className="flex flex-wrap items-center gap-1">
        {({ items }) => (
          <>
            <PaginationItem>
              <PaginationPrevious aria-label={t('orders.prevPage')} className={pageButton}>‹</PaginationPrevious>
            </PaginationItem>
            {items.map(item => (
              <PaginationItem key={item}>
                {typeof item === 'number' ? (
                  <PaginationLink page={item} aria-label={t('orders.page', { n: item })} className={pageButton} />
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext aria-label={t('orders.nextPage')} className={pageButton}>›</PaginationNext>
            </PaginationItem>
          </>
        )}
      </PaginationList>
    </Pages>
  );
}
