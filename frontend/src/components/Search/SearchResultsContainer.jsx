// src/components/Search/SearchResultsContainer.jsx
// Main search results container with lazy loading, memoization, and performance optimizations
import React, { memo, useMemo, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import * as ReactWindow from 'react-window'; // Temporarily disabled
import { 
  Package, TrendingUp, ShoppingCart, Users, Truck, User,
  Building, Tag, MoreHorizontal, Filter, Eye, ChevronRight,
  Grid, List, SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { 
  ProductCard, SaleCard, PurchaseCard, MovementCard,
  UserCard, SupplierCard, CustomerCard, ReasonCard, CategoryCard
} from './ResultCards';

// Section header component
const SectionHeader = memo(({ title, count, icon: Icon, color, onViewAll, isExpanded, onToggle }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex items-center justify-between p-4 rounded-t-2xl bg-gradient-to-r ${color} backdrop-blur-sm`}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-white/20 shadow-lg">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-white/80 text-sm">{count} result{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-2">
      {count > 0 && onViewAll && (
        <button
          onClick={onViewAll}
          className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      )}
      
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </button>
      )}
    </div>
  </motion.div>
));

// Empty state component
const EmptyState = memo(({ icon: Icon, title, description, actionText, onAction }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
  >
    <Icon className="w-16 h-16 text-gray-300 mb-4" />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-md">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
      >
        {actionText}
      </button>
    )}
  </motion.div>
));

// Loading skeleton for results
const ResultsSkeleton = memo(({ count = 6 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse"
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
));

// Virtual list item renderer
const VirtualListItem = memo(({ index, style, data }) => {
  const { items, CardComponent, onAction } = data;
  const item = items[index];
  
  if (!item) return null;

  return (
    <div style={style} className="px-2 py-1">
      <CardComponent {...{ [getItemProp(CardComponent)]: item }} onAction={onAction} />
    </div>
  );
});

// Helper to get the correct prop name for each card component
const getItemProp = (CardComponent) => {
  const propMap = {
    ProductCard: 'product',
    SaleCard: 'sale', 
    PurchaseCard: 'purchase',
    MovementCard: 'movement',
    UserCard: 'user',
    SupplierCard: 'supplier',
    CustomerCard: 'customer',
    ReasonCard: 'reason',
    CategoryCard: 'category'
  };
  
  // Handle memoized components - try displayName, then name, then type.name
  const componentName = CardComponent.displayName || CardComponent.name || CardComponent.type?.name;
  console.log('getItemProp - CardComponent.name:', CardComponent.name, 'displayName:', CardComponent.displayName, 'type.name:', CardComponent.type?.name, 'using:', componentName, 'mapped to:', propMap[componentName] || 'item');
  
  return propMap[componentName] || 'item';
};

// Result section component
const ResultSection = memo(({ 
  title, 
  items = [], 
  CardComponent, 
  color,
  icon,
  onAction,
  onViewAll,
  maxItems = 6,
  useVirtualization = false,
  collapsible = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Always start expanded
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  
  console.log(`ResultSection ${title}: items=${items.length}, collapsible=${collapsible}, isExpanded=${isExpanded}`);
  
  const displayItems = useMemo(() => {
    if (!isExpanded) return [];
    return items.slice(0, useVirtualization ? items.length : maxItems);
  }, [items, isExpanded, maxItems, useVirtualization]);

  const shouldUseVirtual = false; // Temporarily disabled virtualization
  
  const handleAction = useCallback((item, action) => {
    onAction?.(item, action, title.toLowerCase());
  }, [onAction, title]);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <SectionHeader
        title={title}
        count={items.length}
        icon={icon}
        color={color}
        onViewAll={items.length > maxItems ? onViewAll : null}
        isExpanded={isExpanded}
        onToggle={collapsible ? () => setIsExpanded(!isExpanded) : null}
      />
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {/* View Mode Toggle */}
              {displayItems.length > 3 && (
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Showing {displayItems.length} of {items.length}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 transition-colors ${
                          viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 transition-colors ${
                          viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {shouldUseVirtual ? (
                <ReactWindow.FixedSizeList
                  height={Math.min(600, displayItems.length * 120)}
                  itemCount={displayItems.length}
                  itemSize={120}
                  itemData={{
                    items: displayItems,
                    CardComponent,
                    onAction: handleAction
                  }}
                  className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                >
                  {VirtualListItem}
                </ReactWindow.FixedSizeList>
              ) : (
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }
                `}>
                  {displayItems.map((item, index) => (
                    <motion.div
                      key={item.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CardComponent 
                        {...(() => {
                          const propName = getItemProp(CardComponent);
                          const props = { [propName]: item };
                          console.log('Rendering card with props:', { propName, item, props });
                          return props;
                        })()} 
                        onAction={handleAction}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Show More Button */}
              {!useVirtualization && items.length > maxItems && (
                <div className="mt-6 text-center">
                  <button
                    onClick={onViewAll}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Show {items.length - maxItems} More
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Main search results container
const SearchResultsContainer = memo(({ 
  searchResults, 
  searchQuery,
  isLoading, 
  onAction,
  onRefresh,
  className = ""
}) => {
  const [globalViewMode, setGlobalViewMode] = useState('sections'); // sections or unified
  const [sortBy, setSortBy] = useState('relevance'); // relevance, date, name
  const [filterBy, setFilterBy] = useState('all'); // all, recent, favorites
  
  // Memoized sections configuration
  const sections = useMemo(() => [
    {
      key: 'products',
      title: 'Products',
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
      CardComponent: ProductCard,
      maxItems: 6,
      useVirtualization: true,
      collapsible: true
    },
    {
      key: 'sales',
      title: 'Sales',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      CardComponent: SaleCard,
      maxItems: 4,
      collapsible: true
    },
    {
      key: 'purchases', 
      title: 'Purchases',
      icon: ShoppingCart,
      color: 'from-orange-500 to-red-600',
      CardComponent: PurchaseCard,
      maxItems: 4,
      collapsible: true
    },
    {
      key: 'movements',
      title: 'Stock Movements',
      icon: RefreshCw,
      color: 'from-purple-500 to-pink-600',
      CardComponent: MovementCard,
      maxItems: 6,
      collapsible: true
    },
    {
      key: 'users',
      title: 'Users',
      icon: User,
      color: 'from-blue-500 to-cyan-600',
      CardComponent: UserCard,
      maxItems: 4,
      collapsible: true
    },
    {
      key: 'suppliers',
      title: 'Suppliers',
      icon: Truck,
      color: 'from-purple-500 to-indigo-600',
      CardComponent: SupplierCard,
      maxItems: 4,
      collapsible: true
    },
    {
      key: 'customers',
      title: 'Customers',
      icon: Users,
      color: 'from-teal-500 to-green-600',
      CardComponent: CustomerCard,
      maxItems: 4,
      collapsible: true
    },
    {
      key: 'reasons',
      title: 'Movement Reasons',
      icon: Tag,
      color: 'from-gray-500 to-slate-600',
      CardComponent: ReasonCard,
      maxItems: 6,
      collapsible: true
    },
    {
      key: 'categories',
      title: 'Categories',
      icon: Building,
      color: 'from-indigo-500 to-purple-600',
      CardComponent: CategoryCard,
      maxItems: 4,
      collapsible: true
    }
  ], []);

  // Memoized results processing
  const processedResults = useMemo(() => {
    console.log('SearchResultsContainer - searchResults:', searchResults);
    
    if (!searchResults) return {};
    
    // Handle different data structures
    let dataSource = searchResults;
    if (searchResults.results) {
      dataSource = searchResults.results;
    }
    
    const results = {};
    sections.forEach(section => {
      // Try multiple data access patterns
      let data = dataSource[section.key]?.data || dataSource[section.key] || [];
      
      console.log(`Processing ${section.key}:`, data);
      
      results[section.key] = Array.isArray(data) ? data : [];
    });
    
    console.log('SearchResultsContainer - processedResults:', results);
    return results;
  }, [searchResults, sections]);

  // Check if we have any results
  const hasResults = useMemo(() => {
    return Object.values(processedResults).some(items => items.length > 0);
  }, [processedResults]);

  // Handle section view all
  const handleViewAll = useCallback((sectionKey) => {
    console.log(`View all ${sectionKey}`);
    // TODO: Navigate to dedicated page or open modal
  }, []);

  // Loading state
  if (isLoading && !searchResults) {
    return (
      <div className={`space-y-8 ${className}`}>
        <ResultsSkeleton count={8} />
      </div>
    );
  }

  // No search query
  if (!searchQuery) {
    return (
      <div className={className}>
        <EmptyState
          icon={Package}
          title="Ready to Search"
          description="Enter a search term above to find products, sales, customers, and more across your inventory system."
        />
      </div>
    );
  }

  // No results
  if (!hasResults) {
    return (
      <div className={className}>
        <EmptyState
          icon={Package}
          title="No Results Found"
          description={`We couldn't find anything matching "${searchQuery}". Try different keywords or check your spelling.`}
          actionText="Clear Search"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            Search Results ({Object.values(processedResults).reduce((sum, items) => sum + items.length, 0)})
          </h2>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Updating...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Refresh Results"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Sections */}
      <div className="space-y-8">
        {sections.map(section => {
          const items = processedResults[section.key] || [];
          console.log(`Section ${section.key}: ${items.length} items, collapsible: ${section.collapsible}`);
          if (items.length === 0) return null;

          return (
            <ResultSection
              key={section.key}
              title={section.title}
              items={items}
              CardComponent={section.CardComponent}
              color={section.color}
              icon={section.icon}
              onAction={onAction}
              onViewAll={() => handleViewAll(section.key)}
              maxItems={section.maxItems}
              useVirtualization={section.useVirtualization}
              collapsible={section.collapsible}
            />
          );
        })}
      </div>
    </div>
  );
});

export default SearchResultsContainer;