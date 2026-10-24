// What the popup needs from its host (Chrome). Keeps the component testable without a chrome.* mock.

export interface PopupUser {
  name: string;
  avatar?: string;
}

export interface PopupHost {
  /** User cached by the last analysis, if any. */
  getUser(): Promise<PopupUser | null>;
  /** True when the active tab is on the Shopee domain. */
  isOnShopee(): Promise<boolean>;
  /** Remember the Shopee tab and open the dashboard to fetch orders. */
  startAnalysis(): Promise<void>;
  openLogin(): void;
  openHelp(): void;
  openPrivacy(): void;
}
