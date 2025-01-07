import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import PostAddIcon from '@mui/icons-material/PostAdd';
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
import CreateTransactionDialog from '../components/transaction/CreateTransactionDialog';
import { CurrencyRatesProvider } from '../context/CurrencyRatesContext';
import { DataProvider } from '../context/DataContext';
import { SettingsProvider } from '../context/SettingsContext';
import { StaticDataProvider } from '../context/StaticDataContext';
import { UserProvider } from '../context/UserContext';
import { TokenStorage } from '../utils/TokenStorage';

const userSettings = {
  currency: 'SEK',
  transactions: {
    updateAccounts: false,
    search: {
      parameters: {
        userIds: null,
        dateFrom: null,
        dateTo: null,
        types: null,
        categoryIds: null,
        fromAssetIds: null,
        toAssetIds: null,
        fromPaymentSystemIds: null,
        toPaymentSystemIds: null,
        fromLiabilityIds: null,
        toLiabilityIds: null,
        hasPendingSettlements: null,
        hasSharedTransactions: null,
        pageIndex: 0,
        pageSize: 25,
        sorting: ['date,desc'],
      },
    },
  },
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
  const [openCurrencyDialog, setOpenCurrencyDialog] = useState(false);
  const [openCreateTransactionDialog, setOpenCreateTransactionDialog] =
    useState(false);

  const handleCurrencyDialogOpen = () => {
    setOpenCurrencyDialog(true);
  };

  const handleCurrencyDialogClose = () => {
    setOpenCurrencyDialog(false);
  };

  const handleCreateTransactionDialogOpen = () => {
    setOpenCreateTransactionDialog(true);
  };

  const handleCreateTransactionDialogClose = () => {
    setOpenCreateTransactionDialog(false);
  };

  return (
    <PageHeaderToolbar>
      <IconButton onClick={handleCurrencyDialogOpen} color="primary">
        <CurrencyExchangeIcon />
      </IconButton>
      <IconButton onClick={handleCreateTransactionDialogOpen} color="primary">
        <PostAddIcon />
      </IconButton>
      <CurrencyRatesDialog
        open={openCurrencyDialog}
        onClose={handleCurrencyDialogClose}
      />
      <CreateTransactionDialog
        open={openCreateTransactionDialog}
        onClose={handleCreateTransactionDialogClose}
      />
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
      <SettingsProvider settingsKey="accountable" defaultValue={userSettings}>
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
          </DataProvider>
        </StaticDataProvider>
      </SettingsProvider>
    </UserProvider>
  );
}
