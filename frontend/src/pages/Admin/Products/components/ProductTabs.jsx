import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Plus,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useProductData } from '../context/ProductDataContext';
import SalesTab from './tabs/SalesTab';
import PurchasesTab from './tabs/PurchasesTab';
import StockMovementsTab from './tabs/StockMovementsTab';

const TabButton = memo(({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  count, 
  onClick,
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-green-600',
    purple: 'from-purple-500 to-violet-600'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(id)}
      className={`relative w-full justify-center min-w-0 flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl font-medium transition-all duration-300 text-sm ${
        isActive
          ? `bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`
          : 'bg-white/60 hover:bg-white/80 text-gray-700 hover:text-gray-900 border border-gray-200/50'
      }`}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
      <span className="truncate max-w-[8rem] sm:max-w-[10rem]">{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${
          isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
      
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-10"
          style={{ background: `linear-gradient(to right, ${colorClasses[color]})` }}
        />
      )}
    </motion.button>
  );
});

const ProductTabs = memo(({ onAddNewSale, onAddNewPurchase, onEditSale, onDeleteSale, onEditPurchase, onDeletePurchase }) => {
  const [activeTab, setActiveTab] = useState('sales');
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    product,
    sales,
    purchases,
    stockMovements,
    isLoading,
    refreshData
  } = useProductData();

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const handleExport = useCallback(() => {
    // This would be implemented based on the active tab
    console.log(`Exporting ${activeTab} data...`);
  }, [activeTab]);

  const handleAddNew = useCallback(() => {
    if (activeTab === 'sales') {
      onAddNewSale?.();
    } else if (activeTab === 'purchases') {
      onAddNewPurchase?.();
    } else {
      console.log(`Adding new ${activeTab} record...`);
    }
  }, [activeTab, onAddNewSale, onAddNewPurchase]);

  const tabs = [
    {
      id: 'sales',
      label: 'Sales',
      icon: ShoppingCart,
      color: 'green',
      count: sales?.length || 0,
      component: SalesTab
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: Package,
      color: 'blue',
      count: purchases?.length || 0,
      component: PurchasesTab
    },
    {
      id: 'stock',
      label: 'Stock Movements',
      icon: TrendingUp,
      color: 'purple',
      count: stockMovements?.length || 0,
      component: StockMovementsTab
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  if (!product) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"
    >
      {/* Tab Header */}
      <div className="p-4 border-b border-gray-200/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Tab Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full min-w-0">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                color={tab.color}
                count={tab.count}
                isActive={activeTab === tab.id}
                onClick={handleTabChange}
              />
            ))}
          </div>

          {/* Tab Actions */}
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleFilters}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showFilters
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title="Toggle filters"
            >
              <Filter className="h-5 w-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-200"
              title="Export data"
            >
              <Download className="h-5 w-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddNew}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 text-sm"
              title={`Add new ${activeTab.slice(0, -1)}`}
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add New</span>
            </motion.button>
          </div>
        </div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-200/50 overflow-hidden"
            >
              <div className="flex flex-wrap gap-3">
                <select className="px-3 py-2 bg-white/60 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>

                <select className="px-3 py-2 bg-white/60 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Amounts</option>
                  <option value="0-100">$0 - $100</option>
                  <option value="100-500">$100 - $500</option>
                  <option value="500-1000">$500 - $1000</option>
                  <option value="1000+">$1000+</option>
                </select>

                <input
                  type="text"
                  placeholder="Search by reference..."
                  className="px-3 py-2 bg-white/60 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-medium transition-colors duration-200"
                >
                  Clear Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {ActiveComponent && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ActiveComponent 
                productId={product.id}
                showFilters={showFilters}
                onEditSale={onEditSale}
                onDeleteSale={onDeleteSale}
                onEditPurchase={onEditPurchase}
                onDeletePurchase={onDeletePurchase}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

ProductTabs.displayName = 'ProductTabs';
TabButton.displayName = 'TabButton';

export default ProductTabs;