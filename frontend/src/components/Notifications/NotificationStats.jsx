// NotificationStats.jsx - Statistics component for notifications
import { BarChart3, Bell, AlertTriangle, TrendingUp } from 'lucide-react';

const NotificationStats = ({ stats }) => {
  const { total, unread, byType, byPriority } = stats;

  const statCards = [
    {
      title: 'Total',
      value: total,
      icon: Bell,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Unread',
      value: unread,
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Statistics
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Main stats */}
        <div className="space-y-3">
          {statCards.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.title} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat.title}
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* By Type */}
        {Object.keys(byType).length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              By Type
            </h4>
            <div className="space-y-2">
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Priority */}
        {Object.keys(byPriority).length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              By Priority
            </h4>
            <div className="space-y-2">
              {Object.entries(byPriority)
                .sort(([,a], [,b]) => b - a) // Sort by count descending
                .map(([priority, count]) => {
                  const getPriorityColor = (priority) => {
                    switch (priority) {
                      case 'urgent': return 'text-red-600 dark:text-red-400';
                      case 'high': return 'text-orange-600 dark:text-orange-400';
                      case 'medium': return 'text-blue-600 dark:text-blue-400';
                      case 'low': return 'text-gray-600 dark:text-gray-400';
                      default: return 'text-gray-600 dark:text-gray-400';
                    }
                  };

                  return (
                    <div key={priority} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          priority === 'urgent' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <span className={`capitalize ${getPriorityColor(priority)}`}>
                          {priority}
                        </span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="text-center py-4">
            <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationStats;
