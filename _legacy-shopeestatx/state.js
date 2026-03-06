// ShopeeStatX/state.js
// Shared mutable state — all modules import and mutate state.X directly
// Originally closure variables in results.js lines 32-42

export const state = {
  // Raw order data fetched from Shopee or loaded from storage
  allOrdersData: null,
  
  // Orders after applying active filters/search
  filteredOrders: [],
  
  // Current page number in the table view
  currentPage: 1,
  
  // Number of orders to display per page
  itemsPerPage: 20,
  
  // Specific day selected for drill-down view
  selectedDay: null,
  
  // Number of top shops to show in charts
  shopCount: 5,
  
  // Metric used for shop chart ranking ('amount' or 'count')
  shopMetric: 'amount',
  
  // Active table sorting state
  currentSort: { field: null, direction: 'asc' }
};
