import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import MainLayout from './layouts/MainLayout';
import AssetsPage from './pages/AssetsPage';
import DashboardPage from './pages/DashboardPage';
import LiabilitiesPage from './pages/LiabilitiesPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import reportWebVitals from './reportWebVitals';
import './index.css';

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: MainLayout,
        children: [
          {
            path: '/',
            Component: DashboardPage,
          },
          {
            path: '/assets',
            Component: AssetsPage,
          },
          {
            path: '/liabilities',
            Component: LiabilitiesPage,
          },
        ],
      },
      {
        path: '/login',
        Component: LoginPage,
      },
      {
        path: '*',
        Component: NotFoundPage,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
