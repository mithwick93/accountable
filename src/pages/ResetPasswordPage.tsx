import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import ResetPassword from '../features/auth/components/ResetPassword';

const ResetPasswordPage = () => (
  <ErrorBoundary resetKey="reset-password">
    <ResetPassword />
  </ErrorBoundary>
);

export default ResetPasswordPage;
