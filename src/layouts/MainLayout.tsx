import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { IconButton, Tooltip } from '@mui/material';
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
import { DialogsProvider, useDialogs } from '@toolpad/core/useDialogs';
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import CurrencyRatesDialog from '../components/CurrencyRatesDialog';
import ErrorBoundary from '../components/ErrorBoundary';
import ToolbarActions from '../components/toolbar/ToolbarActions';
import CreateTransactionDialog from '../components/transaction/CreateTransactionDialog';
import { CurrencyRatesProvider } from '../context/CurrencyRatesContext';
import { DataProvider } from '../context/DataContext';
import { SettingsProvider } from '../context/SettingsContext';
import { StaticDataProvider } from '../context/StaticDataContext';
import { UserProvider } from '../context/UserContext';
import { defaultUserSettings } from '../utils/settings';
import { TokenStorage } from '../utils/TokenStorage';

const SidebarFooter = ({ mini }: SidebarFooterProps) => (
  <Typography
    variant="caption"
    sx={{ m: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
  >
    {mini ? '© MUI' : `© ${new Date().getFullYear()} Made with love by MUI`}
  </Typography>
);

const CustomPageToolbar = () => {
  const dialogs = useDialogs();
  return (
    <PageHeaderToolbar>
      <Tooltip title="Exchange Rates">
        <IconButton
          onClick={async () => {
            await dialogs.open(CurrencyRatesDialog);
          }}
          color="primary"
        >
          <CurrencyExchangeIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Create Transaction">
        <IconButton
          onClick={async () => {
            await dialogs.open(CreateTransactionDialog);
          }}
          color="primary"
        >
          <PostAddIcon />
        </IconButton>
      </Tooltip>
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
      <SettingsProvider
        settingsKey="accountable"
        defaultValue={defaultUserSettings}
      >
        <StaticDataProvider>
          <DataProvider>
            <CurrencyRatesProvider>
              <DashboardLayout
                slots={{
                  toolbarActions: ToolbarActions,
                  sidebarFooter: SidebarFooter,
                }}
                defaultSidebarCollapsed
              >
                <ErrorBoundary>
                  <DialogsProvider>
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
                  </DialogsProvider>
                </ErrorBoundary>
              </DashboardLayout>
            </CurrencyRatesProvider>
          </DataProvider>
        </StaticDataProvider>
      </SettingsProvider>
    </UserProvider>
  );
}
