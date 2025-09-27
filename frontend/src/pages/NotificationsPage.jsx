// NotificationsPage.jsx - Main notifications page (presentation layer only)
// Follows separation of concerns - no business logic in useEffect

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, RotateCcw, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import { useNotificationContext } from '@/context/NotificationContext';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { filterNotifications, sortNotifications, getNotificationStats } from '@/utils/notificationUtils';
import NotificationFilters from '@/components/Notifications/NotificationFilters';
import NotificationsList from '@/components/Notifications/NotificationsList';
import NotificationStats from '@/components/Notifications/NotificationStats';
import BulkActions from '@/components/Notifications/BulkActions';

const NotificationsPage = () => {
  // Context and actions
  const { 
    notifications, 
    loading, 
    error, 
    unreadCount,
    hasNotifications,
    total
  } = useNotificationContext();
  
  const notificationActions = useNotificationActions();

  // Local state for UI only
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [filters, setFilters] = useState({
    readStatus: 'all',
    type: '',
    priority: '',
    category: 'all',
    searchTerm: ''
  });
  const [sorting, setSorting] = useState({
    field: 'created_at',
    direction: 'desc'
  });
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grouped'

  // Derived data (computed from state - no side effects)
  const processedNotifications = useMemo(() => {
    const filtered = filterNotifications(notifications, filters);
    return sortNotifications(filtered, sorting);
  }, [notifications, filters, sorting]);

  const stats = useMemo(() => {
    // Use context data for stats, not just the current page
    return {
      total: total || notifications.length,
      unread: unreadCount,
      // For detailed breakdown, we'd need to use all notifications
      // For now, use what we have on current page for type/priority breakdown
      byType: getNotificationStats(processedNotifications).byType,
      byPriority: getNotificationStats(processedNotifications).byPriority,
      byCategory: getNotificationStats(processedNotifications).byCategory
    };
  }, [total, notifications.length, unreadCount, processedNotifications]);

  const hasSelectedNotifications = selectedNotifications.size > 0;
  const isAllSelected = hasNotifications && selectedNotifications.size === processedNotifications.length;

  // Event handlers (pure functions - no side effects)
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setSelectedNotifications(new Set()); // Clear selection when filters change
  };

  const handleSortingChange = (newSorting) => {
    setSorting(newSorting);
  };

  const handleSelectionChange = (notificationId, isSelected) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(notificationId);
      } else {
        newSet.delete(notificationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(processedNotifications.map(n => n.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedNotifications(new Set());
  };

  // Bulk action handlers
  const handleBulkMarkAsRead = async () => {
    const unreadSelected = Array.from(selectedNotifications)
      .filter(id => {
        const notification = processedNotifications.find(n => n.id === id);
        return notification && !notification.is_read;
      });
    
    if (unreadSelected.length > 0) {
      await notificationActions.handleBulkMarkAsRead(unreadSelected);
      setSelectedNotifications(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size > 0) {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedNotifications.size} notification${selectedNotifications.size > 1 ? 's' : ''}?`
      );
      
      if (confirmed) {
        await notificationActions.handleBulkDelete(Array.from(selectedNotifications));
        setSelectedNotifications(new Set());
      }
    }
  };

  // Clear selection when notifications change
  useEffect(() => {
    setSelectedNotifications(prev => {
      const validIds = new Set(processedNotifications.map(n => n.id));
      return new Set([...prev].filter(id => validIds.has(id)));
    });
  }, [processedNotifications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-6">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.div>
                )}
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                >
                  Notifications
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-gray-600 dark:text-gray-400 mt-1"
                >
                  Stay updated with your latest alerts and activities
                </motion.p>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-4"
            >
              {unreadCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-full shadow-lg backdrop-blur-sm"
                >
                  {unreadCount} unread
                </motion.div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={notificationActions.handleRefresh}
                disabled={notificationActions.actionLoading.refreshing}
                className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
                title="Refresh notifications"
              >
                <RotateCcw 
                  className={`h-5 w-5 ${
                    notificationActions.actionLoading.refreshing ? 'animate-spin' : ''
                  }`} 
                />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 xl:grid-cols-4 gap-8"
        >
          {/* Sidebar with filters and stats */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="xl:col-span-1 space-y-6"
          >
            <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6">
              <NotificationStats stats={stats} />
            </div>
            <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6">
              <NotificationFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                sorting={sorting}
                onSortingChange={handleSortingChange}
              />
            </div>
          </motion.div>

          {/* Main content */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="xl:col-span-3 space-y-6"
          >
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center space-x-3"
              >
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-sm font-medium shadow-lg">
                  {total || notifications.length} notifications
                </div>
                {unreadCount > 0 && (
                  <div className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full text-sm font-medium shadow-lg animate-pulse">
                    {unreadCount} unread
                  </div>
                )}
              </motion.div>
              
              {/* Mark all as read button */}
              {unreadCount > 0 && !hasSelectedNotifications && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={!notificationActions.actionLoading.markingAllAsRead ? { scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" } : {}}
                  whileTap={!notificationActions.actionLoading.markingAllAsRead ? { scale: 0.95 } : {}}
                  onClick={notificationActions.handleMarkAllAsRead}
                  disabled={notificationActions.actionLoading.markingAllAsRead}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notificationActions.actionLoading.markingAllAsRead ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Marking all as read...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="h-5 w-5 mr-2" />
                      Mark all as read ({unreadCount})
                    </>
                  )}
                </motion.button>
              )}
            </div>

            {/* Bulk actions */}
            {hasSelectedNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <BulkActions
                  selectedCount={selectedNotifications.size}
                  isAllSelected={isAllSelected}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  onBulkMarkAsRead={handleBulkMarkAsRead}
                  onBulkDelete={handleBulkDelete}
                  actionLoading={notificationActions.actionLoading}
                />
              </motion.div>
            )}

            {/* Notifications list */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden"
            >
              <NotificationsList
                notifications={processedNotifications}
                loading={loading}
                error={error}
                selectedNotifications={selectedNotifications}
                onSelectionChange={handleSelectionChange}
                notificationActions={notificationActions}
                viewMode={viewMode}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationsPage;
