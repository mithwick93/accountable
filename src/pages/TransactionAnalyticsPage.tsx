import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import TransactionAnalytics from '../features/transactionAnalytics/components/TransactionAnalytics';

const TransactionAnalyticsPage = () => (
  <ErrorBoundary resetKey="transactionAnalytics">
    <TransactionAnalytics />
  </ErrorBoundary>
);

export default TransactionAnalyticsPage;
