// src/pages/Reports/Products/components/ProductPerformanceCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ProductPerformanceCard = ({ 
  data = [], 
  title = "Performance",
  subtitle = "Product metrics",
  icon: IconComponent,
  gradient = "from-blue-500 to-indigo-600",
  type = "selling"
}) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl p-3 shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{label}</p>
          <div className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: payload[0]?.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {payload[0]?.value}
            </span>
          </div>
          {type === 'selling' && data?.revenue && (
            <div className="flex items-center gap-2 text-sm mt-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
              <span className="font-semibold text-green-600">
                ${Number(data.revenue).toLocaleString()}
              </span>
            </div>
          )}
          {type === 'purchased' && data?.cost && (
            <div className="flex items-center gap-2 text-sm mt-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">Cost:</span>
              <span className="font-semibold text-orange-600">
                ${Number(data.cost).toLocaleString()}
              </span>
            </div>
          )}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="group relative bg-gradient-to-br from-white via-purple-50/20 to-pink-100/40 rounded-3xl p-6 shadow-2xl border border-purple-200/40 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 overflow-hidden"
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
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full"
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
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-rose-700 bg-clip-text text-transparent">
              {title}
            </h3>
            <p className="text-purple-600 text-sm font-medium">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
          >
            <defs>
              {data.map((entry, index) => (
                <linearGradient key={`gradient-${index}`} id={`colorBar-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={entry.fill} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={entry.fill} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <motion.rect
                  key={`cell-${index}`}
                  fill={`url(#colorBar-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
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

export default ProductPerformanceCard;