// AuthContext.jsx
// This file sets up the authentication context for the React application
// It provides authentication state and functions to its children components
// using React's Context API and hooks
// It also handles side effects like fetching user data and managing loading states

import React, { createContext, useState, useEffect } from 'react';
import { getCsrfToken, login, logout, fetchUser } from '../api/AuthFunctions';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                await getCsrfToken();
                const userData = await fetchUser();
                setUser(userData);
            } catch (error) {
                setError(error);
            }
            finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);
        
    return (
        <AuthContext.Provider value={{ user, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
