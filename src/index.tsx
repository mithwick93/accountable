import React from 'react';
import ReactDOM from 'react-dom/client';
import PWAPrompt from 'react-ios-pwa-prompt';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

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
    <PWAPrompt promptOnVisit={1} timesToShow={3} />
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register({
  onUpdate: (registration?: ServiceWorkerRegistration) => {
    if (registration?.waiting) {
      const shouldReload = window.confirm(
        'A new version is available. Reload now?',
      );
      if (shouldReload) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        registration.waiting.addEventListener('statechange', (event: Event) => {
          const sw = event.target as ServiceWorker;
          if (sw.state === 'activated') {
            window.location.reload();
          }
        });
      }
    }
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
