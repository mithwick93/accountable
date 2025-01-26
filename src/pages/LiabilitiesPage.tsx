import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Liabilities from '../features/liabilities/components/Liabilities';

const LiabilitiesPage: React.FC = () => (
  <ErrorBoundary resetKey="liabilities">
    <Liabilities />
  </ErrorBoundary>
);

export default LiabilitiesPage;
