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

export interface OrderItem {
  itemId: number | null;
  name: string;
  variation: string;
  quantity: number;
  unitPrice: number;
}

/** One tier of Shopee's category tree. */
export interface CategoryNode {
  catid: number;
  name: string;
}

/** A product's category as Shopee reports it. An empty path means Shopee knows the product but it has none. */
export interface ItemCategory {
  path: CategoryNode[];
  fetchedAt: string;
}

/** Category of each product ever seen, keyed by item id as a string. */
export type CategoryMap = Record<string, ItemCategory>;

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
  // Added in schema v2; absent on orders cached by older versions.
  items?: OrderItem[];
  shopId?: number | null;
  parcelCount?: number | null;
  deliveryDate: string | null;
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
  /** Layout of the cached orders; a cache older than SCHEMA_VERSION is rebuilt by a full fetch. */
  schemaVersion?: number;
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
  categories: CategoryMap;
}
