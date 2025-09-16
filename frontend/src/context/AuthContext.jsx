// AuthContext.jsx
// This file sets up the authentication context for the React application
// It provides authentication state and functions to its children components
// using React's Context API and hooks
// It also handles side effects like fetching user data and managing loading states

import { createContext, useContext, useEffect, useState } from "react";
import {
  GetUser,
  login,
  logout,
  PostUpdateProfile,
} from "../api/AuthFunctions";
import { useToast } from "../components/Toaster/ToastContext";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const Toast = useToast();

  //login function to handle login system

  const handleLogin = async (email, password) => {
    Toast.info("Logging you in, Please wait...");
    setError(null);
    try {
      const userData = await login(email, password);

      setUser(userData.user);
      console.log("userData:", userData);
      Toast.success("Logged in successfully");
      return { success: true, data: userData };
    } catch (error) {
      console.log("Login error:", error);

      // If Laravel sends error response
      const message =
        error.response?.data?.message || error.message || "Login failed";

      Toast.error(message);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // logout the user function
  const logoutUser = async () => {
    Toast.info("Logging you out, Please Wait...");
    setLoading(true);
    setError(null);
    try {
      await logout();
      Toast.success("Logged out successfully");
      setUser(null);
    } catch (error) {
      setError(error);
      Toast.info(error || "Something unexpected happened.");
    } finally {
      setLoading(false);
    }
  };

  // AuthContext / Component
  const updateProfile = async (userData, file) => {
    setError(null);
    Toast.info("Updating Profile Data, please wait...");

    const result = await PostUpdateProfile(userData, file);

    if (result.success) {
      Toast.success(result.message);
      if (result.data?.user) {
        setUser(result.data.user);
      }
    } else {
      Toast.error(result.message);
      setError(result.message);
    }

    console.log("updateProfile result:", result);
    return result;
  };

  // first fetch the user to determine if the user is logged in or not to control the protected routing
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await GetUser();
        setUser(userData);
        console.log("Fetched user data:", userData);
      } catch (error) {
        setError(
          error.response?.data?.message || "Failed to Load initial data"
        );
      } finally {
        setLoading(false);
        setError(null);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        handleLogin,
        logoutUser,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for cleaner usage
export const useAuth = () => useContext(AuthContext);
