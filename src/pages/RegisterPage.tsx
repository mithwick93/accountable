import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Register from '../features/auth/components/Register';

const RegisterPage = () => (
  <ErrorBoundary resetKey="register">
    <Register />
  </ErrorBoundary>
);

export default RegisterPage;
