// Notifications.js - Clean API service for notification operations
// Handles all notification-related API calls with proper error handling and caching

import { AxiosClient } from "./AxiosClient";

/**
 * Get user notifications with pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.per_page - Items per page (default: 15)
 * @returns {Promise<Object>} API response with notifications data and metadata
 */
export const getNotifications = async (params = {}) => {
  try {
    const { page = 1, per_page = 15 } = params;
    const response = await AxiosClient.get('/notifications', {
      params: { page, per_page }
    });
    
    return {
      success: true,
      data: response.data.data,
      meta: response.data.meta,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch notifications',
      status: error.response?.status || 500,
      data: null,
      meta: null
    };
  }
};

/**
 * Get unread notifications count
 * 
 * @returns {Promise<Object>} API response with unread count
 */
export const getUnreadCount = async () => {
  try {
    console.log('🌐 API: Getting unread count');
    const response = await AxiosClient.get('/notifications/unread-count');
    console.log('🌐 API: Unread count response', response);
    
    return {
      success: true,
      count: response.data.count,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch unread count',
      status: error.response?.status || 500,
      count: 0
    };
  }
};

/**
 * Get low stock notifications
 * 
 * @param {number} limit - Maximum number of notifications to fetch (default: 10)
 * @returns {Promise<Object>} API response with low stock notifications
 */
export const getLowStockNotifications = async (limit = 10) => {
  try {
    const response = await AxiosClient.get('/notifications/low-stock', {
      params: { limit }
    });
    
    return {
      success: true,
      data: response.data.data,
      count: response.data.count,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch low stock notifications',
      status: error.response?.status || 500,
      data: [],
      count: 0
    };
  }
};

/**
 * Get a specific notification by ID
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} API response with notification data
 */
export const getNotification = async (id) => {
  try {
    const response = await AxiosClient.get(`/notifications/${id}`);
    
    return {
      success: true,
      data: response.data.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch notification',
      status: error.response?.status || 500,
      data: null
    };
  }
};

/**
 * Mark a notification as read
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} API response
 */
export const markAsRead = async (id) => {
  try {
    const response = await AxiosClient.patch(`/notifications/${id}/read`);
    
    return {
      success: true,
      message: response.data.message || 'Notification marked as read',
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to mark notification as read',
      status: error.response?.status || 500
    };
  }
};

/**
 * Mark all notifications as read
 * 
 * @returns {Promise<Object>} API response
 */
export const markAllAsRead = async () => {
  try {
    const response = await AxiosClient.patch('/notifications/mark-all-read');
    
    return {
      success: true,
      message: response.data.message || 'All notifications marked as read',
      count: response.data.count || 0,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to mark all notifications as read',
      status: error.response?.status || 500,
      count: 0
    };
  }
};

/**
 * Delete a notification
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} API response
 */
export const deleteNotification = async (id) => {
  try {
    const response = await AxiosClient.delete(`/notifications/${id}`);
    
    return {
      success: true,
      message: response.data.message || 'Notification deleted successfully',
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete notification',
      status: error.response?.status || 500
    };
  }
};

/**
 * Create a new notification (admin only)
 * 
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.type - Notification type
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {number} notificationData.user_id - Target user ID (optional)
 * @param {string} notificationData.priority - Priority level (optional)
 * @param {string} notificationData.category - Category (optional)
 * @param {Object} notificationData.data - Additional data (optional)
 * @returns {Promise<Object>} API response with created notification
 */
export const createNotification = async (notificationData) => {
  try {
    const response = await AxiosClient.post('/notifications', notificationData);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'Notification created successfully',
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create notification',
      status: error.response?.status || 500,
      data: null,
      errors: error.response?.data?.errors || null
    };
  }
};

/**
 * Get notification statistics (admin only)
 * 
 * @returns {Promise<Object>} API response with notification statistics
 */
export const getNotificationStats = async () => {
  try {
    const response = await AxiosClient.get('/notifications/stats');
    
    return {
      success: true,
      data: response.data.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch notification statistics',
      status: error.response?.status || 500,
      data: null
    };
  }
};

/**
 * Notification types constants for frontend use
 */
export const NotificationTypes = {
  LOW_STOCK: 'low_stock',
  SALE_CREATED: 'sale_created',
  PURCHASE_CREATED: 'purchase_created',
  STOCK_UPDATED: 'stock_updated'
};

/**
 * Notification priorities constants
 */
export const NotificationPriorities = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Notification categories constants
 */
export const NotificationCategories = {
  GENERAL: 'general',
  INVENTORY: 'inventory',
  SALES: 'sales',
  PURCHASES: 'purchases',
  SYSTEM: 'system'
};

/**
 * Helper function to get notification icon based on type
 * 
 * @param {string} type - Notification type
 * @returns {string} Icon class name or emoji
 */
export const getNotificationIcon = (type) => {
  const iconMap = {
    [NotificationTypes.LOW_STOCK]: '📦',
    [NotificationTypes.SALE_CREATED]: '💰',
    [NotificationTypes.PURCHASE_CREATED]: '🛒',
    [NotificationTypes.STOCK_UPDATED]: '📈'
  };
  
  return iconMap[type] || '📢';
};

/**
 * Helper function to get notification color based on priority
 * 
 * @param {string} priority - Notification priority
 * @returns {string} Color class names
 */
export const getNotificationColor = (priority) => {
  const colorMap = {
    [NotificationPriorities.LOW]: 'text-gray-600 bg-gray-50 border-gray-200',
    [NotificationPriorities.MEDIUM]: 'text-blue-600 bg-blue-50 border-blue-200',
    [NotificationPriorities.HIGH]: 'text-orange-600 bg-orange-50 border-orange-200',
    [NotificationPriorities.URGENT]: 'text-red-600 bg-red-50 border-red-200'
  };
  
  return colorMap[priority] || colorMap[NotificationPriorities.MEDIUM];
};