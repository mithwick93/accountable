import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import PaymentSystems from '../features/paymentSystems/components/PaymentSystems';

const PaymentSystemsPage = () => (
  <ErrorBoundary resetKey="paymentSystems">
    <PaymentSystems />
  </ErrorBoundary>
);

export default PaymentSystemsPage;
