import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/globals.css';
import { Toaster } from '@/components/ui/sonner';

import UploadPage from '@/pages/upload';
import ImagePage from '@/pages/edit';
import NotFoundPage from '@/pages/notfound.tsx';

if (!import.meta.env.VITE_SERVER_URL) {
  throw new Error('VITE_SERVER_URL is not set');
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <UploadPage />,
    errorElement: <NotFoundPage />
    // loader: rootLoader,
  },
  {
    path: '/edit/:imgId',
    element: <ImagePage />
  }
]);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>
);
