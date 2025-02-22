import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import TransactionTemplates from '../features/transactions/components/TransactionTemplates';

const TransactionTemplatesPage = () => (
  <ErrorBoundary resetKey="transactionTemplates">
    <TransactionTemplates />
  </ErrorBoundary>
);

export default TransactionTemplatesPage;
