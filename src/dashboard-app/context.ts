import { createContext, useContext } from 'react';
import type { DateRange, Order, OrderData } from '../types/index.js';
import type { RangeSelection } from '../dashboard/range.js';
import type { ShareData } from '../dashboard/share-image.js';

/** What every tab gets once data is loaded. Tabs read this instead of re-deriving the range or the data. */
export interface DashboardContextValue {
  /** Everything fetched, whatever the date range. */
  data: OrderData;
  /** The orders inside the global date range; tab figures are computed from these. */
  orders: Order[];
  range: DateRange;
  selection: RangeSelection;
  setSelection: (next: RangeSelection) => void;
  resetRange: () => void;
  now: Date;
  /** Scan Shopee again (the existing read). */
  refresh: () => void;
  /** What the Đơn hàng tab opens filtered by, set by showOrders; empty when it was opened from the tab bar. */
  ordersFilter: OrdersFilter;
  /** Switch to Đơn hàng, filtered by one shop and/or a search term. */
  showOrders: (filter: OrdersFilter) => void;
  /** The share image of the latest year with orders, or null when there is none. */
  yearShare: { year: number; data: ShareData } | null;
  /** Open the share dialog (the same as the toolbar's «Tạo ảnh khoe»). */
  openShare: () => void;
}

export interface OrdersFilter {
  /** A shopIdentity. */
  shop?: string;
  search?: string;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside <Dashboard>');
  return ctx;
}
