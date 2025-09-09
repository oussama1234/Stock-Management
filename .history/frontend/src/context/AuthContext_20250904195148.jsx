// AuthContext.jsx
// This file sets up the authentication context for the React application
// It provides authentication state and functions to its children components
// using React's Context API and hooks
// It also handles side effects like fetching user data and managing loading states

import React, { createContext, useState, useEffect, useContext } from 'react';
import { login, logout, GetUser } from '../api/AuthFunctions';
import { useToast } from '../components/Toaster/ToastContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const Toast = useToast();

    //login function to handle login system

    const handleLogin = async (email, password) => {

  setError(null);
  try {
    const userData = await login(email, password);
    Toast.success("Logged in Successfully")
    setUser(userData.user);
    console.log("userData:", userData);
    
    return { success: true, data: userData };
  } catch (error) {
    console.log("Login error:", error);

    // If Laravel sends error response
    const message =
      error.response?.data?.message || error.message || "Login failed";

    setError(message);
    return { success: false, error: message };
  } finally {
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
                console.log("Fetched user data:", userData);

            } catch (error) {
                setError(error.response?.data?.message || "Failed to Load initial data");
            }
            finally {
                setLoading(false);
                setError(null)
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
