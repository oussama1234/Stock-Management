// src/pages/Reports/Products/components/StockMovementChart.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';

const StockMovementChart = ({ data = [] }) => {
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
                {entry.value}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
      className="group relative bg-gradient-to-br from-white via-green-50/20 to-emerald-100/40 rounded-3xl p-6 shadow-2xl border border-green-200/40 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 overflow-hidden"
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
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full"
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
          className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-full"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
          >
            <Package className="h-7 w-7 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Stock Movement
            </h3>
            <p className="text-green-600 text-sm font-medium">
              Inventory flow analysis
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2e7" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="in_qty" 
              fill="url(#colorIn)" 
              name="Stock In" 
              radius={[8, 8, 0, 0]}
              animationBegin={0}
              animationDuration={1500}
            />
            <Bar 
              dataKey="out_qty" 
              fill="url(#colorOut)" 
              name="Stock Out" 
              radius={[8, 8, 0, 0]}
              animationBegin={200}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ fill: '#6366F1', r: 4 }}
              activeDot={{ r: 6 }}
              name="Net Movement"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No movement data</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StockMovementChart;