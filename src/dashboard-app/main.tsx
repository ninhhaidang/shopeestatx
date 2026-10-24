import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initLocale } from '../i18n/index.js';
import { ThemeProvider } from '../ui/theme/ThemeProvider';
import '../ui/styles/app.css';
import { Dashboard } from './Dashboard';
import { chromeHost } from './chrome-host';
import { mockHost } from './mock-host';

initLocale();

// Outside the extension (no chrome.storage / chrome.scripting) fall back to demo data.
const inExtension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.scripting;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Dashboard host={inExtension ? chromeHost : mockHost} />
    </ThemeProvider>
  </StrictMode>,
);
