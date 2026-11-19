// What the popup needs from its host (Chrome). Keeps the component testable without a chrome.* mock.

export interface PopupUser {
  name: string;
  avatar?: string;
}

/** What the cached order history holds: the dashboard's order count and when it was last fetched. */
export interface PopupCache {
  orders: number;
  updatedAt: string;
}

export interface PopupHost {
  /** User cached by the last analysis, if any. */
  getUser(): Promise<PopupUser | null>;
  /** Summary of the cached orders, if any. Reads local storage only, never Shopee. */
  getCache(): Promise<PopupCache | null>;
  /** True when the active tab is on the Shopee domain. */
  isOnShopee(): Promise<boolean>;
  /** Remember the Shopee tab and open the dashboard (side panel, else a tab) to fetch orders. */
  startAnalysis(): Promise<void>;
  /** Open the dashboard (side panel, else a tab) on the cached orders, without scanning Shopee. */
  openDashboard(): void;
  openLogin(): void;
  openHelp(): void;
  openPrivacy(): void;
}
