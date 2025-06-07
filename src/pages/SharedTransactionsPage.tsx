import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import SharedTransactions from '../features/sharedTransactions/components/SharedTransactions';

const SharedTransactionsPage = () => (
  <ErrorBoundary resetKey="transactions">
    <SharedTransactions />
  </ErrorBoundary>
);

export default SharedTransactionsPage;
