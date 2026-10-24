import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../ui/theme/ThemeProvider';
import '../ui/styles/app.css';
import { Privacy } from './Privacy';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Privacy />
    </ThemeProvider>
  </StrictMode>,
);
