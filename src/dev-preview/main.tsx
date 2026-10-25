import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from '../dashboard-app/Dashboard';
import { mockHost } from '../dashboard-app/mock-host';
import { initLocale } from '../i18n/index.js';
import { StyleProvider } from '../ui/theme/StyleProvider';
import { ThemeProvider } from '../ui/theme/ThemeProvider';
import '../ui/styles/app.css';
import './preview.css';

// This HTML entry is dev-only, never a production Rollup input or a public asset.
if (import.meta.env.DEV) {
  initLocale();
  const params = new URLSearchParams(window.location.search);
  const width = params.get('width') === 'tab' ? 'tab' : '400';
  const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.previewWidth = width;
  document.title = `ShopeeStatX dev — ${width === 'tab' ? 'Tab' : '400px'} / ${theme}`;

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider initialMode={theme}>
        <StyleProvider>
          <Dashboard host={mockHost} />
        </StyleProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
