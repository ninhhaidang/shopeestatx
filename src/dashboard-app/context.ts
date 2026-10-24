import { createContext, useContext } from 'react';
import type { DateRange, Order, OrderData } from '../types/index.js';
import type { RangeSelection } from '../dashboard/range.js';

/** What every tab gets once data is loaded. Tabs read this instead of re-deriving the range or the data. */
export interface DashboardContextValue {
  /** Everything fetched, whatever the date range. */
  data: OrderData;
  /** The orders inside the global date range; tab figures are computed from these. */
  orders: Order[];
  range: DateRange;
  selection: RangeSelection;
  resetRange: () => void;
  now: Date;
  /** Scan Shopee again (the existing read). */
  refresh: () => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside <Dashboard>');
  return ctx;
}
