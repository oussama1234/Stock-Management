// SaleNotificationDebug.jsx - Debug component to check notification creation after sales
import { useEffect, useState } from 'react';
import { useNotificationContext } from '@/context/NotificationContext';

const SaleNotificationDebug = () => {
  const { notifications, unreadCount, refreshNotifications } = useNotificationContext();
  const [lastCheck, setLastCheck] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // Listen for sales events to check if notifications are created
    const handleSalesUpdate = (event) => {
      const { productId, newSaleItem } = event.detail;
      
        productId,
        saleItem: newSaleItem,
        currentUnreadCount: unreadCount,
        totalNotifications: notifications.length
      });
      
      // Wait a bit then refresh notifications to see if new ones were created
      setTimeout(() => {
        refreshNotifications();
        setLastCheck(new Date().toLocaleTimeString());
      }, 2000);
    };
    
    window.addEventListener('salesDataUpdated', handleSalesUpdate);
    
    return () => {
      window.removeEventListener('salesDataUpdated', handleSalesUpdate);
    };
  }, [unreadCount, notifications.length, refreshNotifications]);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm shadow-lg z-50">
      <div className="font-semibold text-yellow-800 mb-2">🔍 Notification Debug</div>
      <div className="text-yellow-700">
        <div>Unread: {unreadCount}</div>
        <div>Total: {notifications.length}</div>
        <div>Last check: {lastCheck}</div>
        <button 
          onClick={() => {
            refreshNotifications();
            setLastCheck(new Date().toLocaleTimeString());
          }}
          className="mt-2 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-xs"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
};

export default SaleNotificationDebug;
