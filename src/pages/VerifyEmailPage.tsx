import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import VerifyEmail from '../features/auth/components/VerifyEmail';

const VerifyEmailPage = () => (
  <ErrorBoundary resetKey="verifyEmail">
    <VerifyEmail />
  </ErrorBoundary>
);

export default VerifyEmailPage;
