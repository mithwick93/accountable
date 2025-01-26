import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import TransactionCategories from '../features/transactions/components/TransactionCategories';

const TransactionCategoriesPage = () => (
  <ErrorBoundary resetKey="transactionCategories">
    <TransactionCategories />
  </ErrorBoundary>
);

export default TransactionCategoriesPage;
