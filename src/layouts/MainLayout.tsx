import Typography from '@mui/material/Typography';
import {
  DashboardLayout,
  type SidebarFooterProps,
} from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import ToolbarActions from '../components/toolbar/ToolbarActions';
import { SettingsProvider } from '../context/SettingsContext';
import { StaticDataProvider } from '../context/StaticDataContext';
import { UserProvider } from '../context/UserContext';
import { TokenStorage } from '../utils/TokenStorage';

const SidebarFooter = ({ mini }: SidebarFooterProps) => (
  <Typography
    variant="caption"
    sx={{ m: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
  >
    {mini ? '© MUI' : `© ${new Date().getFullYear()} Made with love by MUI`}
  </Typography>
);

const userSettings = {
  currency: 'SEK',
};

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
          <DashboardLayout
            slots={{
              toolbarActions: ToolbarActions,
              sidebarFooter: SidebarFooter,
            }}
            defaultSidebarCollapsed
          >
            <PageContainer
              sx={{
                '@media (min-width: 1200px)': {
                  maxWidth: 'none',
                },
              }}
            >
              <Outlet />
            </PageContainer>
          </DashboardLayout>
        </SettingsProvider>
      </StaticDataProvider>
    </UserProvider>
  );
}
