import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import { IconButton } from '@mui/material';
import Typography from '@mui/material/Typography';
import {
  DashboardLayout,
  type SidebarFooterProps,
} from '@toolpad/core/DashboardLayout';
import {
  PageContainer,
  PageHeader,
  PageHeaderToolbar,
} from '@toolpad/core/PageContainer';
import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import CurrencyRatesDialog from '../components/CurrencyRatesDialog';
import ErrorBoundary from '../components/ErrorBoundary';
import ToolbarActions from '../components/toolbar/ToolbarActions';
import { CurrencyRatesProvider } from '../context/CurrencyRatesContext';
import { SettingsProvider } from '../context/SettingsContext';
import { StaticDataProvider } from '../context/StaticDataContext';
import { UserProvider } from '../context/UserContext';
import { TokenStorage } from '../utils/TokenStorage';

const userSettings = {
  currency: 'SEK',
};

const SidebarFooter = ({ mini }: SidebarFooterProps) => (
  <Typography
    variant="caption"
    sx={{ m: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
  >
    {mini ? '© MUI' : `© ${new Date().getFullYear()} Made with love by MUI`}
  </Typography>
);

const CustomPageToolbar = () => {
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <PageHeaderToolbar>
      <IconButton onClick={handleClickOpen} color="primary">
        <CurrencyExchangeIcon />
      </IconButton>
      <CurrencyRatesDialog open={open} onClose={handleClose} />
    </PageHeaderToolbar>
  );
};

const CustomPageHeader = () => (
  <PageHeader slots={{ toolbar: CustomPageToolbar }} />
);

export default function MainLayout() {
  const isAuthenticated = !!TokenStorage.getAccessToken();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return (
    <UserProvider>
      <StaticDataProvider>
        <SettingsProvider settingsKey="accountable" defaultValue={userSettings}>
          <CurrencyRatesProvider>
            <DashboardLayout
              slots={{
                toolbarActions: ToolbarActions,
                sidebarFooter: SidebarFooter,
              }}
              defaultSidebarCollapsed
            >
              <ErrorBoundary>
                <PageContainer
                  slots={{ header: CustomPageHeader }}
                  sx={{
                    '@media (min-width: 1200px)': {
                      maxWidth: '2400px',
                    },
                  }}
                >
                  <Outlet />
                </PageContainer>
              </ErrorBoundary>
            </DashboardLayout>
          </CurrencyRatesProvider>
        </SettingsProvider>
      </StaticDataProvider>
    </UserProvider>
  );
}
