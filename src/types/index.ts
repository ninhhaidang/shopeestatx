// Shared TypeScript types for ShopeeStatX

export type StatusCode = 0 | 3 | 4 | 7 | 8 | 9 | 12;
export type SortDirection = 'asc' | 'desc';

export interface UserProfile {
  userId?: number;
  uid?: string;
  username: string;
  name?: string;
  avatar: string;
  shopId?: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
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
  /** Stable seller ID from the order response; absent in older caches. */
  shopId?: string;
  productSummary: string;
  deliveryDate: string | null;
  orderMonth: number | null;
  orderYear: number | null;
  /** Original amount of an excluded order (cancelled/returned); 0 otherwise. Absent in caches saved before this field existed. */
  refundAmount?: number;
  /** Sum of item price × quantity before order-level discounts. Absent in older caches. */
  itemsTotal?: number;
  items?: OrderItem[];
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
