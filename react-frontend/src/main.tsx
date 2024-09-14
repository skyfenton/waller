import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import { Toaster } from '@/components/ui/sonner';

import App from './app';

if (!import.meta.env.VITE_SERVER_URL) {
  throw new Error('VITE_SERVER_URL is not set');
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
