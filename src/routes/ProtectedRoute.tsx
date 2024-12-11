import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { TokenStorage } from '../utils/TokenStorage';

const ProtectedRoute = () => {
  const isAuthenticated = !!TokenStorage.getAccessToken();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
