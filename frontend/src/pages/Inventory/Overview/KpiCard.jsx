// src/pages/Inventory/Overview/KpiCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import CountUpValue from '@/pages/Inventory/Overview/CountUpValue';

export default function KpiCard({ label, value, Icon, gradient = 'from-blue-500 to-indigo-500', iconBg = 'from-blue-100 to-indigo-100', className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-xl will-change-transform ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className={`bg-gradient-to-r ${iconBg} p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition`}> 
          {Icon ? <Icon className="h-5 w-5 text-gray-700 dark:text-gray-200" /> : null}
        </div>
        <div className={`inline-flex items-center justify-center p-2 rounded-xl text-white shadow bg-gradient-to-r ${gradient} opacity-90 group-hover:opacity-100 transition`}> 
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          <CountUpValue value={value} />
        </div>
      </div>
    </motion.div>
  );
}
