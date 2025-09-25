// useNotificationActions.js - Custom hook for notification actions
// Handles all business logic for notification interactions

import { useCallback, useState } from 'react';
import { useNotificationContext } from '@/context/NotificationContext';
import { useToast } from '@/components/Toaster/ToastContext';

/**
 * Custom hook for notification actions
 * Separates business logic from UI components
 */
export const useNotificationActions = () => {
  const {
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    refreshNotifications
  } = useNotificationContext();
  
  const toast = useToast();
  const [actionLoading, setActionLoading] = useState({});

  /**
   * Mark a single notification as read
   */
  const handleMarkAsRead = useCallback(async (notificationId) => {
    const actionKey = `mark_read_${notificationId}`;
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      const result = await markNotificationAsRead(notificationId);
      
      if (result.success) {
        toast.success('Notification marked as read');
        return { success: true };
      } else {
        toast.error(result.message || 'Failed to mark notification as read');
        return { success: false, message: result.message };
      }
    } catch (error) {
      toast.error('An error occurred while marking notification as read');
      return { success: false, message: error.message };
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [markNotificationAsRead, toast]);

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    const actionKey = 'mark_all_read';
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      const result = await markAllNotificationsAsRead();
      
      if (result.success) {
        const count = result.count || 0;
        if (count > 0) {
          toast.success(`Marked ${count} notification${count !== 1 ? 's' : ''} as read`);
        } else {
          toast.info('No unread notifications to mark');
        }
        return { success: true, count };
      } else {
        toast.error(result.message || 'Failed to mark all notifications as read');
        return { success: false, message: result.message };
      }
    } catch (error) {
      toast.error('An error occurred while marking all notifications as read');
      return { success: false, message: error.message };
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [markAllNotificationsAsRead, toast]);

  /**
   * Delete a single notification
   */
  const handleDelete = useCallback(async (notificationId, notificationTitle = '') => {
    const actionKey = `delete_${notificationId}`;
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      const result = await deleteNotificationById(notificationId);
      
      if (result.success) {
        toast.success(notificationTitle ? `Deleted "${notificationTitle}"` : 'Notification deleted');
        return { success: true };
      } else {
        toast.error(result.message || 'Failed to delete notification');
        return { success: false, message: result.message };
      }
    } catch (error) {
      toast.error('An error occurred while deleting notification');
      return { success: false, message: error.message };
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [deleteNotificationById, toast]);

  /**
   * Delete multiple notifications
   */
  const handleBulkDelete = useCallback(async (notificationIds) => {
    const actionKey = 'bulk_delete';
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      const results = await Promise.allSettled(
        notificationIds.map(id => deleteNotificationById(id))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        toast.success(`Deleted ${successful} notification${successful !== 1 ? 's' : ''}`);
      }
      
      if (failed > 0) {
        toast.warning(`Failed to delete ${failed} notification${failed !== 1 ? 's' : ''}`);
      }
      
      return { success: successful > 0, successful, failed };
    } catch (error) {
      toast.error('An error occurred during bulk delete');
      return { success: false, message: error.message };
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [deleteNotificationById, toast]);

  /**
   * Mark multiple notifications as read
   */
  const handleBulkMarkAsRead = useCallback(async (notificationIds) => {
    const actionKey = 'bulk_mark_read';
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      const results = await Promise.allSettled(
        notificationIds.map(id => markNotificationAsRead(id))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        toast.success(`Marked ${successful} notification${successful !== 1 ? 's' : ''} as read`);
      }
      
      if (failed > 0) {
        toast.warning(`Failed to mark ${failed} notification${failed !== 1 ? 's' : ''} as read`);
      }
      
      return { success: successful > 0, successful, failed };
    } catch (error) {
      toast.error('An error occurred during bulk mark as read');
      return { success: false, message: error.message };
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [markNotificationAsRead, toast]);

  /**
   * Refresh notifications
   */
  const handleRefresh = useCallback(async () => {
    const actionKey = 'refresh';
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      await refreshNotifications();
      toast.success('Notifications refreshed');
      
      return { success: true };
    } catch (error) {
      toast.error('Failed to refresh notifications');
      return { success: false, message: error.message };
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [refreshNotifications, toast]);

  /**
   * Check if an action is currently loading
   */
  const isActionLoading = useCallback((actionKey) => {
    return Boolean(actionLoading[actionKey]);
  }, [actionLoading]);

  /**
   * Get loading state for a specific notification
   */
  const getNotificationLoadingState = useCallback((notificationId) => {
    return {
      markingAsRead: isActionLoading(`mark_read_${notificationId}`),
      deleting: isActionLoading(`delete_${notificationId}`)
    };
  }, [isActionLoading]);

  return {
    // Single notification actions
    handleMarkAsRead,
    handleDelete,
    
    // Bulk actions
    handleMarkAllAsRead,
    handleBulkDelete,
    handleBulkMarkAsRead,
    
    // Utility actions
    handleRefresh,
    
    // Loading states
    isActionLoading,
    getNotificationLoadingState,
    actionLoading: {
      markingAllAsRead: isActionLoading('mark_all_read'),
      bulkDeleting: isActionLoading('bulk_delete'),
      bulkMarkingAsRead: isActionLoading('bulk_mark_read'),
      refreshing: isActionLoading('refresh')
    }
  };
};