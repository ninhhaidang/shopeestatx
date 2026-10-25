import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { StyleToggle } from '../src/ui/components/StyleToggle';
import { StyleProvider } from '../src/ui/theme/StyleProvider';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('style-warm');
});

it('defaults to fintech and persists a switch to warm, across page mounts', async () => {
  const fintech = render(
    <StrictMode>
      <StyleProvider><StyleToggle /></StyleProvider>
    </StrictMode>,
  );
  expect(screen.getByRole('radio', { name: 'Fintech' })).toBeChecked();
  expect(document.documentElement.classList.contains('style-warm')).toBe(false);

  const user = userEvent.setup();
  await user.click(screen.getByRole('radio', { name: 'Ấm áp' }));
  expect(document.documentElement.classList.contains('style-warm')).toBe(true);
  expect(localStorage.getItem('shopeestatx-display-style')).toBe('warm');
  fintech.unmount();

  render(
    <StrictMode>
      <StyleProvider><StyleToggle /></StyleProvider>
    </StrictMode>,
  );
  expect(screen.getByRole('radio', { name: 'Ấm áp' })).toBeChecked();
  expect(document.documentElement.classList.contains('style-warm')).toBe(true);
});

it('honors initialStyle without touching storage', () => {
  localStorage.setItem('shopeestatx-display-style', 'warm');
  render(
    <StrictMode>
      <StyleProvider initialStyle="fintech"><StyleToggle /></StyleProvider>
    </StrictMode>,
  );
  expect(screen.getByRole('radio', { name: 'Fintech' })).toBeChecked();
  expect(document.documentElement.classList.contains('style-warm')).toBe(false);
});
