import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { ThemeToggle } from '../src/ui/components/ThemeToggle';
import { ThemeProvider } from '../src/ui/theme/ThemeProvider';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

it('starts with the requested preview theme in StrictMode, across page mounts', async () => {
  localStorage.setItem('shopeestatx-color-mode', 'dark');
  const light = render(
    <StrictMode>
      <ThemeProvider initialMode="light"><ThemeToggle /></ThemeProvider>
    </StrictMode>,
  );
  expect(screen.getByRole('radio', { name: 'Sáng' })).toBeChecked();
  expect(document.documentElement.dataset.theme).toBe('light');

  const user = userEvent.setup();
  await user.click(screen.getByRole('radio', { name: 'Tối' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  await user.click(screen.getByRole('radio', { name: 'Sáng' }));
  expect(localStorage.getItem('shopeestatx-color-mode')).toBe('light');
  light.unmount();

  render(
    <StrictMode>
      <ThemeProvider initialMode="dark"><ThemeToggle /></ThemeProvider>
    </StrictMode>,
  );
  expect(screen.getByRole('radio', { name: 'Tối' })).toBeChecked();
  expect(document.documentElement.dataset.theme).toBe('dark');
});
