/** ShopeeStatX/filter-engine.ts — Pure FilterEngine and Authoritative Date Evaluation */
import type { Order, FilterCriteria, TimeCriteria, SortDirection } from '../types/index.js';
import { categorizeOrder } from './categories.js';

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
    return authDate.getFullYear() === time.year && authDate.getMonth() + 1 === time.month;
  }

  if (time.kind === 'day') {
    const hasExactDate = Boolean(
      order.deliveryDate || order.orderPlacementDate || extractOrderIdTimestamp(order.orderId),
    );
    if (!hasExactDate) return false;
    const authDate = resolveAuthoritativeDate(order);
    if (!authDate) return false;
    return (
      authDate.getFullYear() === time.year &&
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
};

/** Direct export of FilterEngine.evaluate */
export const evaluate = FilterEngine.evaluate;
