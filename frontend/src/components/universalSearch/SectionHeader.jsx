import React, { memo } from 'react'

const SectionHeader = memo(function SectionHeader({ icon: Icon, label, count = 0 }) {
  return (
    <div className="sticky top-0 z-10 -mx-2 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 bg-white/90 dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
        <Icon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
      </div>
      <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
        {label}
      </div>
      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{count}</span>
    </div>
  )
})

export default SectionHeader
