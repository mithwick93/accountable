import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { TokenStorage } from '../utils/TokenStorage';

export default function MainLayout() {
  const isAuthenticated = !!TokenStorage.getAccessToken();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
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
  );
}
