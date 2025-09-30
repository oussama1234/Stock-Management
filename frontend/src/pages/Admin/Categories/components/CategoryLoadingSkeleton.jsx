// src/pages/Admin/Categories/components/CategoryLoadingSkeleton.jsx
// Beautiful animated loading skeleton for categories
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Package, BarChart3, TrendingUp, Users } from 'lucide-react';

const CategoryLoadingSkeleton = memo(function CategoryLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse bg-size-200 bg-pos-0"></div>
          <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
        </div>
        <div className="h-12 w-36 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded-xl animate-pulse bg-size-200 bg-pos-0"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[Package, BarChart3, TrendingUp, Users].map((Icon, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse">
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
            </div>
            <div className="h-8 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded mb-2 animate-pulse bg-size-200 bg-pos-0"></div>
            <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
          </motion.div>
        ))}
      </div>

      {/* Search and filters skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="h-10 flex-1 max-w-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-pulse bg-size-200 bg-pos-0"></div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-pulse bg-size-200 bg-pos-0"></div>
            <div className="h-10 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-pulse bg-size-200 bg-pos-0"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        {/* Table header skeleton */}
        <div className="bg-gray-50/80 p-4 border-b border-gray-100">
          <div className="grid grid-cols-6 gap-4">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
          </div>
        </div>

        {/* Table rows skeleton */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4"
            >
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded-xl animate-pulse bg-size-200 bg-pos-0"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
                    <div className="h-3 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse bg-size-200 bg-pos-0"></div>
                <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
                <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
                <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse bg-size-200 bg-pos-0"></div>
                <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse bg-size-200 bg-pos-0"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-pulse {
          animation: shimmer 2s ease-in-out infinite;
        }
        .bg-size-200 { background-size: 200% 200%; }
        .bg-pos-0 { background-position: 0% 50%; }
      `}</style>
    </div>
  );
});

export default CategoryLoadingSkeleton;