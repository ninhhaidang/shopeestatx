// Cancelled (4) and returned (12) orders are excluded from spending
import type { Order } from '../types/index.js';

export const isExcludedOrder = (o: Pick<Order, 'statusCode'>): boolean => o.statusCode === 4 || o.statusCode === 12;
