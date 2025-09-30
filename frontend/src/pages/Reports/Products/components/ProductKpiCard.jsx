// src/pages/Reports/Products/components/ProductKpiCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const ProductKpiCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  iconBg, 
  iconColor,
  subtitle,
  delta,
  index = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, translateY: -5 }}
      className="group relative"
    >
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${gradient}20, ${gradient}40)`
        }}
      />
      
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              {delta && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    delta.includes('+') 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : delta.includes('-')
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}
                >
                  {delta.includes('+') && <TrendingUp className="h-3 w-3" />}
                  {delta.includes('-') && <TrendingDown className="h-3 w-3" />}
                  {delta}
                </motion.span>
              )}
            </div>
            
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
              className="text-2xl lg:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${gradient}, ${gradient}CC)`
              }}
            >
              {value}
            </motion.p>
            
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className={`p-3 rounded-2xl shadow-lg ${iconBg}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductKpiCard;