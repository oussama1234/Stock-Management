// NotificationItem.jsx - Individual notification item component
import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { NotificationTypes } from '@/api/Notifications';
import { getNotificationDisplayText, getPriorityDisplayInfo } from '@/utils/notificationUtils';

const NotificationItem = memo(({ 
  notification, 
  isSelected, 
  onSelectionChange, 
  notificationActions 
}) => {
  const priorityInfo = getPriorityDisplayInfo(notification.priority);
  const loadingState = notificationActions.getNotificationLoadingState(notification.id);

  // Get icon for notification type
  const getIcon = useCallback(() => {
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

  const handleToggleRead = useCallback((e) => {
    e.stopPropagation();
    if (!notification.is_read) {
      notificationActions.handleMarkAsRead(notification.id);
    }
  }, [notification.id, notification.is_read, notificationActions]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    notificationActions.handleDelete(notification.id, notification.title);
  }, [notification.id, notification.title, notificationActions]);

  const handleSelectionToggle = useCallback((e) => {
    onSelectionChange(e.target.checked);
  }, [onSelectionChange]);

  const handleClick = useCallback(() => {
    // Mark as read when clicked if unread
    if (!notification.is_read) {
      notificationActions.handleMarkAsRead(notification.id);
    }
  }, [notification.id, notification.is_read, notificationActions]);

  // Get notification type styling
  const getTypeStyle = () => {
    switch (notification.type) {
      case NotificationTypes.LOW_STOCK:
        return {
          gradient: 'from-orange-400 to-red-500',
          bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
          iconBg: 'from-orange-500 to-red-500',
          borderColor: 'border-orange-300 dark:border-orange-700'
        };
      case NotificationTypes.SALE_CREATED:
        return {
          gradient: 'from-green-400 to-emerald-500',
          bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          iconBg: 'from-green-500 to-emerald-500',
          borderColor: 'border-green-300 dark:border-green-700'
        };
      case NotificationTypes.PURCHASE_CREATED:
        return {
          gradient: 'from-blue-400 to-indigo-500',
          bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
          iconBg: 'from-blue-500 to-indigo-500',
          borderColor: 'border-blue-300 dark:border-blue-700'
        };
      case NotificationTypes.STOCK_UPDATED:
        return {
          gradient: 'from-purple-400 to-pink-500',
          bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
          iconBg: 'from-purple-500 to-pink-500',
          borderColor: 'border-purple-300 dark:border-purple-700'
        };
      default:
        return {
          gradient: 'from-gray-400 to-gray-500',
          bgGradient: 'from-gray-50 to-gray-50 dark:from-gray-800/20 dark:to-gray-800/20',
          iconBg: 'from-gray-500 to-gray-500',
          borderColor: 'border-gray-300 dark:border-gray-700'
        };
    }
  };

  const typeStyle = getTypeStyle();

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      className={`p-6 cursor-pointer transition-all duration-300 relative overflow-hidden ${
        notification.is_read 
          ? 'bg-white/40 dark:bg-gray-800/40' 
          : `bg-gradient-to-r ${typeStyle.bgGradient} border-l-4 ${typeStyle.borderColor}`
      }`}
      onClick={handleClick}
    >
      {/* Shimmer effect for unread */}
      {!notification.is_read && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
      
      <div className="flex items-start space-x-4 relative z-10">
        {/* Selection checkbox */}
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="flex items-center pt-1"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionToggle}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-md shadow-sm transition-all duration-200"
          />
        </motion.div>

        {/* Icon */}
        <motion.div 
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className={`p-3 rounded-2xl flex-shrink-0 shadow-lg ${
            notification.is_read 
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              : `bg-gradient-to-br ${typeStyle.iconBg} text-white shadow-xl`
          }`}
        >
          {getIcon()}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              {/* Header with title and type */}
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`text-sm font-medium truncate ${
                  notification.is_read 
                    ? 'text-gray-700 dark:text-gray-300' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {notification.title}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex-shrink-0">
                  {getNotificationDisplayText(notification.type)}
                </span>
              </div>

              {/* Message */}
              <p className={`text-sm line-clamp-2 mb-2 ${
                notification.is_read 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-gray-800 dark:text-gray-200'
              }`}>
                {notification.message}
              </p>

              {/* Footer with time and priority */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {notification.timeAgo}
                </p>
                
                <div className="flex items-center space-x-2">
                  {/* Priority badge */}
                  {(notification.priority === 'urgent' || notification.priority === 'high') && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${priorityInfo.bgColor} ${priorityInfo.textColor}`}>
                      {notification.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {priorityInfo.label}
                    </span>
                  )}
                  
                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Mark as read button */}
              {!notification.is_read && (
                <button
                  onClick={handleToggleRead}
                  disabled={loadingState.markingAsRead}
                  className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 transition-colors group"
                  title="Mark as read"
                >
                  {loadingState.markingAsRead ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={handleDelete}
                disabled={loadingState.deleting}
                className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors group"
                title="Delete notification"
              >
                {loadingState.deleting ? (
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

export default NotificationItem;