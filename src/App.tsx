import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DashboardIcon from '@mui/icons-material/Dashboard';
import type { Navigation } from '@toolpad/core';
import { AppProvider } from '@toolpad/core/react-router-dom';
import React from 'react';
import { Outlet } from 'react-router-dom';
import logoLight from './assets/logo-light.svg';
import { theme } from './theme/theme';

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'assets',
    title: 'Assets',
    icon: <AccountBalanceIcon />,
    pattern: 'assets{/:assetId}*',
  },
];

const BRANDING = {
  logo: <img src={logoLight} className="App-logo" alt="logo" />,
  title: 'Accountable',
  homeUrl: '/',
};

const App = () => (
  <AppProvider navigation={NAVIGATION} branding={BRANDING} theme={theme}>
    <Outlet />
  </AppProvider>
);
export default App;
