// src/pages/Admin/Categories/components/CategoryStatsCard.jsx
// Beautiful stats card with animations and gradients
import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CategoryStatsCard = memo(function CategoryStatsCard({
  title,
  value,
  icon: Icon,
  gradient = 'from-blue-500 to-indigo-500',
  bgGradient = 'from-blue-50 to-indigo-50',
  subtitle,
  trend,
  trendValue,
  animationDelay = 0
}) {
  // Value is already formatted by the parent component
  const displayValue = value;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: animationDelay, 
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        y: -4, 
        transition: { duration: 0.2 } 
      }}
      className={`bg-gradient-to-br ${bgGradient} border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-r ${gradient} rounded-xl shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {TrendIcon && trendValue && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend === 'up' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <TrendIcon className="h-3 w-3" />
            <span>{trendValue}%</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: animationDelay + 0.1, duration: 0.3 }}
          className="text-2xl font-bold text-gray-800"
        >
          {displayValue}
        </motion.div>
        
        <div>
          <div className="text-sm font-semibold text-gray-700">{title}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </div>

      {/* Sparkle effect on hover */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
      </div>
    </motion.div>
  );
});

export default CategoryStatsCard;