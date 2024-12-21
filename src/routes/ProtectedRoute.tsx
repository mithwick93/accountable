import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserProvider } from '../context/UserContext';
import { TokenStorage } from '../utils/TokenStorage';

const ProtectedRoute = () => {
  const isAuthenticated = !!TokenStorage.getAccessToken();
  return isAuthenticated ? (
    <UserProvider>
      <Outlet />
    </UserProvider>
  ) : (
    <Navigate to="/login" />
  );
};

export default ProtectedRoute;
