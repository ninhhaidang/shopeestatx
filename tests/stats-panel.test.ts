import { beforeEach, describe, expect, it } from 'vitest';
import { renderStatsPanel } from '../src/dashboard/stats-panel';
import { computeStats } from '../src/dashboard/stats';
import type { Order } from '../src/types';

const order: Order = {
  orderId: '1', name: 'A', productCount: 1, subTotal: 100_000, subTotalFormatted: '',
  status: 'Hoàn thành', statusCode: 3, shopName: 's - Shop', productSummary: '',
  deliveryDate: new Date(2025, 0, 15, 10).toISOString(), orderMonth: 1, orderYear: 2025,
  refundAmount: 0, itemsTotal: 130_000, items: [{ name: 'A', quantity: 1, unitPrice: 130_000 }],
};

describe('stats panel', () => {
  let container: HTMLElement;
  beforeEach(() => { container = document.createElement('div'); });

  it('shows the re-scan hint and masks figures an old cache cannot provide', () => {
    renderStatsPanel(container, computeStats([order]), true);
    expect(container.querySelector('#btnStatsRescan')).not.toBeNull();
    expect(container.textContent).not.toContain('30.000');
    expect(container.querySelector('details')).toBeNull();
  });

  it('shows savings and product lists for a current cache, without the hint', () => {
    renderStatsPanel(container, computeStats([order]), false);
    expect(container.querySelector('#btnStatsRescan')).toBeNull();
    expect(container.textContent).toContain('30.000');
    expect(container.querySelectorAll('details')).toHaveLength(2);
  });
});
