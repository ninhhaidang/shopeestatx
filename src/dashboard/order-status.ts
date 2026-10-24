// Cancelled (4) and returned (12) orders are excluded from spending
import type { Order, StatusCode } from '../types/index.js';

export const isExcludedOrder = (o: Pick<Order, 'statusCode'>): boolean => o.statusCode === 4 || o.statusCode === 12;

/** Statuses an order can have, with the i18n key of their label (for the status filter). */
export const ORDER_STATUSES: { code: StatusCode; label: string }[] = [
  { code: 3, label: 'status.completed' },
  { code: 4, label: 'status.cancelled' },
  { code: 7, label: 'status.waitingShipment' },
  { code: 8, label: 'status.delivering' },
  { code: 9, label: 'status.waitingPayment' },
  { code: 12, label: 'status.returned' },
];
