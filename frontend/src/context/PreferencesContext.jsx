// PreferencesContext.jsx
// Global preferences management for theme colors, dark mode, and user settings

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserPreferences, updateUserPreferences } from '../api/Preferences';
import { useAuth } from './AuthContext';

const PreferencesContext = createContext();

// Theme color configurations
export const themeColors = {
  blue: {
    primary: 'from-blue-500 to-indigo-600',
    secondary: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
    accent: 'bg-blue-500',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    light: 'bg-blue-100',
    ring: 'ring-blue-500',
    focus: 'focus:ring-blue-500',
  },
  green: {
    primary: 'from-green-500 to-emerald-600',
    secondary: 'from-green-400 to-emerald-500',
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
    accent: 'bg-green-500',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
    light: 'bg-green-100',
    ring: 'ring-green-500',
    focus: 'focus:ring-green-500',
  },
  purple: {
    primary: 'from-purple-500 to-violet-600',
    secondary: 'from-purple-400 to-violet-500',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
    accent: 'bg-purple-500',
    gradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
    light: 'bg-purple-100',
    ring: 'ring-purple-500',
    focus: 'focus:ring-purple-500',
  },
  red: {
    primary: 'from-red-500 to-rose-600',
    secondary: 'from-red-400 to-rose-500',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    hover: 'hover:bg-red-100',
    accent: 'bg-red-500',
    gradient: 'bg-gradient-to-r from-red-500 to-rose-600',
    light: 'bg-red-100',
    ring: 'ring-red-500',
    focus: 'focus:ring-red-500',
  },
  orange: {
    primary: 'from-orange-500 to-amber-600',
    secondary: 'from-orange-400 to-amber-500',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100',
    accent: 'bg-orange-500',
    gradient: 'bg-gradient-to-r from-orange-500 to-amber-600',
    light: 'bg-orange-100',
    ring: 'ring-orange-500',
    focus: 'focus:ring-orange-500',
  },
  pink: {
    primary: 'from-pink-500 to-rose-600',
    secondary: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-200',
    hover: 'hover:bg-pink-100',
    accent: 'bg-pink-500',
    gradient: 'bg-gradient-to-r from-pink-500 to-rose-600',
    light: 'bg-pink-100',
    ring: 'ring-pink-500',
    focus: 'focus:ring-pink-500',
  },
};

const defaultPreferences = {
  dark_mode: false,
  theme_color: 'blue',
  notifications_enabled: true,
  email_notifications: true,
  push_notifications: true,
  low_stock_alerts: true,
  sales_notifications: true,
  purchase_notifications: true,
  default_date_range: '30',
  items_per_page: 20,
  language: 'en',
  timezone: 'UTC',
  currency: 'USD',
  profile_public: false,
  show_online_status: true,
};

export const PreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(themeColors.blue);

  // Apply dark mode to document
  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Store in localStorage for immediate access
    localStorage.setItem('dark_mode', isDark.toString());
  };

  // Update theme colors
  const updateTheme = (colorName) => {
    const theme = themeColors[colorName] || themeColors.blue;
    setCurrentTheme(theme);
    
    // Store theme in localStorage for immediate access
    localStorage.setItem('theme_color', colorName);
    
    // Apply CSS custom properties for dynamic theming
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.accent);
    root.style.setProperty('--theme-gradient', theme.gradient);
    root.style.setProperty('--theme-light', theme.light);
    root.style.setProperty('--theme-text', theme.text);
  };

  // Load preferences from backend
  const loadPreferences = async () => {
    if (!user) {
      // User not authenticated, use defaults and localStorage
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await getUserPreferences();
      
      if (response.preferences) {
        const userPrefs = { ...defaultPreferences, ...response.preferences };
        setPreferences(userPrefs);
        
        // Apply dark mode immediately
        applyDarkMode(userPrefs.dark_mode);
        
        // Apply theme colors immediately
        updateTheme(userPrefs.theme_color);
      }
    } catch (error) {
      // If loading fails, fall back to localStorage and defaults
      applyDarkMode(defaultPreferences.dark_mode);
      updateTheme(defaultPreferences.theme_color);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences to backend
  const savePreferences = async (newPreferences) => {
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      
      // Update local state immediately for instant feedback
      setPreferences(updatedPrefs);
      
      // Apply changes immediately
      if ('dark_mode' in newPreferences) {
        applyDarkMode(newPreferences.dark_mode);
      }
      
      if ('theme_color' in newPreferences) {
        updateTheme(newPreferences.theme_color);
      }
      
      // Save to backend
      const response = await updateUserPreferences(updatedPrefs);
      
      return { success: true, preferences: updatedPrefs };
    } catch (error) {
      // Revert local state if save fails
      setPreferences(preferences);
      return { success: false, error: error.message };
    }
  };

  // Toggle dark mode
  const toggleDarkMode = async () => {
    const newDarkMode = !preferences.dark_mode;
    
    // Apply immediately for instant feedback
    applyDarkMode(newDarkMode);
    setPreferences(prev => ({ ...prev, dark_mode: newDarkMode }));
    
    try {
      // Try to save to backend
      const response = await updateUserPreferences({ ...preferences, dark_mode: newDarkMode });
      return { success: true, preferences: { ...preferences, dark_mode: newDarkMode } };
    } catch (error) {
      // Keep the UI change even if backend save fails
      return { success: true, preferences: { ...preferences, dark_mode: newDarkMode }, warning: 'UI updated but failed to save to server' };
    }
  };

  // Update theme color
  const changeThemeColor = async (colorName) => {
    return await savePreferences({ theme_color: colorName });
  };

  // Initialize preferences when user changes
  useEffect(() => {
    loadPreferences();
  }, [user]);

  // Also check localStorage on initial load for instant theme application
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_color');
    const savedDarkMode = localStorage.getItem('dark_mode');
    
    if (savedTheme && themeColors[savedTheme]) {
      updateTheme(savedTheme);
    }
    
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      applyDarkMode(isDark);
      // Update preferences state to match localStorage
      setPreferences(prev => ({ ...prev, dark_mode: isDark }));
    }
  }, []);

  const value = {
    preferences,
    setPreferences,
    currentTheme,
    themeColors,
    loading,
    savePreferences,
    toggleDarkMode,
    changeThemeColor,
    loadPreferences,
    applyDarkMode,
    updateTheme,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export default PreferencesContext;