import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Dashboard } from '../src/dashboard-app/Dashboard';
import { renderSurface } from './support/render';
import { makeData, makeOrder } from './support/orders';
import { mockColorScheme } from './support/match-media';

vi.mock('chart.js', () => ({
  Chart: class { static register() {} destroy() {} },
  BarController: {}, BarElement: {}, CategoryScale: {}, LinearScale: {}, Tooltip: {},
}));
afterEach(() => vi.useRealTimers());

it('advances the current month without replacing order data', async () => {
  mockColorScheme('light');
  let clock = new Date(2026, 9, 31, 23, 59);
  const data = makeData([
    makeOrder('2026-10-15T12:00:00', { subTotal: 100000 }),
    makeOrder('2026-11-01T00:00:00', { subTotal: 200000 }),
  ]);
  const host = { scanOnOpen: false, loadCached: async () => data, refresh: vi.fn() };
  renderSurface(<Dashboard host={host} now={() => clock} />);
  await screen.findByTestId('net-spend');
  fireEvent.change(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), { target: { value: 'thisMonth' } });
  expect(screen.getByTestId('net-spend')).toHaveTextContent('100.000');
  vi.useFakeTimers();
  clock = new Date(2026, 10, 1, 0, 0);
  await act(async () => { vi.advanceTimersByTime(60000); });
  fireEvent(window, new Event('focus'));
  expect(screen.getByTestId('net-spend')).toHaveTextContent('200.000');
  expect(host.refresh).not.toHaveBeenCalled();
});
