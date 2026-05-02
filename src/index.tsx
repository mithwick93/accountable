import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import MainLayout from './layouts/MainLayout';
import AssetsPage from './pages/AssetsPage';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/FogotPasswordPage';
import InstallmentPlansPage from './pages/InstallmentPlansPage';
import LiabilitiesPage from './pages/LiabilitiesPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PaymentSystemsPage from './pages/PaymentSystemsPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SharedTransactionsPage from './pages/SharedTransactionsPage';
import TransactionAnalyticsPage from './pages/TransactionAnalyticsPage';
import TransactionCategoriesPage from './pages/TransactionCategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionTemplatesPage from './pages/TransactionTemplatesPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
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
          {
            path: '/installment-plans',
            Component: InstallmentPlansPage,
          },
          {
            path: '/payment-systems',
            Component: PaymentSystemsPage,
          },
          {
            path: '/transaction-categories',
            Component: TransactionCategoriesPage,
          },
          {
            path: '/transaction-templates',
            Component: TransactionTemplatesPage,
          },
          {
            path: '/transactions',
            Component: TransactionsPage,
          },
          {
            path: '/shared-transactions',
            Component: SharedTransactionsPage,
          },
          {
            path: '/transaction-analytics',
            Component: TransactionAnalyticsPage,
          },
        ],
      },
      {
        path: '/login',
        Component: LoginPage,
      },
      {
        path: '/register',
        Component: RegisterPage,
      },
      {
        path: '/verify-email',
        Component: VerifyEmailPage,
      },
      {
        path: '/forgot-password',
        Component: ForgotPasswordPage,
      },
      {
        path: '/reset-password',
        Component: ResetPasswordPage,
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
    <ToastContainer
      position="bottom-right"
      autoClose={3000}
      newestOnTop
      closeOnClick
      theme="colored"
      transition={Slide}
    />
  </React.StrictMode>,
);

registerSW({
  onNeedRefresh() {
    if (confirm('New version available. Reload?')) {
      location.reload();
    }
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
