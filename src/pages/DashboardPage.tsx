import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Dashboard from '../features/dashboard/components/Dashboard';

const DashboardPage: React.FC = () => (
  <ErrorBoundary resetKey="dashboard">
    <Dashboard />
  </ErrorBoundary>
);

export default DashboardPage;
