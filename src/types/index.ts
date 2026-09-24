// Shared TypeScript types for ShopeeStatX

export type StatusCode = 0 | 3 | 4 | 7 | 8 | 9 | 12;
export type ShopMetric = 'amount' | 'orders' | 'products';
export type SortDirection = 'asc' | 'desc';

export interface UserProfile {
  userId?: number;
  uid?: string;
  username: string;
  name?: string;
  avatar: string;
  shopId?: number;
}

export interface Order {
  orderId: string;
  name: string;
  productCount: number;
  subTotal: number;
  subTotalFormatted: string;
  status: string;
  statusCode: StatusCode;
  shopName: string;
  productSummary: string;
  deliveryDate: string | null;
  orderPlacementDate?: string | null;
  orderMonth: number | null;
  orderYear: number | null;
}

export interface OrderData {
  user?: UserProfile | null;
  orders: Order[];
  totalCount: number;
  totalAmount: number;
  totalAmountFormatted: string;
  fetchedAt: string;
  cachedAt?: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface AppState {
  allOrdersData: OrderData | null;
  filteredOrders: Order[];
  currentPage: number;
  itemsPerPage: number;
  selectedDay: number | null;
  shopCount: number;
  shopMetric: ShopMetric;
  currentSort: { field: string | null; direction: SortDirection };
  dateRange: DateRange;
  criteria: FilterCriteria;
}

/**
 * Temporal criteria specification expressing user filtering intent across:
 * all-time, a calendar year, a specific month, an exact day, or a custom date range.
 */
export type TimeCriteria =
  | { kind: 'all' }
  | { kind: 'year'; year: number }
  | { kind: 'month'; year: number; month: number }
  | { kind: 'day'; year: number; month: number; day: number }
  | { kind: 'range'; start: Date; end: Date };

/** Sort specification defining field and sort direction */
export interface FilterSort {
  field: string | null;
  direction: SortDirection;
}

/**
 * Complete filter criteria value object containing temporal, categorical,
 * status, keyword search, and sorting constraints.
 */
export interface FilterCriteria {
  time: TimeCriteria;
  status?: string | null;
  category?: string | null;
  searchTerm?: string | null;
  sort?: FilterSort | null;
}

/**
 * Discriminator representing the category of an active filter constraint token.
 */
export type FilterChipType =
  | 'year'
  | 'month'
  | 'day'
  | 'dateRange'
  | 'status'
  | 'category'
  | 'search';

/**
 * A visible token representing an active constraint within the current FilterCriteria,
 * providing a clear action to remove it.
 */
export interface FilterChip {
  type: FilterChipType;
  label: string;
  remove: (criteria?: FilterCriteria) => FilterCriteria;
}

/**
 * Identifier for relative date interval presets supported by the DateRangePicker.
 */
export type DatePreset = 'last7' | 'thisMonth' | 'lastMonth' | 'last3months' | 'thisYear' | 'custom';
