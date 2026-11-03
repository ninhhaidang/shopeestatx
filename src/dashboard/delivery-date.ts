// Delivery dates: one validity rule shared by every reader, so sorting, range filtering, display
// and export agree. A stored date that cannot be parsed counts as missing — never as a real date.
import { formatDate } from '../i18n/format.js';
import type { Order } from '../types/index.js';

type Dated = Pick<Order, 'deliveryDate'>;

/** Milliseconds of the delivery timestamp, or null when the order has no usable delivery date. */
export function deliveryTimeOf(order: Dated): number | null {
  if (!order.deliveryDate) return null;
  const time = new Date(order.deliveryDate).getTime();
  return Number.isNaN(time) ? null : time;
}

/** The delivery date for display or export, or null when it should read as "no date". */
export function deliveryDateOf(order: Dated): Date | null {
  const time = deliveryTimeOf(order);
  return time === null ? null : new Date(time);
}

/** The local delivery date as text, falling back to `undatedLabel` when it is missing or unusable. */
export function formatDeliveryDate(order: Dated, undatedLabel: string): string {
  const date = deliveryDateOf(order);
  return date ? formatDate(date) : undatedLabel;
}
