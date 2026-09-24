// Shared TypeScript types for ShopeeStatX

export type StatusCode = 0 | 3 | 4 | 7 | 8 | 9 | 12;
export type ShopMetric = 'amount' | 'orders' | 'products';
export type SortDirection = 'asc' | 'desc';

/** Color mode options for dual-axis theme system */
export type ColorMode = 'light' | 'dark' | 'system';

/** Resolved active color mode applied to DOM */
export type ResolvedColorMode = 'light' | 'dark';

export interface UserProfile {
  userId?: number;
  uid?: string;
  username: string;
  name?: string;
  avatar: string;
  shopId?: number;
}

export interface OrderItem {
  name: string;
  quantity?: number;
  price?: number;
  priceFormatted?: string;
  imageUrl?: string;
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
  items?: OrderItem[];
  shippingFee?: number;
  shippingFeeFormatted?: string;
  voucherDiscount?: number;
  voucherDiscountFormatted?: string;
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


/**
 * Numeric index identifying the active view within the tabbed dashboard shell:
 * 1 = Tổng quan (Financial Overview)
 * 2 = Phân tích & Thói quen (Analytics & Habits)
 * 3 = Lịch sử đơn hàng (Order History & Audit)
 */
export type TabIndex = 1 | 2 | 3;

export interface AppState {
  allOrdersData: OrderData | null;
  filteredOrders: Order[];
  currentPage: number;
  itemsPerPage: number;
  shopCount: number;
  shopMetric: ShopMetric;
  criteria: FilterCriteria;
  activeTab: TabIndex;
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

/**
 * Callback seam invoked when a visual drill-down interaction occurs in charts or heatmap.
 */
export type DrillDownCallback = (criteriaUpdate: Partial<FilterCriteria>) => void;

/**
 * Aggregated financial metrics for Tab 1 Executive KPI Strip & Split-View Hero.
 */
export interface OverviewMetrics {
  totalSpend: number;
  thisMonthSpend: number;
  totalOrders: number;
  completedOrdersCount: number;
  avgOrderValue: number;
  yearChange: number | null;
  monthChange: number | null;
  avgOrderChange: number | null;
  burnRate: number;
  monthEndForecast: number;
  daysRemaining: number;
  budgetPct: number;
  budgetRemaining: number;
  currentYear: number;
  currentMonth: number;
}
/**
 * Loyalty tier classification badge for merchant ranking table.
 */
export type LoyaltyTier = 'VIP' | 'Regular' | 'New';

/**
 * Data item representing a category slice in the percentage legend.
 */
export interface CategoryLegendItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

/**
 * Discriminator identifying the spending pattern category of an insight card.
 */
export type InsightPattern =
  | 'peak-day'
  | 'merchant-share'
  | 'category-trends'
  | 'spending-trend'
  | 'frequency'
  | 'savings';

/**
 * Auto-generated insight card highlighting key spending patterns.
 */
export interface InsightCard {
  id: string;
  pattern: InsightPattern;
  icon: string;
  title: string;
  value: string;
  description: string;
}
