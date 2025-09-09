// protecting dashboard and login routes so that it redirects either by a logged user or non-logged user
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/Spinners/LoadingSpinner';
import { HomeRoute } from '@/router/Index';
import { useAuth } from '../context/AuthContext';
import { DashboardRoute } from '../router/Index';
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Loading, Please wait..." />; // or a spinner
    }

    if (user) {
        // this navigate doesnt work and it returns a blank page

        if (window.location.pathname === HomeRoute || window.location.pathname === LoginRoute) {
            return <Navigate to={DashboardRoute} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
