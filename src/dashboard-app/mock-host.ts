// Used when the page is opened outside the extension (vite dev / preview): demo data, no Chrome APIs.
import type { OrderData } from '../types/index.js';
import type { DashboardHost } from './host';

const loadMock = async (): Promise<OrderData> => (await import('../dashboard/mock-data.js')).mockData;

export const mockHost: DashboardHost = {
  scanOnOpen: false,
  loadCached: loadMock,
  async refresh() {
    return { data: await loadMock(), added: 0 };
  },
};
