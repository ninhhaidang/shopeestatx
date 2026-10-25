import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initLocale } from '../i18n/index.js';
import { StyleProvider } from '../ui/theme/StyleProvider';
import { ThemeProvider } from '../ui/theme/ThemeProvider';
import '../ui/styles/app.css';
import { Dashboard } from './Dashboard';
import { chromeHost } from './chrome-host';
import { mockHost } from './mock-host';

initLocale();

// Outside the extension (no chrome.storage / chrome.scripting) fall back to demo data. In a dev build,
// `?mock=1` shows the demo data even inside the extension; a production build ignores it.
const inExtension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.scripting;
const forceMock = import.meta.env.DEV && new URLSearchParams(window.location.search).get('mock') === '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <StyleProvider>
        <Dashboard host={inExtension && !forceMock ? chromeHost : mockHost} />
      </StyleProvider>
    </ThemeProvider>
  </StrictMode>,
);
