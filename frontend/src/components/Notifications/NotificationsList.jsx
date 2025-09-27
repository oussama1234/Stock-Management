// NotificationsList.jsx - List component for notifications
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { useNotificationContext } from '@/context/NotificationContext';

// LoadMoreSection component
const LoadMoreSection = memo(({ notificationContext }) => {
  const { loadMoreNotifications, goToPreviousPage, goToPage, currentPage, totalPages, total, loading, notifications } = notificationContext;
  const hasMore = currentPage < totalPages;
  const hasPrevious = currentPage > 1;
  const isLoadingMore = loading;


  return (
    <div className="p-6 border-t border-gray-100/50 dark:border-gray-700/50 text-center">
      {/* End message on last page */}
      {!hasMore && currentPage === totalPages && totalPages > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="font-medium">You've reached the end! ✨</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            All {total} notifications loaded
          </p>
        </div>
      )}
      
      {/* Navigation buttons - only show when there are pages to navigate */}
      {(hasMore || hasPrevious) && (
        <div className="flex justify-center items-center gap-3 mb-4">
          {/* First Page Button */}
          {hasPrevious && (
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                goToPage(1);
              }}
              disabled={isLoadingMore}
              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              « First
            </motion.button>
          )}

          {/* Previous Page Button */}
          {hasPrevious && (
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                goToPreviousPage();
              }}
              disabled={isLoadingMore}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </motion.button>
          )}

          {/* Next Page Button */}
          {hasMore && (
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                loadMoreNotifications();
              }}
              disabled={isLoadingMore}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </motion.button>
          )}

          {/* Last Page Button */}
          {hasMore && (
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                goToPage(totalPages);
              }}
              disabled={isLoadingMore}
              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Last »
            </motion.button>
          )}
        </div>
      )}
      
      {/* Page info */}
      <div className="space-y-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage} / {totalPages} • {notifications.length} on this page
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Total: {total} notifications across all pages
        </p>
      </div>
    </div>
  );
});

LoadMoreSection.displayName = 'LoadMoreSection';

const NotificationsList = memo(({ 
  notifications, 
  loading, 
  error, 
  selectedNotifications, 
  onSelectionChange, 
  notificationActions,
  viewMode = 'list' 
}) => {
  // Get full context for pagination
  const notificationContext = useNotificationContext();
  const { 
    notifications: allNotifications, 
    loadMoreNotifications, 
    goToPreviousPage,
    goToPage,
    currentPage, 
    totalPages, 
    total 
  } = notificationContext;
  
  // Check if pagination data is available (with proper null checks)
  const paginationLoaded = Boolean(currentPage && totalPages && typeof total === 'number');
  
  // Check if we're showing filtered notifications
  const isFiltered = Boolean(allNotifications && notifications.length !== allNotifications.length);
  const hasMorePages = Boolean(currentPage && totalPages && currentPage < totalPages);
  const hasPreviousPages = Boolean(currentPage && currentPage > 1);
  const shouldShowLoadMore = Boolean(paginationLoaded && !isFiltered && (hasMorePages || hasPreviousPages)); // Show navigation if there are previous or next pages
  
  // Loading state
  if (loading) {
    return (
      <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-6" />
              <div className="absolute inset-0 h-12 w-12 animate-ping bg-blue-400 rounded-full opacity-25 mx-auto"></div>
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 animate-pulse">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-center py-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div 
              className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell className="h-8 w-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={notificationActions.handleRefresh}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl font-semibold shadow-lg transition-all duration-300"
            >
              Try Again
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!notifications || notifications.length === 0) {
    return (
      <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-center py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              All caught up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
              No notifications match your current filters. Try adjusting them or check back later.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={notificationActions.handleRefresh}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-xl transition-all duration-300"
            >
              Refresh Notifications
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Notifications list
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 py-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {total || allNotifications.length} notification{(total || allNotifications.length) !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stay up to date with your latest activities
              </p>
            </div>
          </div>
          {selectedNotifications.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold shadow-lg"
            >
              {selectedNotifications.size} selected
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50 max-h-[70vh] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.95 }}
              transition={{ 
                delay: index * 0.05, 
                duration: 0.4,
                type: "spring",
                stiffness: 100
              }}
              layout
              className="notification-item hover-lift"
            >
              <NotificationItem
                notification={notification}
                isSelected={selectedNotifications.has(notification.id)}
                onSelectionChange={(isSelected) => onSelectionChange(notification.id, isSelected)}
                notificationActions={notificationActions}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {shouldShowLoadMore && (
        <LoadMoreSection 
          notificationContext={{
            loadMoreNotifications,
            goToPreviousPage,
            goToPage,
            currentPage,
            totalPages,
            total,
            loading: notificationContext.loading,
            notifications: allNotifications
          }}
        />
      )}
    </div>
  );
});

NotificationsList.displayName = 'NotificationsList';

export default NotificationsList;
