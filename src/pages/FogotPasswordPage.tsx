import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import ForgotPassword from '../features/auth/components/ForgotPassword';

const ForgotPasswordPage = () => (
  <ErrorBoundary resetKey="forgot-password">
    <ForgotPassword />
  </ErrorBoundary>
);

export default ForgotPasswordPage;
