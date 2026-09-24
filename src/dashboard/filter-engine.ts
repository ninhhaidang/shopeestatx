/** ShopeeStatX/filter-engine.ts — Pure FilterEngine and Authoritative Date Evaluation */
import type { Order, FilterCriteria, TimeCriteria, SortDirection, FilterChip } from '../types/index.js';
import { categorizeOrder } from './categories.js';
import { t } from '../i18n/index.js';
import { formatDate } from '../i18n/format.js';
/** Extract valid Unix timestamp in seconds from orderId if within 2020..now */
function extractOrderIdTimestamp(orderId: string | null | undefined): Date | null {
  if (!orderId) return null;
  const idStr = String(orderId);
  if (idStr.length < 10) return null;
  const timestampSec = parseInt(idStr.substring(0, 10), 10);
  if (isNaN(timestampSec)) return null;
  const testDate = new Date(timestampSec * 1000);
  if (
    !isNaN(testDate.getTime()) &&
    testDate.getFullYear() >= 2020 &&
    testDate.getTime() <= Date.now()
  ) {
    return testDate;
  }
  return null;
}

/**
 * Resolves the authoritative timestamp for an order following the domain rule:
 * 1. Prioritize deliveryDate if present and valid.
 * 2. Deterministic fallback to order placement timestamp:
 *    a. orderPlacementDate if present and valid.
 *    b. 10-digit Unix timestamp extracted from orderId (between year 2020 and now).
 *    c. orderYear and orderMonth (defaults to 1st of month).
 * 3. Returns null if no valid date information can be determined.
 */
export function resolveAuthoritativeDate(order: Order): Date | null {
  // 1. Prioritize deliveryDate
  if (order.deliveryDate) {
    const delivery = new Date(order.deliveryDate);
    if (!isNaN(delivery.getTime())) {
      return delivery;
    }
  }

  // 2a. Fallback: explicit orderPlacementDate
  if (order.orderPlacementDate) {
    const placement = new Date(order.orderPlacementDate);
    if (!isNaN(placement.getTime())) {
      return placement;
    }
  }

  // 2b. Fallback: orderId timestamp (first 10 digits as unix timestamp in seconds)
  const orderIdDate = extractOrderIdTimestamp(order.orderId);
  if (orderIdDate) {
    return orderIdDate;
  }

  // 2c. Fallback: orderYear and orderMonth
  if (order.orderYear !== null && order.orderYear !== undefined && !isNaN(order.orderYear)) {
    const month = (order.orderMonth !== null && order.orderMonth !== undefined && !isNaN(order.orderMonth))
      ? order.orderMonth - 1
      : 0;
    return new Date(order.orderYear, month, 1);
  }

  return null;
}

function matchesTime(order: Order, time: TimeCriteria): boolean {
  if (time.kind === 'all') return true;

  if (time.kind === 'year') {
    const authDate = resolveAuthoritativeDate(order);
    if (!authDate) return false;
    return authDate.getFullYear() === time.year;
  }

  if (time.kind === 'month') {
    const authDate = resolveAuthoritativeDate(order);
    if (!authDate) return false;
    const matchesYear = time.year ? authDate.getFullYear() === time.year : true;
    return matchesYear && authDate.getMonth() + 1 === time.month;
  }

  if (time.kind === 'day') {
    const hasExactDate = Boolean(
      order.deliveryDate || order.orderPlacementDate || extractOrderIdTimestamp(order.orderId),
    );
    if (!hasExactDate) return false;
    const authDate = resolveAuthoritativeDate(order);
    if (!authDate) return false;
    const matchesYear = time.year ? authDate.getFullYear() === time.year : true;
    return (
      matchesYear &&
      authDate.getMonth() + 1 === time.month &&
      authDate.getDate() === time.day
    );
  }

  if (time.kind === 'range') {
    const authDate = resolveAuthoritativeDate(order);
    if (!authDate) return false;
    return authDate >= time.start && authDate <= time.end;
  }

  return true;
}

function matchesStatus(order: Order, status: string | null | undefined): boolean {
  if (!status || status.trim() === '') return true;
  return order.statusCode === Number(status);
}

function matchesCategory(order: Order, category: string | null | undefined): boolean {
  if (!category || category.trim() === '') return true;
  return categorizeOrder(order) === category;
}

function matchesSearch(order: Order, searchTerm: string | null | undefined): boolean {
  if (!searchTerm) return true;
  const query = searchTerm.trim().toLowerCase();
  if (query.length === 0) return true;

  const searchableText = [
    order.orderId?.toString(),
    order.name,
    order.shopName,
    order.productSummary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query);
}

