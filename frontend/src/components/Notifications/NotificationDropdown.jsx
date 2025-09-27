// NotificationDropdown.jsx - Clean, performant notification component
// Optimized for speed with memoization and efficient rendering

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationsRoute, ProductDetailsRoute } from '@/router/Index';
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  ExternalLink,
  Loader2,
  Check
} from 'lucide-react';
import { useNotificationContext } from '@/context/NotificationContext';
import { 
  NotificationTypes, 
  NotificationPriorities, 
  getNotificationIcon, 
  getNotificationColor 
} from '@/api/Notifications';
import { getSaleById } from '@/api/Sales';
import { getPurchaseById } from '@/api/Purchases';
import { useToast } from '@/components/Toaster/ToastContext';

/**
 * Notification Item Component - Memoized for performance
 */
const NotificationItem = memo(({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onCloseDropdown,
  isDeleting = false,
  isMarkingAsRead = false
}) => {
  // Get appropriate icon for notification type
  const getIcon = useMemo(() => {
    switch (notification.type) {
      case NotificationTypes.LOW_STOCK:
        return <Package className="h-4 w-4" />;
      case NotificationTypes.SALE_CREATED:
        return <TrendingUp className="h-4 w-4" />;
      case NotificationTypes.PURCHASE_CREATED:
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  }, [notification.type]);

  // Get color classes based on priority
  const colorClasses = useMemo(() => {
    const baseColors = getNotificationColor(notification.priority);
    return {
      background: notification.priority === NotificationPriorities.URGENT 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
        : notification.priority === NotificationPriorities.HIGH
        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconBg: notification.priority === NotificationPriorities.URGENT 
        ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400' 
        : notification.priority === NotificationPriorities.HIGH
        ? 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-400'
        : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
    };
  }, [notification.priority]);

  // Row click should not auto mark as read anymore
  const handleClick = useCallback(() => {
    return;
  }, []);
  const navigate = useNavigate();

  // Resolve product meta for sale/purchase if backend omitted it
  const initialProductId = notification?.data?.product_id || null;
  const initialProductName = notification?.data?.product_name || '';
  const [productMeta, setProductMeta] = useState({ id: initialProductId, name: initialProductName });

  useEffect(() => {
    let cancelled = false;
    async function resolveProduct() {
      if (productMeta.id) return;
      if (notification.type === NotificationTypes.SALE_CREATED && notification?.data?.sale_id) {
        try {
          const res = await getSaleById(notification.data.sale_id);
          const sale = res?.data || res;
          const firstItem = sale?.items?.[0];
          const prod = firstItem?.product;
          if (!cancelled && prod?.id) setProductMeta({ id: prod.id, name: prod.name || 'Product' });
        } catch (_) {}
      } else if (notification.type === NotificationTypes.PURCHASE_CREATED && notification?.data?.purchase_id) {
        try {
          const res = await getPurchaseById(notification.data.purchase_id);
          const purchase = res?.data || res;
          const firstItem = purchase?.purchaseItems?.[0] || purchase?.items?.[0];
          const prod = firstItem?.product;
          if (!cancelled && prod?.id) setProductMeta({ id: prod.id, name: prod.name || 'Product' });
        } catch (_) {}
      }
    }
    resolveProduct();
    return () => { cancelled = true; };
  }, [notification?.data?.sale_id, notification?.data?.purchase_id, notification.type]);

  const handleGoToProduct = useCallback((e) => {
    e.stopPropagation();
    const productId = productMeta?.id || notification?.data?.product_id;
    if (productId) {
      navigate(`${ProductDetailsRoute}/${productId}`);
      onCloseDropdown?.();
    }
  }, [productMeta?.id, notification?.data?.product_id, navigate, onCloseDropdown]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(notification.id);
  }, [notification.id, onDelete]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group ${
        notification.is_read ? '' : colorClasses.background
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${colorClasses.iconBg} flex-shrink-0`}>
          {getIcon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {notification.message}
                {(productMeta?.id && (productMeta?.name || notification?.data?.product_name)) && (
                  <button
                    onClick={(e) => handleGoToProduct(e)}
                    className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                    title={`View ${productMeta?.name || notification?.data?.product_name}`}
                  >
                    {(productMeta?.name || notification?.data?.product_name)} (#{productMeta?.id || notification?.data?.product_id})
                  </button>
                )}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {notification.timeAgo}
                </p>
                {notification.priority === NotificationPriorities.URGENT && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Urgent
                  </span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 ml-2">
              {!notification.is_read && !isMarkingAsRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
              {isMarkingAsRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
              )}

              {/* Explicit mark-as-read button */}
              {!notification.is_read && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }}
                  disabled={isMarkingAsRead}
                  className={`${
                    isMarkingAsRead
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  } p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 transition-all duration-200 disabled:cursor-not-allowed`}
                  title={isMarkingAsRead ? 'Marking...' : 'Mark as read'}
                >
                  {isMarkingAsRead ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={handleDelete}
                disabled={isDeleting || isMarkingAsRead}
                className={`${
                  isDeleting || isMarkingAsRead 
                    ? 'opacity-100' 
                    : 'opacity-0 group-hover:opacity-100'
                } p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-all duration-200 disabled:cursor-not-allowed`}
                title={isDeleting ? "Deleting..." : "Delete notification"}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

NotificationItem.displayName = 'NotificationItem';

/**
 * Main Notification Dropdown Component
 */
const NotificationDropdown = memo(({ 
  isOpen, 
  onClose, 
  onNavigateToLowStock 
}) => {
  const toast = useToast();
  
  // Loading states for individual notifications
  const [loadingStates, setLoadingStates] = useState({
    deleting: new Set(),
    markingAsRead: new Set(),
    markingAllAsRead: false
  });
  
  // Use the shared notification context
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    refreshNotifications
  } = useNotificationContext();

  // Memoized handlers for performance
  const handleMarkAsRead = useCallback(async (notificationId) => {
    // Set loading state
    setLoadingStates(prev => ({
      ...prev,
      markingAsRead: new Set([...prev.markingAsRead, notificationId])
    }));
    
    try {
      const result = await markNotificationAsRead(notificationId);
      if (!result.success) {
        toast.error(result.message);
      }
    } finally {
      // Clear loading state
      setLoadingStates(prev => {
        const newMarkingAsRead = new Set(prev.markingAsRead);
        newMarkingAsRead.delete(notificationId);
        return {
          ...prev,
          markingAsRead: newMarkingAsRead
        };
      });
    }
  }, [markNotificationAsRead, toast]);

  const handleDelete = useCallback(async (notificationId) => {
    // Set loading state
    setLoadingStates(prev => ({
      ...prev,
      deleting: new Set([...prev.deleting, notificationId])
    }));
    
    try {
      const result = await deleteNotificationById(notificationId);
      if (result.success) {
        toast.success('Notification deleted');
      } else {
        toast.error(result.message);
      }
    } finally {
      // Clear loading state
      setLoadingStates(prev => {
        const newDeleting = new Set(prev.deleting);
        newDeleting.delete(notificationId);
        return {
          ...prev,
          deleting: newDeleting
        };
      });
    }
  }, [deleteNotificationById, toast]);

  const handleMarkAllAsRead = useCallback(async () => {
    // Set loading state
    setLoadingStates(prev => ({ ...prev, markingAllAsRead: true }));
    
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        toast.success(`Marked ${result.count || 'all'} notifications as read`);
      } else {
        toast.error(result.message);
      }
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, markingAllAsRead: false }));
    }
  }, [markAllNotificationsAsRead, toast]);

  const handleRefresh = useCallback(() => {
    refreshNotifications();
    toast.success('Notifications refreshed');
  }, [refreshNotifications, toast]);

  const handleNavigateToLowStock = useCallback(() => {
    onNavigateToLowStock();
    onClose();
  }, [onNavigateToLowStock, onClose]);

  // Memoized notification list for performance
  const notificationList = useMemo(() => {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!hasNotifications) {
      return (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No notifications yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            We'll notify you when something happens
          </p>
        </div>
      );
    }

    return (
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onCloseDropdown={onClose}
              isDeleting={loadingStates.deleting.has(notification.id)}
              isMarkingAsRead={loadingStates.markingAsRead.has(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }, [
    loading,
    error,
    hasNotifications,
    notifications,
    handleMarkAsRead,
    handleDelete,
    handleNavigateToLowStock,
    handleRefresh,
    loadingStates
  ]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-[9999]"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                {unreadCount} new
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Refresh notifications"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                ↻
              </motion.div>
            </button>
          </div>
        </div>
      </div>

      {/* Notification List */}
      {notificationList}

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
        <div className="p-4 space-y-2">
          {hasNotifications && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={loadingStates.markingAllAsRead}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors py-2 px-3 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.markingAllAsRead ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                  Marking all as read...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Mark all read ({unreadCount})
                </>
              )}
            </button>
          )}
          
          <Link
            to={NotificationsRoute}
            onClick={onClose}
            className="w-full flex items-center justify-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View All Notifications
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

NotificationDropdown.displayName = 'NotificationDropdown';

export default NotificationDropdown;
