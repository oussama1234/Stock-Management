// AuthContext.jsx
// This file sets up the authentication context for the React application
// It provides authentication state and functions to its children components
// using React's Context API and hooks
// It also handles side effects like fetching user data and managing loading states

import React, { createContext, useState, useEffect, useContext } from 'react';
import { login, logout, GetUser } from '../api/AuthFunctions';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //login function to handle login system

    const handleLogin = async(email, password) => {
        setLoading(true);
        setError(null);
        try {
            const userData = await login(email, password);
            setUser(userData.user);
            console.log("userData:", userData);
            return userData
            return userData;
        } catch (error) {
            setError(error);
            console.log("Login error:", error);
        }
        finally {
            setLoading(false);
        }
    };

    // logout the user function
    const logoutUser = async() => {
        setLoading(true);
        setError(null);
        try {
            await logout();
            setUser(null);
        } catch (error) {
            setError(error);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                
                const userData = await GetUser();
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
        <AuthContext.Provider value={{ user, loading, error, handleLogin, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
   
};

// ✅ Custom hook for cleaner usage
export const useAuth = () => useContext(AuthContext);
