// Shared mutable state — all modules import and mutate state.X directly
import type { AppState } from '../types/index.js';

export const state: AppState = {
  allOrdersData: null,
  filteredOrders: [],
  currentPage: 1,
  itemsPerPage: 20,
  selectedDay: null,
  shopCount: 5,
  shopMetric: 'amount',
  currentSort: { field: null, direction: 'asc' },
};
