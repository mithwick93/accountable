import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Transactions from '../features/transactions/components/Transactions';

const TransactionsPage = () => (
  <ErrorBoundary resetKey="transactions">
    <Transactions />
  </ErrorBoundary>
);

export default TransactionsPage;
