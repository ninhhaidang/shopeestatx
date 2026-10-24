import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initLocale } from '../i18n/index.js';
import { ThemeProvider } from '../ui/theme/ThemeProvider';
import '../ui/styles/app.css';
import { Popup } from './Popup';
import { chromeHost } from './chrome-host';

initLocale();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Popup host={chromeHost} />
    </ThemeProvider>
  </StrictMode>,
);
