// src/api/Preferences.js
// User preferences API functions with caching support

import { AxiosClient } from "./AxiosClient";

/**
 * Get current user's preferences
 * @returns {Promise<Object>} User preferences object
 */
export const getUserPreferences = async () => {
  const response = await AxiosClient.get("/preferences");
  return response.data;
};

/**
 * Update user preferences
 * @param {Object} preferences - Preferences object to update
 * @returns {Promise<Object>} Updated preferences
 */
export const updateUserPreferences = async (preferences) => {
  const response = await AxiosClient.put("/preferences", preferences);
  return response.data;
};

/**
 * Reset user preferences to defaults
 * @returns {Promise<Object>} Reset preferences
 */
export const resetUserPreferences = async () => {
  const response = await AxiosClient.post("/preferences/reset");
  return response.data;
};

/**
 * Get all users' preferences (admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Paginated preferences list
 */
export const getAllPreferences = async (params = {}) => {
  const response = await AxiosClient.get("/preferences/all", { params });
  return response.data;
};

/**
 * Get theme statistics (admin only)
 * @returns {Promise<Object>} Theme usage statistics
 */
export const getThemeStats = async () => {
  const response = await AxiosClient.get("/preferences/theme-stats");
  return response.data;
};
