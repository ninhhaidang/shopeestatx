// What the welcome page needs from its host (Chrome). Keeps the component testable without a chrome.* mock.

export interface WelcomeHost {
  openShopee(): void;
  openPrivacy(): void;
}
