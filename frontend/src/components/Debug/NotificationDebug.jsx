// NotificationDebug.jsx - Simple debug component to test notification context
import { useNotificationContext } from '@/context/NotificationContext';

const NotificationDebug = () => {
  try {
    const { unreadCount, notifications, loading, error } = useNotificationContext();
    
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: '#000', 
        color: '#fff', 
        padding: '10px', 
        fontSize: '12px',
        zIndex: 9999,
        border: '1px solid #333'
      }}>
        <div>🐛 Debug Notifications:</div>
        <div>Unread Count: {unreadCount}</div>
        <div>Total Notifications: {notifications?.length || 0}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Context Working: ✅</div>
      </div>
    );
  } catch (err) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: '#f00', 
        color: '#fff', 
        padding: '10px', 
        fontSize: '12px',
        zIndex: 9999
      }}>
        <div>❌ Context Error: {err.message}</div>
      </div>
    );
  }
};

export default NotificationDebug;