/** Sort orders by field and direction, using resolveAuthoritativeDate for date ordering */
export function sortOrders(
  orders: Order[],
  field: string | null | undefined,
  direction: SortDirection = 'asc',
): Order[] {
  if (!field) return [...orders];

  const isAsc = direction === 'asc';

  return [...orders].sort((a, b) => {
    let aVal: number | string | null = null;
    let bVal: number | string | null = null;

    switch (field) {
      case 'deliveryDate': {
        const aDate = resolveAuthoritativeDate(a);
        const bDate = resolveAuthoritativeDate(b);
        aVal = aDate ? aDate.getTime() : 0;
        bVal = bDate ? bDate.getTime() : 0;
        break;
      }
      case 'subTotal':
        aVal = a.subTotal || 0;
        bVal = b.subTotal || 0;
        break;
      case 'status':
        aVal = a.statusCode;
        bVal = b.statusCode;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return isAsc ? -1 : 1;
    if (aVal > bVal) return isAsc ? 1 : -1;
    return 0;
  });
}

const STATUS_LABELS: Record<string, string> = {
  '3': 'status.completed',
  '4': 'status.cancelled',
  '7': 'status.waitingShipment',
  '8': 'status.delivering',
  '9': 'status.waitingPayment',
  '12': 'status.returned',
};

function buildYearChip(year: number, criteria: FilterCriteria): FilterChip {
  return {
    type: 'year',
    label: t('filter.chip.year', { value: year }),
    remove: (c = criteria) => {
      if (c.time.kind === 'month') {
        return { ...c, time: { kind: 'month', year: 0, month: c.time.month } };
      }
      if (c.time.kind === 'day') {
        return { ...c, time: { kind: 'day', year: 0, month: c.time.month, day: c.time.day } };
      }
      return { ...c, time: { kind: 'all' } };
    },
  };
}

function buildMonthChip(year: number, month: number, criteria: FilterCriteria): FilterChip {
  return {
    type: 'month',
    label: t('filter.chip.month', { value: month }),
    remove: (c = criteria) => ({
      ...c,
      time: year ? { kind: 'year', year } : { kind: 'all' },
    }),
  };
}

function buildDayChip(year: number, month: number, day: number, criteria: FilterCriteria): FilterChip {
  return {
    type: 'day',
    label: t('filter.chip.day', { value: `${day}/${month}` }),
    remove: (c = criteria) => ({
      ...c,
      time: { kind: 'month', year, month },
    }),
  };
}

/**
 * Purely derives visible FilterChips and their explicit removal actions from FilterCriteria.
 * Contains zero DOM scraping or browser dependencies.
 */
export function deriveFilterChips(criteria: FilterCriteria): FilterChip[] {
  const chips: FilterChip[] = [];

  if (criteria.time) {
    if (criteria.time.kind === 'year') {
      chips.push(buildYearChip(criteria.time.year, criteria));
    } else if (criteria.time.kind === 'month') {
      const { year, month } = criteria.time;
      if (year) {
        chips.push(buildYearChip(year, criteria));
      }
      chips.push(buildMonthChip(year, month, criteria));
    } else if (criteria.time.kind === 'day') {
      const { year, month, day } = criteria.time;
      if (year) {
        chips.push(buildYearChip(year, criteria));
      }
      if (month) {
        chips.push(buildMonthChip(year, month, criteria));
      }
      chips.push(buildDayChip(year, month, day, criteria));
    } else if (criteria.time.kind === 'range') {
      const { start, end } = criteria.time;
      const startStr = start ? formatDate(start) : '…';
      const endStr = end ? formatDate(end) : '…';
      chips.push({
        type: 'dateRange',
        label: t('filter.chip.dateRange', { start: startStr, end: endStr }),
        remove: (c = criteria) => ({ ...c, time: { kind: 'all' } }),
      });
    }
  }

  if (criteria.status && criteria.status.trim() !== '') {
    const statusCode = criteria.status.trim();
    const translationKey = STATUS_LABELS[statusCode];
    const label = translationKey ? t(translationKey) : statusCode;
    chips.push({
      type: 'status',
      label,
      remove: (c = criteria) => ({ ...c, status: null }),
    });
  }

  if (criteria.category && criteria.category.trim() !== '') {
    const category = criteria.category.trim();
    chips.push({
      type: 'category',
      label: t('filter.chip.category', { value: category }),
      remove: (c = criteria) => ({ ...c, category: null }),
    });
  }

  if (criteria.searchTerm && criteria.searchTerm.trim() !== '') {
    const searchTerm = criteria.searchTerm.trim();
    chips.push({
      type: 'search',
      label: t('filter.chip.search', { value: searchTerm }),
      remove: (c = criteria) => ({ ...c, searchTerm: null }),
    });
  }

  return chips;
}

/**
 * Pure in-process FilterEngine evaluating orders against a unified FilterCriteria value object.
 * Contains zero DOM dependencies, window references, or global mutable state.
 */
export const FilterEngine = {
  /**
   * Evaluates orders against the provided criteria in a single pure pass,
   * executing temporal filtering, status filtering, category keyword matching,
   * text search, and sorting.
   */
  evaluate(orders: Order[], criteria: FilterCriteria): Order[] {
    const filtered = orders.filter(
      order =>
        matchesTime(order, criteria.time) &&
        matchesStatus(order, criteria.status) &&
        matchesCategory(order, criteria.category) &&
        matchesSearch(order, criteria.searchTerm),
    );

    if (criteria.sort && criteria.sort.field) {
      return sortOrders(filtered, criteria.sort.field, criteria.sort.direction);
    }

    return filtered;
  },
  deriveFilterChips,
};

/** Direct export of FilterEngine.evaluate */
export const evaluate = FilterEngine.evaluate;
