import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '@/components/Spinners/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { DashboardRoute, HomeRoute, LoginRoute } from '../router/Index';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading, Please wait..." />;
  }

  // If user is not logged in and trying to access a protected route
  if (!user && location.pathname !== LoginRoute) {
    return <Navigate to={LoginRoute} replace state={{ from: location }} />;
  }

  // If user is logged in and trying to access the login page
  if (user && (location.pathname === LoginRoute || location.pathname === HomeRoute)) {
    return <Navigate to={DashboardRoute} replace />;
  }

  // Otherwise render the page
  return children;
};

export default ProtectedRoute;
