// src/pages/Admin/Purchases/PurchasesDebug.jsx
// Debugging version that adds components step by step

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  BarChart3, 
  Plus, 
  Download, 
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  Package,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

import usePurchasesData from "./usePurchasesData";
import usePagination from "@/components/pagination/usePagination";

// Import child components for testing
import PurchasesStats from "./components/PurchasesStats";
import PurchasesFilters from "./components/PurchasesFilters";
import PurchasesTable from "./components/PurchasesTable";
// Don't import PurchaseModal yet as it's only used conditionally

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

export default function PurchasesDebug() {
  console.log("🎯 PurchasesDebug component rendering");

  // Local UI state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [step, setStep] = useState(1); // Control which components to show
  
  const { currentPage, perPage, setPage, setPerPage, generatePages } = usePagination({ 
    initialPage: 1, 
    initialPerPage: 20 
  });

  // Combine search and filters for API call
  const apiParams = useMemo(() => ({
    page: currentPage,
    per_page: perPage,
    search,
    ...filters
  }), [currentPage, perPage, search, filters]);

  // Data fetching with caching (TTL 30s) and server pagination
  const { data: purchases, meta, loading, error, refetch } = usePurchasesData(apiParams);

  // Derived, stable utilities
  const pageList = useMemo(() => generatePages(meta?.last_page || 1), [generatePages, meta?.last_page]);
  const formatCurrency = useCallback((n) => 
    new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD" 
    }).format(Number(n || 0)), []
  );

  console.log("🔍 PurchasesDebug data:", { 
    purchasesCount: purchases?.length, 
    loading, 
    error,
    step
  });

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto p-6"
      >
        <div className="flex justify-between items-center mb-8">
          <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg"
          >
            <ShoppingBag className="h-8 w-8 text-white" />
          </motion.div>
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-40 animate-pulse"></div>
        </div>
        <div className="text-center">Loading purchases...</div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-7xl mx-auto p-6"
      >
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 text-rose-700 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              ❌
            </motion.div>
            <span className="ml-2 font-medium">{error}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto p-6 space-y-8"
    >
      {/* Debug Controls */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Controls</h3>
        <p className="text-yellow-700 text-sm mb-2">Current step: {step}</p>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5, 6, 7].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-3 py-1 rounded text-sm ${
                step === s 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
              }`}
            >
              Step {s}
            </button>
          ))}
        </div>
        <div className="text-xs text-yellow-600 mt-2">
          Step 1: Header | Step 2: Data | Step 3: PurchasesStats | Step 4: Basic Table | Step 5: PurchasesFilters | Step 6: PurchasesTable | Step 7: All
        </div>
      </div>

      {/* Step 1: Header Only */}
      {step >= 1 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <motion.div 
              whileHover={{ 
                rotate: [0, -5, 5, 0],
                scale: 1.05 
              }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl mr-4 shadow-lg"
            >
              <ShoppingBag className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
              >
                Purchases (Debug Step {step})
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mt-1 flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2 text-emerald-500" />
                Manage supplier purchases and inventory
              </motion.p>
            </div>
          </div>

          <motion.div
            variants={itemVariants}
            className="flex items-center space-x-3"
          >
            <Link
              to="/dashboard/purchases/analytics"
              className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <BarChart3 className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Analytics
            </Link>
          </motion.div>
        </motion.div>
      )}

      {/* Step 2: Add Basic Data Display */}
      {step >= 2 && (
        <motion.div variants={itemVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Data (Step 2)</h2>
            <p>Total purchases: {purchases?.length || 0}</p>
            <p>Meta total: {meta?.total || 0}</p>
            <p>Current page: {meta?.current_page || 1}</p>
            <p>Last page: {meta?.last_page || 1}</p>
          </div>
        </motion.div>
      )}

      {/* Step 3: Test PurchasesStats Component */}
      {step >= 3 && (
        <motion.div variants={itemVariants}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">Testing PurchasesStats Component</h3>
          </div>
          <PurchasesStats purchases={purchases} meta={meta} />
        </motion.div>
      )}

      {/* Step 4: Add Basic Table */}
      {step >= 4 && (
        <motion.div variants={itemVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Purchase Records (Step 4)</h3>
                </div>
                <div className="text-sm text-gray-500">
                  {meta?.total || 0} total purchases
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/60">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Supplier</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases && purchases.slice(0, 5).map((purchase) => (
                      <tr key={purchase.id} className="border-b border-gray-100">
                        <td className="px-6 py-4 text-sm">{purchase.id}</td>
                        <td className="px-6 py-4 text-sm">{purchase.purchase_date}</td>
                        <td className="px-6 py-4 text-sm">{purchase.supplier?.name}</td>
                        <td className="px-6 py-4 text-sm">{formatCurrency(purchase.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 5: Test PurchasesFilters Component */}
      {step >= 5 && (
        <motion.div variants={itemVariants}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">Testing PurchasesFilters Component</h3>
          </div>
          <PurchasesFilters
            onSearch={(v) => console.log('Search:', v)}
            onNewPurchase={() => console.log('New Purchase clicked')}
            onFiltersChange={(f) => console.log('Filters:', f)}
            onExport={() => console.log('Export clicked')}
            isExporting={false}
          />
        </motion.div>
      )}

      {/* Step 6: Test PurchasesTable Component */}
      {step >= 6 && (
        <motion.div variants={itemVariants}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">Testing PurchasesTable Component</h3>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="p-6">
              <PurchasesTable
                rows={purchases}
                onEdit={(p) => console.log('Edit:', p)}
                onDelete={(p) => console.log('Delete:', p)}
                formatCurrency={formatCurrency}
                formatDate={(iso) => new Date(iso).toLocaleDateString()}
                onSort={(col, order) => console.log('Sort:', col, order)}
                sortBy="purchase_date"
                sortOrder="desc"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 7: All Components Together */}
      {step >= 7 && (
        <motion.div variants={itemVariants}>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">All Components Working!</h3>
            <p className="text-green-700">If you see this, all components are working fine.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}