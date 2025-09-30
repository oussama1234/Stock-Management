// src/pages/Admin/Categories/CategoryCard.jsx
import React, { memo } from 'react';
import { motion } from 'framer-motion';

const CategoryCard = memo(function CategoryCard({ title, value, icon: Icon, gradient = 'from-blue-500 to-indigo-600', subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-r ${gradient} text-white shadow`}>
          {Icon ? <Icon className="h-5 w-5"/> : <span className="text-lg">📊</span>}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
      {subtitle && <div className="mt-2 text-sm text-gray-600">{subtitle}</div>}
    </motion.div>
  );
});

export default CategoryCard;
