import { formatCurrency } from '../i18n/format.js';

/** Full amount, "1.300.000 ₫". */
export const money = (n: number) => formatCurrency(n);
/** Compact amount, "1,3 tr". */
export const shortMoney = (n: number) => formatCurrency(n, true);
