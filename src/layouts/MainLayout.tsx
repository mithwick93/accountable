import Typography from '@mui/material/Typography';
import {
  DashboardLayout,
  type SidebarFooterProps,
} from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import ToolbarActions from '../components/toolbar/ToolbarActions';
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

export default function MainLayout() {
  const isAuthenticated = !!TokenStorage.getAccessToken();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return (
    <UserProvider>
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
    </UserProvider>
  );
}
