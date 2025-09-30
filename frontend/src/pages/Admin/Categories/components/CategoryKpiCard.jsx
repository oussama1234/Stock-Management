// src/pages/Admin/Categories/components/CategoryKpiCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function CategoryKpiCard({ 
  label, 
  value, 
  Icon, 
  gradient = 'from-blue-500 to-indigo-500', 
  iconBg = 'from-blue-100 to-indigo-100',
  iconColor = 'text-blue-600',
  subtitle = '',
  delta,
  index = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      whileHover={{ 
        y: -6, 
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        scale: 1.02
      }}
      className={`group relative bg-gradient-to-br ${gradient} rounded-3xl shadow-xl p-4 border border-white/20 backdrop-blur-sm transform transition-all duration-500 overflow-hidden`}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full"
        />
        <motion.div
          animate={{
            rotate: -360,
            y: [-5, 5, -5]
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full"
        />
      </div>

      <div className="relative z-10">
        {/* Header with icon and delta */}
        <div className="flex items-center justify-between mb-3">
          <motion.div 
            className={`bg-gradient-to-r ${iconBg} p-2 rounded-xl backdrop-blur-sm shadow-md group-hover:scale-110 transition-transform duration-300`}
            whileHover={{ rotate: 5 }}
          >
            {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
          </motion.div>
          
          {typeof delta === "number" && (
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                delta >= 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              <motion.div
                animate={{ 
                  y: delta >= 0 ? [-1, 0, -1] : [1, 0, 1] 
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {delta >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
              </motion.div>
              {Math.abs(delta)}%
            </motion.div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="text-white">
          <p className="text-xs font-bold text-white/80 mb-1 tracking-wide uppercase">
            {label}
          </p>
          <motion.p 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-xl lg:text-2xl font-black text-white mb-1 break-words"
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-white/70 flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={false}
      />
    </motion.div>
  );
}