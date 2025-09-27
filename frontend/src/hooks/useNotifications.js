// useNotifications.js - Custom hook for notification state management
// Clean separation of concerns with date-fns integration for "time ago" functionality

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  getLowStockNotifications
} from '@/api/Notifications';

/**
 * Custom hook for managing user notifications
 * 
 * @param {Object} options - Hook configuration options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.perPage - Items per page (default: 15)
 * @param {boolean} options.autoRefresh - Auto-refresh notifications (default: false)
 * @param {number} options.refreshInterval - Refresh interval in milliseconds (default: 30000)
 * @returns {Object} Notification state and actions
 */
export const useNotifications = (options = {}) => {
  const {
    initialPage = 1,
    perPage = 15,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  // State management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Format notification timestamp to "time ago" format
   * 
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time ago string
   */
  const formatTimeAgo = useCallback((timestamp) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  }, []);

  /**
   * Fetch notifications with pagination
   * 
   * @param {number} page - Page number to fetch
   */
  const fetchNotifications = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getNotifications({ page, per_page: perPage });
      
      if (result.success) {
        // Add formatted timeAgo to each notification
        const notificationsWithTimeAgo = result.data.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }));

        setNotifications(notificationsWithTimeAgo);
        setCurrentPage(result.meta.current_page);
        setTotalPages(result.meta.last_page);
        setTotal(result.meta.total);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, formatTimeAgo]);

  /**
   * Fetch unread notifications count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (err) {
      // Silently fail for unread count to avoid disrupting UX
    }
  }, []);

  /**
   * Mark a notification as read
   * 
   * @param {number} id - Notification ID
   */
  const markNotificationAsRead = useCallback(async (id) => {
    try {
      const result = await markAsRead(id);
      
      if (result.success) {
        // Update local state immediately for better UX
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return result;
    } catch (err) {
      return { success: false, message: 'Failed to mark notification as read' };
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const result = await markAllAsRead();
      
      if (result.success) {
        // Update local state immediately
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString()
          }))
        );
        
        setUnreadCount(0);
      }
      
      return result;
    } catch (err) {
      return { success: false, message: 'Failed to mark all notifications as read' };
    }
  }, []);

  /**
   * Delete a notification
   * 
   * @param {number} id - Notification ID
   */
  const deleteNotificationById = useCallback(async (id) => {
    try {
      const result = await deleteNotification(id);
      
      if (result.success) {
        // Remove from local state immediately
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== id)
        );
        
        // Update counts
        setTotal(prevTotal => prevTotal - 1);
        
        // Refetch if needed to maintain page consistency
        if (notifications.length === 1 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
          fetchNotifications(currentPage - 1);
        }
      }
      
      return result;
    } catch (err) {
      return { success: false, message: 'Failed to delete notification' };
    }
  }, [notifications.length, currentPage, fetchNotifications]);

  /**
   * Refresh notifications and update timeAgo values
   */
  const refreshNotifications = useCallback(() => {
    fetchNotifications(currentPage);
    fetchUnreadCount();
  }, [currentPage, fetchNotifications, fetchUnreadCount]);

  /**
   * Go to next page
   */
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [currentPage, totalPages, fetchNotifications]);

  /**
   * Go to previous page
   */
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchNotifications(prevPage);
    }
  }, [currentPage, fetchNotifications]);

  /**
   * Go to specific page
   * 
   * @param {number} page - Page number
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      fetchNotifications(page);
    }
  }, [totalPages, currentPage, fetchNotifications]);

  // Initial data fetch
  useEffect(() => {
    fetchNotifications(initialPage);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, initialPage]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshNotifications();
      
      // Update timeAgo values for existing notifications
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }))
      );
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshNotifications, formatTimeAgo]);

  // Memoized derived state
  const hasNotifications = useMemo(() => notifications.length > 0, [notifications.length]);
  const hasUnreadNotifications = useMemo(() => unreadCount > 0, [unreadCount]);
  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.is_read), [notifications]
  );

  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    total,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startItem: ((currentPage - 1) * perPage) + 1,
    endItem: Math.min(currentPage * perPage, total)
  }), [currentPage, totalPages, total, perPage]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Derived state
    hasNotifications,
    hasUnreadNotifications,
    unreadNotifications,
    paginationInfo,
    
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    refreshNotifications,
    
    // Pagination actions
    goToNextPage,
    goToPreviousPage,
    goToPage,
    
    // Utilities
    formatTimeAgo
  };
};

/**
 * Custom hook for managing low stock notifications
 * 
 * @param {number} limit - Maximum number of notifications to fetch
 * @returns {Object} Low stock notifications state and actions
 */
export const useLowStockNotifications = (limit = 10) => {
  const [lowStockNotifications, setLowStockNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatTimeAgo = useCallback((timestamp) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  }, []);

  const fetchLowStockNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getLowStockNotifications(limit);
      
      if (result.success) {
        // Add formatted timeAgo to each notification
        const notificationsWithTimeAgo = result.data.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }));

        setLowStockNotifications(notificationsWithTimeAgo);
      } else {
        setError(result.message);
        setLowStockNotifications([]);
      }
    } catch (err) {
      setError('Failed to fetch low stock notifications');
      setLowStockNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [limit, formatTimeAgo]);

  // Initial fetch
  useEffect(() => {
    fetchLowStockNotifications();
  }, [fetchLowStockNotifications]);

  const hasLowStockAlerts = useMemo(() => 
    lowStockNotifications.length > 0, [lowStockNotifications.length]
  );

  return {
    lowStockNotifications,
    loading,
    error,
    hasLowStockAlerts,
    fetchLowStockNotifications,
    formatTimeAgo
  };
};
