// src/pages/Dashboard/components/CategoryDistribution.jsx
// Beautiful category sales distribution with icons, animations, and colorful design

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  Home, 
  FileText, 
  Armchair, 
  Shirt, 
  Footprints,
  Heart,
  Dumbbell,
  Gamepad2,
  BookOpen,
  Coffee,
  Sparkles,
  Car,
  Flower,
  PawPrint,
  Package,
  TrendingUp
} from "lucide-react";
import { fmtNumber } from "../utils";

// Category icon mapping with colors
const getCategoryConfig = (categoryName) => {
  const configs = {
    'Electronics': { icon: Smartphone, color: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50' },
    'Home & Kitchen': { icon: Home, color: 'from-emerald-500 to-green-600', bg: 'from-emerald-50 to-green-50' },
    'Office Supplies': { icon: FileText, color: 'from-slate-500 to-gray-600', bg: 'from-slate-50 to-gray-50' },
    'Furniture': { icon: Armchair, color: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50' },
    'Clothing & Apparel': { icon: Shirt, color: 'from-purple-500 to-violet-600', bg: 'from-purple-50 to-violet-50' },
    'Shoes & Accessories': { icon: Footprints, color: 'from-pink-500 to-rose-600', bg: 'from-pink-50 to-rose-50' },
    'Health & Beauty': { icon: Heart, color: 'from-rose-500 to-pink-600', bg: 'from-rose-50 to-pink-50' },
    'Sports & Outdoors': { icon: Dumbbell, color: 'from-green-500 to-teal-600', bg: 'from-green-50 to-teal-50' },
    'Toys & Games': { icon: Gamepad2, color: 'from-yellow-500 to-amber-600', bg: 'from-yellow-50 to-amber-50' },
    'Books & Stationery': { icon: BookOpen, color: 'from-indigo-500 to-purple-600', bg: 'from-indigo-50 to-purple-50' },
    'Food & Beverages': { icon: Coffee, color: 'from-orange-500 to-red-600', bg: 'from-orange-50 to-red-50' },
    'Cleaning & Household Essentials': { icon: Sparkles, color: 'from-cyan-500 to-blue-600', bg: 'from-cyan-50 to-blue-50' },
    'Automotive & Tools': { icon: Car, color: 'from-gray-500 to-slate-600', bg: 'from-gray-50 to-slate-50' },
    'Garden & Outdoor': { icon: Flower, color: 'from-lime-500 to-green-600', bg: 'from-lime-50 to-green-50' },
    'Pet Supplies': { icon: PawPrint, color: 'from-teal-500 to-cyan-600', bg: 'from-teal-50 to-cyan-50' },
  };
  return configs[categoryName] || { icon: Package, color: 'from-gray-500 to-slate-600', bg: 'from-gray-50 to-slate-50' };
};

const CategoryDistribution = React.memo(function CategoryDistribution({ rows = [] }) {
  const maxQty = useMemo(() => (rows[0]?.qty ? Number(rows[0].qty) : 0), [rows]);
  
  if (rows.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-3xl p-8 text-center border border-gray-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gradient-to-r from-gray-400 to-slate-500 p-4 rounded-2xl">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">No Category Data</h3>
            <p className="text-gray-600">Start making sales to see category distribution</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((category, index) => {
        const config = getCategoryConfig(category.category);
        const Icon = config.icon;
        const percentage = maxQty ? Math.min(100, (Number(category.qty) / maxQty) * 100) : 0;
        
        return (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`bg-gradient-to-r ${config.bg} border border-white/60 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`bg-gradient-to-r ${config.color} p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                    {category.category}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {fmtNumber(category.qty)} items sold
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {fmtNumber(category.qty)}
                </div>
                <div className="text-xs text-gray-500">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="relative">
              <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: (index * 0.1) + 0.3, duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${config.color} rounded-full shadow-sm`}
                />
              </div>
              
              {/* Sparkle effect for top performer */}
              {index === 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="absolute -top-1 -right-1"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

export default CategoryDistribution;
