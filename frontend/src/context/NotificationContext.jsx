// NotificationContext.jsx - Centralized notification state management
// Provides shared notification state across all components (navbar, dropdown, etc.)

import { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  getLowStockNotifications
} from '@/api/Notifications';

// Create the context
const NotificationContext = createContext(null);

// Custom hook to use the notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

/**
 * NotificationProvider - Centralized notification state management
 * 
 * This provider maintains the global notification state and provides methods
 * to interact with notifications. All components using notifications should
 * consume this context to stay in sync.
 */
export const NotificationProvider = ({ children }) => {
  // Get auth state to only fetch notifications when user is logged in
  const { user, isAuthenticated } = useAuth();
  
  // Get user preferences for items per page
  let preferences = null;
  try {
    preferences = usePreferences();
  } catch (error) {
    // Preferences context not available, will use default
  }
  
  // Core state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lowStockNotifications, setLowStockNotifications] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Get per_page from user preferences (items_per_page from database) or use default of 10
  const getPerPage = useCallback(() => {
    // Force to 10 for now to test pagination
    const perPage = 10;
    
    console.log('🔔 NotificationContext: Using FORCED perPage', { 
      perPage,
      preferences: preferences?.preferences || preferences
    });
    return perPage;
  }, [preferences]);

  // Auto-refresh state
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  /**
   * Format notification timestamp to "time ago" format
   */
  const formatTimeAgo = useCallback((timestamp) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  }, []);

  /**
   * Fetch unread notifications count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      console.log('🔔 NotificationContext: fetchUnreadCount called');
      const result = await getUnreadCount();
      console.log('🔔 NotificationContext: unread count result', result);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (err) {
      // Silently fail for unread count to avoid disrupting UX
      console.warn('Failed to fetch unread count:', err);
    }
  }, []);

  /**
   * Fetch notifications with pagination
   */
  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    try {
      const currentPerPage = getPerPage();
      console.log('🔔 NotificationContext: fetchNotifications called', { page, currentPerPage, append, isAuthenticated, user: !!user });
      setLoading(true);
      setError(null);

      const result = await getNotifications({ page, per_page: currentPerPage });
      console.log('🔔 NotificationContext: API result', result);
      
      if (result.success) {
        // Add formatted timeAgo to each notification
        const notificationsWithTimeAgo = result.data.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }));

        if (append) {
          // Append to existing notifications for "load more"
          setNotifications(prev => [...prev, ...notificationsWithTimeAgo]);
        } else {
          // Replace notifications for initial load or refresh
          setNotifications(notificationsWithTimeAgo);
        }
        
        setCurrentPage(result.meta.current_page);
        setTotalPages(result.meta.last_page);
        setTotal(result.meta.total);
        
        console.log('🔔 NotificationContext: Updated pagination state', {
          currentPage: result.meta.current_page,
          totalPages: result.meta.last_page,
          total: result.meta.total,
          perPage: result.meta.per_page,
          hasMore: result.meta.current_page < result.meta.last_page,
          rawMeta: result.meta,
          notificationsReceived: result.data.length,
          fullApiResponse: result
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [getPerPage, formatTimeAgo]);

  /**
   * Fetch low stock notifications
   */
  const fetchLowStockNotifications = useCallback(async (limit = 10) => {
    try {
      const result = await getLowStockNotifications(limit);
      
      if (result.success) {
        const notificationsWithTimeAgo = result.data.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }));
        setLowStockNotifications(notificationsWithTimeAgo);
      }
    } catch (err) {
      console.warn('Failed to fetch low stock notifications:', err);
    }
  }, [formatTimeAgo]);

  /**
   * Mark a notification as read
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
        
        // Update unread count immediately
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));

        // Also update low stock notifications if applicable
        setLowStockNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error marking notification as read:', err);
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
        
        // Update low stock notifications
        setLowStockNotifications(prevNotifications => 
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
      console.error('Error marking all notifications as read:', err);
      return { success: false, message: 'Failed to mark all notifications as read' };
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotificationById = useCallback(async (id) => {
    try {
      const result = await deleteNotification(id);
      
      if (result.success) {
        // Find the notification to check if it was unread
        const notificationToDelete = notifications.find(n => n.id === id);
        const wasUnread = notificationToDelete && !notificationToDelete.is_read;

        // Remove from local state immediately
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== id)
        );
        
        setLowStockNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== id)
        );
        
        // Update counts
        setTotal(prevTotal => prevTotal - 1);
        
        // Update unread count if the deleted notification was unread
        if (wasUnread) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        
        // Refetch if needed to maintain page consistency
        if (notifications.length === 1 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
          // Will refetch when currentPage changes
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return { success: false, message: 'Failed to delete notification' };
    }
  }, [notifications, currentPage]);

  /**
   * Refresh all notification data
   */
  const refreshNotifications = useCallback(async () => {
    try {
      const currentPerPage = getPerPage();
      console.log('🔔 NotificationContext: refreshNotifications called');
      setLoading(true);
      setError(null);
      setCurrentPage(1); // Reset to first page

      // Fetch only regular notifications and unread count
      const [regularResult, unreadResult] = await Promise.all([
        getNotifications({ page: 1, per_page: currentPerPage }),
        getUnreadCount()
      ]);
      
      if (regularResult.success) {
        // Format regular notifications only
        const formattedNotifications = regularResult.data.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }));

        // Replace notifications for refresh
        setNotifications(formattedNotifications);
        
        // Set pagination info
        setCurrentPage(regularResult.meta.current_page);
        setTotalPages(regularResult.meta.last_page);
        setTotal(regularResult.meta.total);
        
        // Update unread count
        if (unreadResult.success) {
          setUnreadCount(unreadResult.count);
        }
        
        // Refresh low stock notifications separately
        getLowStockNotifications(20).then(lowStockResult => {
          if (lowStockResult.success) {
            const lowStockWithTimeAgo = lowStockResult.data.map(notification => ({
              ...notification,
              timeAgo: formatTimeAgo(notification.created_at)
            }));
            setLowStockNotifications(lowStockWithTimeAgo);
          }
        }).catch(err => {
          console.warn('Failed to refresh low stock notifications:', err);
        });
      } else {
        setError(regularResult.message);
      }
      
      setLastRefresh(Date.now());
    } catch (err) {
      setError('Failed to refresh notifications');
      console.error('Error refreshing notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [getPerPage, formatTimeAgo]);

  /**
   * Load more notifications (pagination)
   */
  const loadMoreNotifications = useCallback(async () => {
    if (currentPage < totalPages && !loading) {
      try {
        const nextPage = currentPage + 1;
        const currentPerPage = getPerPage();
        console.log('🔔 NotificationContext: loadMoreNotifications called', { 
          nextPage, 
          currentPage, 
          totalPages, 
          currentPerPage 
        });
        setLoading(true);

        // Fetch next page of notifications
        const regularResult = await getNotifications({ page: nextPage, per_page: currentPerPage });
        
        if (regularResult.success) {
          const notificationsWithTimeAgo = regularResult.data.map(notification => ({
            ...notification,
            timeAgo: formatTimeAgo(notification.created_at)
          }));

          // Replace notifications with next page data (not append)
          setNotifications(notificationsWithTimeAgo);
          setCurrentPage(regularResult.meta.current_page);
          setTotalPages(regularResult.meta.last_page);
          
          console.log('🔔 NotificationContext: loaded next page notifications', {
            newNotifications: notificationsWithTimeAgo.length,
            currentPage: regularResult.meta.current_page,
            totalPages: regularResult.meta.last_page
          });
        } else {
          console.error('Failed to load more notifications:', regularResult.message);
        }
      } catch (err) {
        console.error('Error loading more notifications:', err);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('🔔 NotificationContext: loadMore skipped', {
        currentPage,
        totalPages,
        hasMore: currentPage < totalPages,
        loading
      });
    }
  }, [currentPage, totalPages, loading, notifications.length, getPerPage, formatTimeAgo]);

  // Simple pagination helpers (basic functionality)
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      loadMoreNotifications();
    }
  }, [currentPage, totalPages, loadMoreNotifications]);

  const goToPreviousPage = useCallback(async () => {
    // Go to the actual previous page
    if (currentPage > 1 && !loading) {
      try {
        const previousPage = currentPage - 1;
        const currentPerPage = getPerPage();
        console.log('🔔 NotificationContext: goToPreviousPage called', { 
          previousPage, 
          currentPage, 
          totalPages, 
          currentPerPage 
        });
        setLoading(true);

        // Fetch previous page of notifications
        const regularResult = await getNotifications({ page: previousPage, per_page: currentPerPage });
        
        if (regularResult.success) {
          const notificationsWithTimeAgo = regularResult.data.map(notification => ({
            ...notification,
            timeAgo: formatTimeAgo(notification.created_at)
          }));

          // Replace notifications with previous page data
          setNotifications(notificationsWithTimeAgo);
          setCurrentPage(regularResult.meta.current_page);
          setTotalPages(regularResult.meta.last_page);
          
          console.log('🔔 NotificationContext: loaded previous page notifications', {
            newNotifications: notificationsWithTimeAgo.length,
            currentPage: regularResult.meta.current_page,
            totalPages: regularResult.meta.last_page
          });
        } else {
          console.error('Failed to load previous notifications:', regularResult.message);
        }
      } catch (err) {
        console.error('Error loading previous notifications:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [currentPage, totalPages, loading, getPerPage, formatTimeAgo]);

  const goToPage = useCallback(async (page) => {
    // Go to specific page
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      try {
        const currentPerPage = getPerPage();
        console.log('🔔 NotificationContext: goToPage called', { 
          page, 
          currentPage, 
          totalPages, 
          currentPerPage 
        });
        setLoading(true);

        // Fetch specific page of notifications
        const regularResult = await getNotifications({ page, per_page: currentPerPage });
        
        if (regularResult.success) {
          const notificationsWithTimeAgo = regularResult.data.map(notification => ({
            ...notification,
            timeAgo: formatTimeAgo(notification.created_at)
          }));

          // Replace notifications with specific page data
          setNotifications(notificationsWithTimeAgo);
          setCurrentPage(regularResult.meta.current_page);
          setTotalPages(regularResult.meta.last_page);
          
          console.log('🔔 NotificationContext: loaded page notifications', {
            newNotifications: notificationsWithTimeAgo.length,
            currentPage: regularResult.meta.current_page,
            totalPages: regularResult.meta.last_page
          });
        } else {
          console.error('Failed to load page notifications:', regularResult.message);
        }
      } catch (err) {
        console.error('Error loading page notifications:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [totalPages, currentPage, loading, getPerPage, formatTimeAgo]);

  // Initial data fetch - only when user is authenticated
  useEffect(() => {
    console.log('🔔 NotificationContext: Auth state changed', { isAuthenticated, user: !!user });
    
    const fetchInitialData = async () => {
      try {
        const currentPerPage = getPerPage();
        console.log('🔔 NotificationContext: fetchInitialData called', { currentPerPage });
        setLoading(true);
        setError(null);

        // Fetch ONLY regular notifications for the first page and unread count
        console.log('🔔 NotificationContext: Fetching initial data with perPage:', currentPerPage);
        
        const [regularResult, unreadResult] = await Promise.all([
          getNotifications({ page: 1, per_page: currentPerPage }),
          getUnreadCount()
        ]);
        
        console.log('🔔 NotificationContext: Initial API results', { 
          regularResult, 
          unreadResult,
          notificationsCount: regularResult.success ? regularResult.data.length : 0,
          paginationMeta: regularResult.success ? regularResult.meta : null
        });
        
        if (regularResult.success) {
          // Format regular notifications only
          const formattedNotifications = regularResult.data.map(notification => ({
            ...notification,
            timeAgo: formatTimeAgo(notification.created_at)
          }));

          // Set notifications for initial load
          setNotifications(formattedNotifications);
          
          // Set pagination info from API response
          setCurrentPage(regularResult.meta.current_page);
          setTotalPages(regularResult.meta.last_page);
          setTotal(regularResult.meta.total);
          
          // Update unread count
          if (unreadResult.success) {
            setUnreadCount(unreadResult.count);
          }
          
          // Fetch low stock notifications separately for sidebar
          getLowStockNotifications(20).then(lowStockResult => {
            if (lowStockResult.success) {
              const lowStockWithTimeAgo = lowStockResult.data.map(notification => ({
                ...notification,
                timeAgo: formatTimeAgo(notification.created_at)
              }));
              setLowStockNotifications(lowStockWithTimeAgo);
            }
          }).catch(err => {
            console.warn('Failed to load low stock notifications:', err);
          });
        } else {
          setError(regularResult.message);
        }
      } catch (err) {
        setError('Failed to fetch notifications');
        console.error('Error fetching initial notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && user) {
      console.log('🔔 NotificationContext: User authenticated, fetching initial notifications');
      fetchInitialData();
    } else {
      console.log('🔔 NotificationContext: User not authenticated, resetting state');
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setLowStockNotifications([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated, user, getPerPage, formatTimeAgo]); // Run when auth state changes

  // Auto-refresh functionality (every 5 minutes) - only when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const interval = setInterval(() => {
      refreshNotifications();
    }, 300000); // 5 minutes (300 seconds)

    return () => clearInterval(interval);
  }, [refreshNotifications, isAuthenticated, user]);

  // Memoized derived state
  const contextValue = useMemo(() => ({
    // State
    notifications,
    unreadCount,
    lowStockNotifications,
    loading,
    error,
    
    // Pagination state (expose at top level for easy access)
    currentPage,
    totalPages,
    total,
    
    // Derived state
    hasNotifications: notifications.length > 0,
    hasUnreadNotifications: unreadCount > 0,
    unreadNotifications: notifications.filter(n => !n.is_read),
    hasLowStockAlerts: lowStockNotifications.length > 0,
    
    // Pagination info
    paginationInfo: {
      currentPage,
      totalPages,
      total,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startItem: ((currentPage - 1) * getPerPage()) + 1,
      endItem: Math.min(currentPage * getPerPage(), total)
    },
    
    // Actions
    fetchNotifications: refreshNotifications, // For compatibility - use refresh instead
    fetchUnreadCount,
    fetchLowStockNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    refreshNotifications,
    
    // Pagination actions
    goToNextPage,
    goToPreviousPage,
    goToPage,
    loadMoreNotifications,
    
    // Utilities
    formatTimeAgo,
    lastRefresh,
    getPerPage
  }), [
    notifications,
    unreadCount,
    lowStockNotifications,
    loading,
    error,
    currentPage,
    totalPages,
    total,
    fetchNotifications,
    fetchUnreadCount,
    fetchLowStockNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    refreshNotifications,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    loadMoreNotifications,
    formatTimeAgo,
    lastRefresh,
    getPerPage
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;