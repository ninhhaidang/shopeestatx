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
}
