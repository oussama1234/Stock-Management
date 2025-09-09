// protecting dashboard and login routes so that it redirects either by a logged user or non-logged user
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/Spinners/LoadingSpinner';
import { HomeRoute } from '@/router/Index';
import { useAuth } from '../context/AuthContext';
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Loading, Please wait..." />; // or a spinner
    }

    if (!user) {
        return <Navigate to={"/"} />;
    }

    return children;
};

export default ProtectedRoute;
