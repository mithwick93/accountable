import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Assets from '../features/assets/components/Assets';

const AssetsPage: React.FC = () => (
  <ErrorBoundary resetKey="assets">
    <Assets />
  </ErrorBoundary>
);

export default AssetsPage;
