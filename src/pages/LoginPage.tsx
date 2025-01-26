import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Login from '../features/auth/components/Login';

const LoginPage = () => (
  <ErrorBoundary resetKey="login">
    <Login />
  </ErrorBoundary>
);

export default LoginPage;
