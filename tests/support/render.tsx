import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../src/ui/theme/ThemeProvider';

/** Render a surface root inside the app providers; returns a ready user-event instance. */
export function renderSurface(ui: ReactElement) {
  return { user: userEvent.setup(), ...render(<ThemeProvider>{ui}</ThemeProvider>) };
}
