import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DBProvider } from './lib/context.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DBProvider>
      <App />
    </DBProvider>
  </StrictMode>,
);
