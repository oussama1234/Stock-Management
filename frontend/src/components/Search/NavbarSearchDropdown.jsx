// src/components/Search/NavbarSearchDropdown.jsx
// Lightweight search dropdown component specifically designed for navbar use
import React, { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, TrendingUp, ShoppingCart, Users, Building, 
  ArrowRight, Loader2, Search
} from 'lucide-react'

// Entity type to icon mapping
const entityIcons = {
  products: Package,
  sales: TrendingUp,
  purchases: ShoppingCart,
  customers: Users,
  suppliers: Building,
  movements: Package,
  reasons: Package,
}

// Entity type to color mapping
const entityColors = {
  products: 'text-blue-600 bg-blue-50',
  sales: 'text-green-600 bg-green-50',
  purchases: 'text-purple-600 bg-purple-50',
  customers: 'text-orange-600 bg-orange-50',
  suppliers: 'text-indigo-600 bg-indigo-50',
  movements: 'text-cyan-600 bg-cyan-50',
  reasons: 'text-pink-600 bg-pink-50',
}

// Individual result item component
const SearchResultItem = memo(({ entity, item, isSelected, onSelect, onHover, itemKey }) => {
  const Icon = entityIcons[entity] || Package
  const colorClasses = entityColors[entity] || 'text-gray-600 bg-gray-50'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-50 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
      onClick={() => onSelect({ entity, item, action: 'navigate' })}
      onMouseEnter={() => onHover(itemKey)}
    >
      <div className={`p-2 rounded-lg ${colorClasses}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {item?.name || item?.customer_name || item?.title || item?.username || item?.supplier_name || 'Untitled'}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {entity === 'products' && `Stock: ${item?.stock || 0} • Category: ${item?.category || 'N/A'}`}
          {entity === 'sales' && `Amount: $${item?.total_amount || 0} • Date: ${item?.sale_date || 'N/A'}`}
          {entity === 'purchases' && `Amount: $${item?.total_amount || 0} • Supplier: ${item?.supplier_name || 'N/A'}`}
          {entity === 'customers' && `Last sale: ${item?.last_sale_date || 'N/A'}`}
          {entity === 'suppliers' && `Contact: ${item?.phone || item?.email || 'N/A'}`}
          {entity === 'users' && `Role: ${item?.role || 'N/A'} • Email: ${item?.email || 'N/A'}`}
          {(entity === 'movements' || entity === 'reasons') && (item?.description || 'No description')}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400" />
    </motion.div>
  )
})

// Section header component
const SectionHeader = memo(({ title, count, entity }) => {
  const Icon = entityIcons[entity] || Package
  const colorClasses = entityColors[entity] || 'text-gray-600 bg-gray-50'
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
      <div className={`p-1.5 rounded ${colorClasses}`}>
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {title} ({count})
      </span>
    </div>
  )
})

// Main navbar search dropdown component
const NavbarSearchDropdown = memo(({ 
  visible, 
  term, 
  loading, 
  results, 
  selectedKey, 
  onHoverItem, 
  onSelectItem, 
  onViewAll 
}) => {
  if (!visible) return null

  // Debug logging
  console.log('NavbarSearchDropdown - Results:', results)
  console.log('NavbarSearchDropdown - Term:', term)

  // Handle different data structures
  let processedResults = results
  if (results && results.results) {
    // If results are nested under a 'results' key
    processedResults = results.results
  }
  
  const hasResults = processedResults && Object.keys(processedResults).some(key => {
    const data = processedResults[key]?.data || processedResults[key]
    return Array.isArray(data) && data.length > 0
  })
  const totalResults = hasResults ? Object.keys(processedResults).reduce((sum, key) => {
    const data = processedResults[key]?.data || processedResults[key]
    return sum + (Array.isArray(data) ? data.length : 0)
  }, 0) : 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">Searching...</span>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              {term ? `No results found for "${term}"` : 'Start typing to search...'}
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {/* Results by entity */}
            {Object.entries(processedResults).map(([entity, entityResults]) => {
              const items = entityResults?.data || entityResults || []
              if (!Array.isArray(items) || items.length === 0) return null
              
              const entityTitle = entity.charAt(0).toUpperCase() + entity.slice(1)
              
              return (
                <div key={entity}>
                  <SectionHeader 
                    title={entityTitle} 
                    count={items.length} 
                    entity={entity}
                  />
                  {items.slice(0, 3).map((item, index) => {
                    const itemKey = `${entity}:${item?.id || item?.user_id || item?.customer_id || item?.supplier_id || index}`
                    return (
                      <SearchResultItem
                        key={itemKey}
                        entity={entity}
                        item={item}
                        itemKey={itemKey}
                        isSelected={selectedKey === itemKey}
                        onSelect={onSelectItem}
                        onHover={onHoverItem}
                      />
                    )
                  })}
                </div>
              )
            })}
            
            {/* View all results button */}
            {hasResults && totalResults > 0 && (
              <div className="border-t p-3 bg-gray-50 dark:bg-gray-750">
                <button
                  onClick={onViewAll}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors duration-200"
                >
                  <Search className="w-4 h-4" />
                  View all {totalResults} results
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
})

export default NavbarSearchDropdown