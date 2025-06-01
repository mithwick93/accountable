import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BlurLinearIcon from '@mui/icons-material/BlurLinear';
import CardTravelIcon from '@mui/icons-material/CardTravel';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { Navigation } from '@toolpad/core';
import { AppProvider } from '@toolpad/core/react-router-dom';
import React from 'react';
import { Outlet } from 'react-router-dom';
import logoLight from './assets/logo-light.svg';
import { theme } from './theme/theme';

const NAVIGATION: Navigation = [
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    kind: 'header',
    title: 'Accounts',
  },
  {
    segment: 'assets',
    title: 'Assets',
    icon: <AccountBalanceIcon />,
  },
  {
    segment: 'liabilities',
    title: 'Liabilities',
    icon: <CardTravelIcon />,
  },
  {
    segment: 'installment-plans',
    title: 'Installment Plans',
    icon: <ScheduleIcon />,
  },
  {
    segment: 'payment-systems',
    title: 'Payment Systems',
    icon: <PaymentsIcon />,
  },
  {
    kind: 'header',
    title: 'Transactions',
  },
  {
    segment: 'transaction-categories',
    title: 'Categories',
    icon: <CategoryIcon />,
  },
  {
    segment: 'transaction-templates',
    title: 'Templates',
    icon: <BlurLinearIcon />,
  },
  {
    segment: 'transactions',
    title: 'Transactions',
    icon: <ReceiptIcon />,
  },
];

const BRANDING = {
  logo: <img src={logoLight} className="App-logo" alt="logo" />,
  title: 'AccountAble',
  homeUrl: '/',
};

const App = () => (
  <AppProvider navigation={NAVIGATION} branding={BRANDING} theme={theme}>
    <Outlet />
  </AppProvider>
);
export default App;
