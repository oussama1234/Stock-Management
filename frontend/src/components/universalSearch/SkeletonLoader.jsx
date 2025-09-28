import React, { memo } from 'react'

// Generic skeleton shimmer rows for async loading states
const SkeletonRow = () => (
  <div className="h-10 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse" />
)

const SkeletonLoader = memo(function SkeletonLoader({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  )
})

export default SkeletonLoader
