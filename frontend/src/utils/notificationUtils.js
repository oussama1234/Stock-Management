// notificationUtils.js - Pure utility functions for notifications
// No side effects, just data transformation and formatting

import { NotificationTypes, NotificationPriorities } from '@/api/Notifications';

/**
 * Filter notifications based on criteria
 * @param {Array} notifications - Array of notifications
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered notifications
 */
export const filterNotifications = (notifications, filters) => {
  if (!notifications || !Array.isArray(notifications)) return [];

  return notifications.filter(notification => {
    // Filter by read status
    if (filters.readStatus === 'read' && !notification.is_read) return false;
    if (filters.readStatus === 'unread' && notification.is_read) return false;

    // Filter by type
    if (filters.type && notification.type !== filters.type) return false;

    // Filter by priority
    if (filters.priority && notification.priority !== filters.priority) return false;

    // Filter by category
    if (filters.category && filters.category !== 'all' && notification.category !== filters.category) return false;

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesTitle = notification.title?.toLowerCase().includes(searchLower);
      const matchesMessage = notification.message?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesMessage) return false;
    }

    return true;
  });
};

/**
 * Sort notifications based on criteria
 * @param {Array} notifications - Array of notifications
 * @param {Object} sorting - Sort criteria
 * @returns {Array} Sorted notifications
 */
export const sortNotifications = (notifications, sorting) => {
  if (!notifications || !Array.isArray(notifications)) return [];

  const { field, direction } = sorting;
  
  return [...notifications].sort((a, b) => {
    let valueA, valueB;

    switch (field) {
      case 'created_at':
        valueA = new Date(a.created_at);
        valueB = new Date(b.created_at);
        break;
      case 'priority':
        // Priority order: urgent > high > medium > low
        const priorityOrder = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1
        };
        valueA = priorityOrder[a.priority] || 0;
        valueB = priorityOrder[b.priority] || 0;
        break;
      case 'title':
        valueA = a.title?.toLowerCase() || '';
        valueB = b.title?.toLowerCase() || '';
        break;
      case 'type':
        valueA = a.type || '';
        valueB = b.type || '';
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Group notifications by a specific field
 * @param {Array} notifications - Array of notifications
 * @param {string} groupBy - Field to group by
 * @returns {Object} Grouped notifications
 */
export const groupNotifications = (notifications, groupBy) => {
  if (!notifications || !Array.isArray(notifications)) return {};

  return notifications.reduce((groups, notification) => {
    let key;

    switch (groupBy) {
      case 'date':
        key = new Date(notification.created_at).toDateString();
        break;
      case 'type':
        key = notification.type;
        break;
      case 'priority':
        key = notification.priority;
        break;
      case 'read_status':
        key = notification.is_read ? 'Read' : 'Unread';
        break;
      default:
        key = 'All';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
    return groups;
  }, {});
};

/**
 * Get notification statistics
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Statistics object
 */
export const getNotificationStats = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) {
    return {
      total: 0,
      unread: 0,
      byType: {},
      byPriority: {},
      byCategory: {}
    };
  }

  return notifications.reduce((stats, notification) => {
    // Count totals
    stats.total++;
    if (!notification.is_read) stats.unread++;

    // Count by type
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

    // Count by priority
    stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;

    // Count by category
    stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;

    return stats;
  }, {
    total: 0,
    unread: 0,
    byType: {},
    byPriority: {},
    byCategory: {}
  });
};

/**
 * Get notification display text
 * @param {string} type - Notification type
 * @param {string} field - Field to get text for
 * @returns {string} Display text
 */
export const getNotificationDisplayText = (type, field = 'label') => {
  const typeMap = {
    [NotificationTypes.LOW_STOCK]: {
      label: 'Low Stock Alert',
      icon: '📦',
      color: 'orange'
    },
    [NotificationTypes.SALE_CREATED]: {
      label: 'Sale Created',
      icon: '💰',
      color: 'green'
    },
    [NotificationTypes.PURCHASE_CREATED]: {
      label: 'Purchase Created',
      icon: '🛒',
      color: 'blue'
    },
    [NotificationTypes.STOCK_UPDATED]: {
      label: 'Stock Updated',
      icon: '📈',
      color: 'purple'
    }
  };

  return typeMap[type]?.[field] || 'Unknown';
};

/**
 * Get priority display text and styling
 * @param {string} priority - Priority level
 * @returns {Object} Priority display info
 */
export const getPriorityDisplayInfo = (priority) => {
  const priorityMap = {
    [NotificationPriorities.URGENT]: {
      label: 'Urgent',
      color: 'red',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    [NotificationPriorities.HIGH]: {
      label: 'High',
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-800 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    [NotificationPriorities.MEDIUM]: {
      label: 'Medium',
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    [NotificationPriorities.LOW]: {
      label: 'Low',
      color: 'gray',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-800 dark:text-gray-300',
      borderColor: 'border-gray-200 dark:border-gray-600'
    }
  };

  return priorityMap[priority] || priorityMap[NotificationPriorities.MEDIUM];
};

/**
 * Validate notification filters
 * @param {Object} filters - Filter object
 * @returns {Object} Validated filters
 */
export const validateFilters = (filters) => {
  const validTypes = Object.values(NotificationTypes);
  const validPriorities = Object.values(NotificationPriorities);
  const validReadStatuses = ['all', 'read', 'unread'];
  const validCategories = ['all', 'inventory', 'sales', 'purchases', 'system', 'general'];

  return {
    type: validTypes.includes(filters.type) ? filters.type : '',
    priority: validPriorities.includes(filters.priority) ? filters.priority : '',
    readStatus: validReadStatuses.includes(filters.readStatus) ? filters.readStatus : 'all',
    category: validCategories.includes(filters.category) ? filters.category : 'all',
    searchTerm: typeof filters.searchTerm === 'string' ? filters.searchTerm.trim() : ''
  };
};

/**
 * Build query parameters from filters
 * @param {Object} filters - Filter object
 * @param {Object} pagination - Pagination object
 * @param {Object} sorting - Sorting object
 * @returns {Object} Query parameters
 */
export const buildQueryParams = (filters, pagination, sorting) => {
  const params = {};

  // Pagination
  if (pagination.page) params.page = pagination.page;
  if (pagination.perPage) params.per_page = pagination.perPage;

  // Sorting
  if (sorting.field) params.sort_by = sorting.field;
  if (sorting.direction) params.sort_order = sorting.direction;

  // Filters (only include non-default values)
  if (filters.type) params.type = filters.type;
  if (filters.priority) params.priority = filters.priority;
  if (filters.readStatus && filters.readStatus !== 'all') params.read_status = filters.readStatus;
  if (filters.category && filters.category !== 'all') params.category = filters.category;
  if (filters.searchTerm) params.search = filters.searchTerm;

  return params;
};