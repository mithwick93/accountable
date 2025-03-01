import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import InstallmentPlans from '../features/installmentPlans/components/InstallmentPlans';

const InstallmentPlansPage: React.FC = () => (
  <ErrorBoundary resetKey="installmentPlans">
    <InstallmentPlans />
  </ErrorBoundary>
);

export default InstallmentPlansPage;
