// src/pages/Reports/Products/components/ProductAnalyticsCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ProductAnalyticsCard = ({ 
  data = [], 
  title = "Analytics",
  subtitle = "Performance metrics",
  icon: IconComponent,
  gradient = "from-blue-500 to-indigo-600",
  chartType = "area",
  dataKey = "value",
  formatValue = (v) => v
}) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl p-3 shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-100/40 rounded-3xl p-6 shadow-2xl border border-blue-200/40 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 rounded-full"
        />
        <motion.div
          animate={{
            rotate: -360,
            y: [-10, 10, -10]
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-r from-indigo-400/20 to-purple-500/20 rounded-full"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`bg-gradient-to-r ${gradient} p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}
          >
            {IconComponent && <IconComponent className="h-7 w-7 text-white" />}
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              {title}
            </h3>
            <p className="text-blue-600 text-sm font-medium">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="period" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                tickFormatter={formatValue}
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#6366F1"
                strokeWidth={3}
                fill={`url(#gradient-${dataKey})`}
                animationBegin={0}
                animationDuration={1500}
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="period" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                tickFormatter={formatValue}
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                animationBegin={0}
                animationDuration={1500}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              {IconComponent && <IconComponent className="h-8 w-8 text-gray-400" />}
            </div>
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductAnalyticsCard;