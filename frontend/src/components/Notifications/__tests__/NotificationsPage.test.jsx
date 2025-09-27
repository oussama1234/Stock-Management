// NotificationsPage.test.jsx - Test for Mark all as read loading state
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsPage from '../../pages/NotificationsPage';

// Mock the required contexts and hooks
vi.mock('@/context/NotificationContext', () => ({
  useNotificationContext: () => ({
    notifications: [
      {
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        is_read: false,
        created_at: '2023-01-01'
      }
    ],
    loading: false,
    error: null,
    unreadCount: 1,
    hasNotifications: true,
    total: 1
  })
}));

vi.mock('@/hooks/useNotificationActions', () => ({
  useNotificationActions: () => ({
    handleMarkAllAsRead: vi.fn(),
    handleRefresh: vi.fn(),
    handleBulkMarkAsRead: vi.fn(),
    handleBulkDelete: vi.fn(),
    actionLoading: {
      markingAllAsRead: false,
      bulkDeleting: false,
      bulkMarkingAsRead: false,
      refreshing: false
    }
  })
}));

vi.mock('@/utils/notificationUtils', () => ({
  filterNotifications: (notifications) => notifications,
  sortNotifications: (notifications) => notifications,
  getNotificationStats: () => ({
    byType: {},
    byPriority: {},
    byCategory: {}
  })
}));

vi.mock('@/components/Notifications/NotificationFilters', () => ({
  default: () => <div data-testid="notification-filters">Filters</div>
}));

vi.mock('@/components/Notifications/NotificationsList', () => ({
  default: () => <div data-testid="notifications-list">List</div>
}));

vi.mock('@/components/Notifications/NotificationStats', () => ({
  default: () => <div data-testid="notification-stats">Stats</div>
}));

vi.mock('@/components/Notifications/BulkActions', () => ({
  default: () => <div data-testid="bulk-actions">Bulk Actions</div>
}));

describe('NotificationsPage - Mark All as Read Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Mark all as read button when there are unread notifications', () => {
    render(<NotificationsPage />);
    
    const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
    expect(markAllButton).toBeInTheDocument();
    expect(markAllButton).not.toBeDisabled();
    
    // Should show CheckCheck icon and proper text
    expect(screen.getByText('Mark all as read (1)')).toBeInTheDocument();
  });

  it('shows loading state when marking all as read', () => {
    // Mock the loading state
    const mockUseNotificationActions = vi.fn(() => ({
      handleMarkAllAsRead: vi.fn(),
      handleRefresh: vi.fn(),
      handleBulkMarkAsRead: vi.fn(),
      handleBulkDelete: vi.fn(),
      actionLoading: {
        markingAllAsRead: true, // This simulates the loading state
        bulkDeleting: false,
        bulkMarkingAsRead: false,
        refreshing: false
      }
    }));

    // Override the mock for this specific test
    vi.doMock('@/hooks/useNotificationActions', () => ({
      useNotificationActions: mockUseNotificationActions
    }));

    render(<NotificationsPage />);
    
    const markAllButton = screen.getByRole('button', { name: /marking all as read/i });
    expect(markAllButton).toBeInTheDocument();
    expect(markAllButton).toBeDisabled();
    
    // Should show loading text and spinner
    expect(screen.getByText('Marking all as read...')).toBeInTheDocument();
  });

  it('applies correct classes for loading and disabled states', () => {
    const mockUseNotificationActions = vi.fn(() => ({
      handleMarkAllAsRead: vi.fn(),
      handleRefresh: vi.fn(),
      handleBulkMarkAsRead: vi.fn(),
      handleBulkDelete: vi.fn(),
      actionLoading: {
        markingAllAsRead: true,
        bulkDeleting: false,
        bulkMarkingAsRead: false,
        refreshing: false
      }
    }));

    vi.doMock('@/hooks/useNotificationActions', () => ({
      useNotificationActions: mockUseNotificationActions
    }));

    render(<NotificationsPage />);
    
    const markAllButton = screen.getByRole('button', { name: /marking all as read/i });
    
    // Check that disabled classes are applied
    expect(markAllButton).toHaveClass('disabled:opacity-50');
    expect(markAllButton).toHaveClass('disabled:cursor-not-allowed');
    expect(markAllButton).toBeDisabled();
  });
});
