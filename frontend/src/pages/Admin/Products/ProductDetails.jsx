// ProductDetails.jsx - UNIFIED DATA ARCHITECTURE
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  DollarSign,
  Download,
  Edit,
  Eye,
  Info,
  Package,
  Plus,
  Printer,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useEffect, useState, createContext, useContext, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCategoriesQuery } from "../../../GraphQL/Categories/Queries/Categories";
import { useUpdateProductMutation } from "../../../GraphQL/Products/Mutations/UpdateProduct";
import { useGetProductQuery } from "../../../GraphQL/Products/Queries/Products";
import { usePaginatedPurchaseItemsByProductQuery } from "../../../GraphQL/PurchaseItem/Queries/PaginatedPurchaseItemsByProduct";
import { useCreateSaleItemMutation } from "../../../GraphQL/SaleItem/Mutations/CreateSaleItem";
import { usePaginatedSaleItemsByProductQuery } from "../../../GraphQL/SaleItem/Queries/PaginatedSaleItemsByProduct";
import { usePaginatedStockMovementsByProductQuery } from "../../../GraphQL/StockMovement/Queries/PaginatedStockMovementsByProduct";
import ContentSpinner from "../../../components/Spinners/ContentSpinner";
import { useToast } from "../../../components/Toaster/ToastContext";
import { ProductModal } from "./Products";
import PurchaseModal from "../Purchases/components/PurchaseModal";
import SaleModal from "../Sales/components/SaleModal";
import { createPurchase } from "../../../api/Purchases";
import { createSale } from "../../../api/Sales";
import useStockValidation from "../../../hooks/useStockValidation";

// ========== UNIFIED DATA CONTEXT ==========
const ProductDataContext = createContext(null);

// Custom hook to use product data context
const useProductData = () => {
  const context = useContext(ProductDataContext);
  if (!context) {
    throw new Error('useProductData must be used within ProductDataProvider');
  }
  return context;
};

// ========== CENTRALIZED DATA PROVIDER ==========
const ProductDataProvider = ({ children, productId }) => {
  const toast = useToast();
  
  // Convert productId to integer for GraphQL queries
  const productIdInt = parseInt(productId, 10);
  
  // Validate productId conversion
  if (isNaN(productIdInt) || productIdInt <= 0) {
    throw new Error('Invalid product ID provided');
  }
  
  // Use ref for manual refresh lock to avoid dependency cycles
  const manualRefreshLock = useRef(false);
  
  // ===== UNIFIED STATE =====
  const [unifiedData, setUnifiedData] = useState({
    product: null,
    sales: [],
    purchases: [],
    stockMovements: [],
    analytics: {
      totalSalesCount: 0,
      totalPurchasesCount: 0,
      totalSalesValue: 0,
      totalPurchaseValue: 0,
      profitValue: 0,
      profitPercentage: 0,
      salesVelocity: 0,
      salesHighlight: 'Loading analytics...'
    },
    loading: {
      product: false,
      sales: false,
      purchases: false,
      stockMovements: false
    },
    lastUpdated: Date.now(),
    refreshKey: 0, // Force re-render when incremented
    isRefreshing: false // Show refresh indicator
  });
  
  // ===== GRAPHQL QUERIES (SINGLE SOURCE) =====
  const {
    data: productData,
    loading: productLoading,
    refetch: refetchProduct,
  } = useGetProductQuery(productIdInt);
  
  const {
    data: salesData,
    loading: salesLoading,
    refetch: refetchSales,
  } = usePaginatedSaleItemsByProductQuery(productIdInt, 1, 100);
  
  const {
    data: purchasesData,
    loading: purchasesLoading,
    refetch: refetchPurchases,
  } = usePaginatedPurchaseItemsByProductQuery(productIdInt, 1, 100);
  
  const {
    data: stockMovementsData,
    loading: stockMovementsLoading,
    refetch: refetchStockMovements,
  } = usePaginatedStockMovementsByProductQuery(productIdInt, 1, 100);
  
  // ===== ANALYTICS CALCULATOR =====
  const calculateAnalytics = useCallback((salesArray = [], purchasesArray = []) => {
    
    const totalSalesValue = salesArray.reduce((total, saleItem) => {
      // Use the same proportional calculation logic as the backend AnalyticsService
      let itemRevenue = 0;
      
      if (saleItem.sale?.total_amount && saleItem.sale?.items) {
        // Calculate proportional share of sale total_amount
        // This matches the backend logic exactly
        const saleTotal = saleItem.sale.total_amount;
        const allItemsValue = saleItem.sale.items.reduce((sum, item) => {
          return sum + (item.quantity * item.price);
        }, 0);
        
        if (allItemsValue > 0) {
          // Proportional share: (this_item_value / all_items_value) * sale_total
          const thisItemValue = saleItem.quantity * saleItem.price;
          itemRevenue = (thisItemValue / allItemsValue) * saleTotal;
        } else {
          // Fallback to simple calculation
          itemRevenue = saleItem.quantity * saleItem.price;
        }
      } else {
        // Fallback when sale data is incomplete
        itemRevenue = saleItem.quantity * saleItem.price;
      }
      
      return total + (itemRevenue || 0);
    }, 0);
    
    const totalPurchaseValue = purchasesArray.reduce((total, purchase) => {
      const purchaseTotal = purchase.purchase?.total_amount || (purchase.quantity * purchase.price);
      return total + (purchaseTotal || 0);
    }, 0);
    
    const profitValue = totalSalesValue - totalPurchaseValue;
    const profitPercentage = totalSalesValue > 0 ? ((profitValue / totalSalesValue) * 100) : 0;
    
    // Sales velocity calculation
    const totalSold = salesArray.reduce((total, sale) => total + (sale.quantity || 0), 0);
    let salesVelocity = 0;
    
    if (salesArray.length > 0 && totalSold > 0) {
      const validSales = salesArray
        .map(s => {
          const dateStr = s.sale?.sale_date || s.created_at;
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        })
        .filter(date => date !== null)
        .sort((a, b) => a - b);
        
      if (validSales.length >= 2) {
        const firstSaleDate = validSales[0];
        const lastSaleDate = validSales[validSales.length - 1];
        const diffMonths = Math.max(1, 
          (lastSaleDate.getFullYear() - firstSaleDate.getFullYear()) * 12 +
          (lastSaleDate.getMonth() - firstSaleDate.getMonth()) + 1
        );
        salesVelocity = Math.round(totalSold / diffMonths);
      } else {
        salesVelocity = totalSold; // Assume within last month
      }
    }
    
    return {
      totalSalesCount: salesArray.length,
      totalPurchasesCount: purchasesArray.length,
      totalSalesValue,
      totalPurchaseValue,
      profitValue,
      profitPercentage,
      salesVelocity,
      salesHighlight: salesVelocity > 0 
        ? `Sales velocity: ${salesVelocity} units/month` 
        : 'No significant sales activity'
    };
  }, []);
  
  // ===== UNIFIED DATA UPDATER =====
  const updateUnifiedData = useCallback(() => {
    // Check if manual refresh is in progress - if so, skip automatic updates
    if (manualRefreshLock.current) {
      return;
    }
    
    const newSales = salesData?.paginatedSaleItemsByProduct?.data || [];
    const newPurchases = purchasesData?.paginatedPurchaseItemsByProduct?.data || [];
    const newStockMovements = stockMovementsData?.paginatedStockMovementsByProduct?.data || [];
    const newProduct = productData?.productById;
    
    if (newProduct) {
      const newAnalytics = calculateAnalytics(newSales, newPurchases);
      
      setUnifiedData(prev => {
        const updated = {
          ...prev, // Preserve all previous state including refreshKey and isRefreshing
          product: {
            ...newProduct,
            category: newProduct.category?.name || prev.product?.category || 'Unknown',
            sku: newProduct.category?.name
              ? newProduct.category.name
                .split(" ")
                .map((word) => word.substring(0, 4).toUpperCase())
                .join("") +
              "-" +
              (newProduct.id < 10 ? "00" + newProduct.id : newProduct.id)
              : prev.product?.sku || 'N/A'
          },
          sales: newSales,
          purchases: newPurchases,
          stockMovements: newStockMovements,
          analytics: newAnalytics,
          loading: {
            product: productLoading,
            sales: salesLoading,
            purchases: purchasesLoading,
            stockMovements: stockMovementsLoading
          },
          lastUpdated: Date.now()
        };
        
        
        return updated;
      });
    }
  }, [productData, salesData, purchasesData, stockMovementsData, productLoading, salesLoading, purchasesLoading, stockMovementsLoading, calculateAnalytics]);
  
  // ===== AUTO-UPDATE WHEN DATA CHANGES =====
  useEffect(() => {
    // Skip automatic updates if manual refresh is in progress
    if (manualRefreshLock.current) {
      return;
    }
    updateUnifiedData();
  }, [updateUnifiedData]);
  
  // ===== SIMPLIFIED REFRESH (GraphQL queries now use network-only policy) =====
  const refreshAllData = useCallback(async () => {
    // Set refreshing state and lock automatic updates
    manualRefreshLock.current = true;
    setUnifiedData(prev => ({ 
      ...prev, 
      isRefreshing: true
    }));
    
    try {
      // Since GraphQL queries now use network-only policy, simple refetch is sufficient
      const promises = [
        refetchProduct(),
        refetchSales(),
        refetchPurchases(),
        refetchStockMovements()
      ];
      
      const results = await Promise.all(promises);
      
      // Extract fresh data from results
      const freshProduct = results[0]?.data?.productById;
      const freshSales = results[1]?.data?.paginatedSaleItemsByProduct?.data || [];
      const freshPurchases = results[2]?.data?.paginatedPurchaseItemsByProduct?.data || [];
      const freshStockMovements = results[3]?.data?.paginatedStockMovementsByProduct?.data || [];
      
      if (freshProduct) {
        // Calculate analytics with fresh data
        const freshAnalytics = calculateAnalytics(freshSales, freshPurchases);
        
        setUnifiedData(prev => {
          const updated = {
            ...prev,
            product: {
              ...freshProduct,
              category: freshProduct.category?.name || 'Unknown',
              sku: freshProduct.category?.name
                ? freshProduct.category.name
                  .split(" ")
                  .map((word) => word.substring(0, 4).toUpperCase())
                  .join("") +
                "-" +
                (freshProduct.id < 10 ? "00" + freshProduct.id : freshProduct.id)
                : 'N/A'
            },
            sales: freshSales,
            purchases: freshPurchases,
            stockMovements: freshStockMovements,
            analytics: freshAnalytics,
            refreshKey: prev.refreshKey + 1, // Force re-render
            lastUpdated: Date.now(),
            isRefreshing: false
          };
          
          // Release the manual refresh lock after a short delay
          setTimeout(() => {
            manualRefreshLock.current = false;
          }, 300);
          
          return updated;
        });
      }
      
      return true;
    } catch (error) {
      toast.error('Failed to refresh data: ' + (error.message || 'Unknown error'));
      
      // Clear refreshing state and release lock on error
      manualRefreshLock.current = false;
      setUnifiedData(prev => ({ 
        ...prev, 
        isRefreshing: false
      }));
      
      return false;
    }
  }, [refetchProduct, refetchSales, refetchPurchases, refetchStockMovements, toast, calculateAnalytics]);
  
  // ===== OPTIMISTIC UPDATE =====
  const optimisticUpdate = useCallback((updates) => {
    // Block optimistic updates during manual refresh
    if (manualRefreshLock.current) {
      return;
    }
    setUnifiedData(prev => {
      const updated = { ...prev };
      
      // Apply product updates
      if (updates.product) {
        updated.product = { ...prev.product, ...updates.product };
      }
      
      // Apply sales updates
      if (updates.sales) {
        if (updates.sales.add) {
          updated.sales = [updates.sales.add, ...prev.sales];
        }
      }
      
      // Recalculate analytics if sales or purchases changed
      if (updates.sales || updates.purchases) {
        updated.analytics = calculateAnalytics(updated.sales, updated.purchases);
      }
      
      updated.lastUpdated = Date.now();
      updated.refreshKey = prev.refreshKey + 1; // Force refresh
      return updated;
    });
  }, [calculateAnalytics]);
  
  // ===== CONTEXT VALUE =====
  const contextValue = {
    ...unifiedData,
    refreshAllData,
    optimisticUpdate,
    // Add raw loading states for more granular control
    rawLoading: {
      product: productLoading,
      sales: salesLoading,
      purchases: purchasesLoading,
      stockMovements: stockMovementsLoading
    }
  };
  
  return (
    <ProductDataContext.Provider value={contextValue}>
      <div key={unifiedData.refreshKey}>
        {children}
      </div>
    </ProductDataContext.Provider>
  );
};
// ========== MAIN PRODUCT DETAILS COMPONENT ==========
const ProductDetails = () => {
  const { id } = useParams();
  const productId = parseInt(id);
  
  return (
    <ProductDataProvider productId={productId}>
      <ProductDetailsContent />
    </ProductDataProvider>
  );
};

// Component for the unified overview tab - consumes context data
const UnifiedOverviewTab = ({ formatCurrency, formatDate }) => {
  const { product, sales, purchases, analytics, loading } = useProductData();
  const [salesPage, setSalesPage] = useState(0);
  const [purchasePage, setPurchasePage] = useState(0);
  
  const ITEMS_PER_PAGE = 3;
  
  // Calculate restock needed
  const getRestockNeeded = () => {
    const velocity = analytics?.salesVelocity || 0;
    const currentStock = product?.stock || 0;
    if (velocity <= 0) return 0;
    const monthsOfStock = currentStock / velocity;
    return monthsOfStock < 1 ? Math.max(0, velocity - currentStock) : 0;
  };
  
  const restockNeeded = getRestockNeeded();
  
  // Safe data access with proper fallbacks and debugging
  const getSafePrice = (item) => {
    // Try multiple possible price field combinations
    const totalPrice = item?.totalPrice || item?.total_price;
    const calculatedPrice = item?.quantity && item?.price ? item.quantity * item.price : null;
    const unitCalculated = item?.quantity && item?.unitPrice ? item.quantity * item.unitPrice : null;
    const salePrice = item?.sale?.total_amount;
    const purchasePrice = item?.purchase?.total_amount;
    
    const finalPrice = totalPrice || calculatedPrice || unitCalculated || salePrice || purchasePrice || 0;
    return isNaN(finalPrice) ? 0 : finalPrice;
  };
  
  const getSafeDate = (item) => {
    // Try multiple date fields
    const date = item?.createdAt || item?.created_at || item?.sale_date || item?.purchase_date || 
                 item?.sale?.sale_date || item?.purchase?.purchase_date || item?.date;
    
    if (!date || date === 'null' || date === 'undefined') {
      return new Date().toISOString();
    }
    return date;
  };
  
  const getSafeCustomer = (sale) => {
    // Try multiple customer name fields with better debugging
    const customerName = sale?.customer_name || sale?.customerName || sale?.customer?.name || 
                        sale?.sale?.customer_name || sale?.sale?.customer?.name;
    
    return customerName || 'Walk-in Customer';
  };
  
  const getSafeSupplier = (purchase) => {
    // Try multiple supplier name fields, ensuring we only get string values
    let supplierName = null;
    
    // Try direct string fields first
    if (purchase?.supplier_name && typeof purchase.supplier_name === 'string') {
      supplierName = purchase.supplier_name;
    } else if (purchase?.supplierName && typeof purchase.supplierName === 'string') {
      supplierName = purchase.supplierName;
    }
    // Try nested supplier object's name
    else if (purchase?.supplier?.name && typeof purchase.supplier.name === 'string') {
      supplierName = purchase.supplier.name;
    }
    // Try nested purchase object's supplier fields
    else if (purchase?.purchase?.supplier_name && typeof purchase.purchase.supplier_name === 'string') {
      supplierName = purchase.purchase.supplier_name;
    } else if (purchase?.purchase?.supplier?.name && typeof purchase.purchase.supplier.name === 'string') {
      supplierName = purchase.purchase.supplier.name;
    }
    // Try direct supplier field only if it's a string (not an object)
    else if (purchase?.supplier && typeof purchase.supplier === 'string') {
      supplierName = purchase.supplier;
    }
    // Try nested purchase supplier field only if it's a string (not an object)
    else if (purchase?.purchase?.supplier && typeof purchase.purchase.supplier === 'string') {
      supplierName = purchase.purchase.supplier;
    }
    
    return supplierName || 'Unknown Supplier';
  };
  
  // Paginated data
  const paginatedSales = sales?.slice(salesPage * ITEMS_PER_PAGE, (salesPage + 1) * ITEMS_PER_PAGE) || [];
  const paginatedPurchases = purchases?.slice(purchasePage * ITEMS_PER_PAGE, (purchasePage + 1) * ITEMS_PER_PAGE) || [];
  
  const maxSalesPages = Math.max(0, Math.ceil((sales?.length || 0) / ITEMS_PER_PAGE) - 1);
  const maxPurchasePages = Math.max(0, Math.ceil((purchases?.length || 0) / ITEMS_PER_PAGE) - 1);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 shadow-lg">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
            </div>
          </div>
          {loading.sales ? (
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded-lg mb-2"></div>
              <div className="h-4 bg-white/10 rounded-lg w-2/3"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(analytics?.totalSalesValue || 0)}
              </p>
              <p className="text-emerald-100 text-sm">
                From {sales?.length || 0} sales
              </p>
            </>
          )}
        </motion.div>

        {/* Profit Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm font-medium">Total Profit</p>
            </div>
          </div>
          {loading.sales || loading.purchases ? (
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded-lg mb-2"></div>
              <div className="h-4 bg-white/10 rounded-lg w-2/3"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(analytics?.profitValue || 0)}
              </p>
              <p className="text-blue-100 text-sm">
                Margin: {(analytics?.profitPercentage || 0).toFixed(1)}%
              </p>
            </>
          )}
        </motion.div>

        {/* Sales Velocity Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-purple-100 text-sm font-medium">Sales Velocity</p>
            </div>
          </div>
          {loading.sales ? (
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded-lg mb-2"></div>
              <div className="h-4 bg-white/10 rounded-lg w-2/3"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold mb-1">
                {(analytics?.salesVelocity || 0).toFixed(1)}
              </p>
              <p className="text-purple-100 text-sm">
                Units per month
              </p>
            </>
          )}
        </motion.div>

        {/* Restock Needed Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
            restockNeeded > 0 
              ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-500' 
              : 'bg-gradient-to-br from-green-400 via-green-500 to-green-600'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm font-medium">Restock Status</p>
            </div>
          </div>
          <>
            <p className="text-3xl font-bold mb-1">
              {restockNeeded > 0 ? Math.ceil(restockNeeded) : '✓'}
            </p>
            <p className="text-white/80 text-sm">
              {restockNeeded > 0 ? 'Units needed' : 'Stock adequate'}
            </p>
          </>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="bg-green-100 p-2 rounded-xl mr-3">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              Recent Sales
            </h3>
            {sales?.length > ITEMS_PER_PAGE && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSalesPage(Math.max(0, salesPage - 1))}
                  disabled={salesPage === 0}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {salesPage + 1} / {maxSalesPages + 1}
                </span>
                <button
                  onClick={() => setSalesPage(Math.min(maxSalesPages, salesPage + 1))}
                  disabled={salesPage >= maxSalesPages}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
          
          {loading.sales ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
              ))}
            </div>
          ) : paginatedSales.length > 0 ? (
            <div className="space-y-4">
              {paginatedSales.map((sale) => (
                <div key={sale.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-green-500 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-800">
                      {getSafeCustomer(sale)}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(getSafePrice(sale))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">
                      Qty: <span className="font-semibold">{sale.quantity}</span>
                    </div>
                    <div className="text-gray-500">
                      {formatDate(getSafeDate(sale))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No sales recorded yet</p>
            </div>
          )}
        </motion.div>

        {/* Recent Purchases */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="bg-blue-100 p-2 rounded-xl mr-3">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              Recent Purchases
            </h3>
            {purchases?.length > ITEMS_PER_PAGE && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPurchasePage(Math.max(0, purchasePage - 1))}
                  disabled={purchasePage === 0}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {purchasePage + 1} / {maxPurchasePages + 1}
                </span>
                <button
                  onClick={() => setPurchasePage(Math.min(maxPurchasePages, purchasePage + 1))}
                  disabled={purchasePage >= maxPurchasePages}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
          
          {loading.purchases ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
              ))}
            </div>
          ) : paginatedPurchases.length > 0 ? (
            <div className="space-y-4">
              {paginatedPurchases.map((purchase) => (
                <div key={purchase.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-l-4 border-blue-500 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-800">
                      {getSafeSupplier(purchase)}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(getSafePrice(purchase))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">
                      Qty: <span className="font-semibold">{purchase.quantity}</span>
                    </div>
                    <div className="text-gray-500">
                      {formatDate(getSafeDate(purchase))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No purchases recorded yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Component for the unified purchases tab - consumes context data
const UnifiedPurchasesTab = ({ formatCurrency, formatDate, onNewPurchase }) => {
  const { purchases, loading } = useProductData();
  
  // Manual pagination implementation
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalItems = purchases?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Clamp current page to valid range
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }
  
  // Calculate paginated data
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPurchases = purchases?.slice(startIndex, endIndex) || [];
  
  // Pagination controls
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  // Safe data access functions
  const getSafePrice = (purchase) => {
    const totalPrice = purchase?.totalPrice || purchase?.total_price;
    const calculatedPrice = purchase?.quantity && purchase?.price ? purchase.quantity * purchase.price : null;
    const unitCalculated = purchase?.quantity && purchase?.unitPrice ? purchase.quantity * purchase.unitPrice : null;
    const purchasePrice = purchase?.purchase?.total_amount;
    
    const finalPrice = totalPrice || calculatedPrice || unitCalculated || purchasePrice || 0;
    return isNaN(finalPrice) ? 0 : finalPrice;
  };

  const getSafeUnitPrice = (purchase) => {
    const unitPrice = purchase?.unitPrice || purchase?.unit_price || purchase?.price || 
                     (purchase?.totalPrice && purchase?.quantity ? purchase.totalPrice / purchase.quantity : null);
    return isNaN(unitPrice) || !unitPrice ? 0 : unitPrice;
  };

  const getSafeDate = (purchase) => {
    const date = purchase?.createdAt || purchase?.created_at || purchase?.purchase_date || 
                 purchase?.purchase?.purchase_date || purchase?.date;
    return date && date !== 'null' && date !== 'undefined' ? date : new Date().toISOString();
  };

  const getSafeSupplier = (purchase) => {
    // Try multiple supplier name fields, ensuring we only get string values
    let supplierName = null;
    
    // Try direct string fields first
    if (purchase?.supplier_name && typeof purchase.supplier_name === 'string') {
      supplierName = purchase.supplier_name;
    } else if (purchase?.supplierName && typeof purchase.supplierName === 'string') {
      supplierName = purchase.supplierName;
    }
    // Try nested supplier object's name
    else if (purchase?.supplier?.name && typeof purchase.supplier.name === 'string') {
      supplierName = purchase.supplier.name;
    }
    // Try nested purchase object's supplier fields
    else if (purchase?.purchase?.supplier_name && typeof purchase.purchase.supplier_name === 'string') {
      supplierName = purchase.purchase.supplier_name;
    } else if (purchase?.purchase?.supplier?.name && typeof purchase.purchase.supplier.name === 'string') {
      supplierName = purchase.purchase.supplier.name;
    }
    // Try direct supplier field only if it's a string (not an object)
    else if (purchase?.supplier && typeof purchase.supplier === 'string') {
      supplierName = purchase.supplier;
    }
    // Try nested purchase supplier field only if it's a string (not an object)
    else if (purchase?.purchase?.supplier && typeof purchase.purchase.supplier === 'string') {
      supplierName = purchase.purchase.supplier;
    }
    
    return supplierName || 'Not specified';
  };

  const getSafeStatus = (purchase) => {
    const status = purchase?.status || purchase?.purchase?.status;
    return status || 'Completed';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-2xl p-8 shadow-lg">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-2xl mr-4 shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Purchase History</h2>
            <p className="text-gray-600 mt-1">
              {totalItems} purchase{totalItems !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewPurchase}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Purchase
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading.purchases ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : paginatedPurchases.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {paginatedPurchases.map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-xl mr-3">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDate(getSafeDate(purchase))}
                      </p>
                      <p className="font-semibold text-gray-800">
                        {getSafeSupplier(purchase)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(getSafePrice(purchase))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Amount
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Quantity</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {purchase.quantity || 0} units
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Unit Price</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {formatCurrency(getSafeUnitPrice(purchase))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        getSafeStatus(purchase).toLowerCase() === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : getSafeStatus(purchase).toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getSafeStatus(purchase)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-gray-600">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-semibold">{totalItems}</span> purchases
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={!canGoPrev}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => goToPage(page)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))
                    }
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={!canGoNext}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <Package className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Purchases Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            This product has no purchase history yet. Start by adding your first purchase.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewPurchase}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            Add First Purchase
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

// Component for the unified sales tab - consumes context data
const UnifiedSalesTab = ({ formatCurrency, formatDate, onNewSale }) => {
  const { sales, loading } = useProductData();
  
  // Manual pagination implementation
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalItems = sales?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Clamp current page to valid range
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }
  
  // Calculate paginated data
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = sales?.slice(startIndex, endIndex) || [];
  
  // Pagination controls
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  // Safe data access functions
  const getSafePrice = (sale) => {
    const totalPrice = sale?.totalPrice || sale?.total_price;
    const calculatedPrice = sale?.quantity && sale?.price ? sale.quantity * sale.price : null;
    const unitCalculated = sale?.quantity && sale?.unitPrice ? sale.quantity * sale.unitPrice : null;
    const salePrice = sale?.sale?.total_amount;
    
    const finalPrice = totalPrice || calculatedPrice || unitCalculated || salePrice || 0;
    return isNaN(finalPrice) ? 0 : finalPrice;
  };

  const getSafeUnitPrice = (sale) => {
    const unitPrice = sale?.unitPrice || sale?.unit_price || sale?.price || 
                     (sale?.totalPrice && sale?.quantity ? sale.totalPrice / sale.quantity : null);
    return isNaN(unitPrice) || !unitPrice ? 0 : unitPrice;
  };

  const getSafeDate = (sale) => {
    const date = sale?.createdAt || sale?.created_at || sale?.sale_date || 
                 sale?.sale?.sale_date || sale?.date;
    return date && date !== 'null' && date !== 'undefined' ? date : new Date().toISOString();
  };

  const getSafeCustomer = (sale) => {
    // Try multiple customer name fields, ensuring we only get string values
    let customerName = null;
    
    // Try direct string fields first
    if (sale?.customer_name && typeof sale.customer_name === 'string') {
      customerName = sale.customer_name;
    } else if (sale?.customerName && typeof sale.customerName === 'string') {
      customerName = sale.customerName;
    }
    // Try nested customer object's name
    else if (sale?.customer?.name && typeof sale.customer.name === 'string') {
      customerName = sale.customer.name;
    }
    // Try nested sale object's customer fields
    else if (sale?.sale?.customer_name && typeof sale.sale.customer_name === 'string') {
      customerName = sale.sale.customer_name;
    } else if (sale?.sale?.customer?.name && typeof sale.sale.customer.name === 'string') {
      customerName = sale.sale.customer.name;
    }
    // Try direct customer field only if it's a string (not an object)
    else if (sale?.customer && typeof sale.customer === 'string') {
      customerName = sale.customer;
    }
    // Try nested sale customer field only if it's a string (not an object)
    else if (sale?.sale?.customer && typeof sale.sale.customer === 'string') {
      customerName = sale.sale.customer;
    }
    
    return customerName || 'Walk-in Customer';
  };

  const getSafeStatus = (sale) => {
    const status = sale?.status || sale?.sale?.status;
    return status || 'Completed';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl p-8 shadow-lg">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-2xl mr-4 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Sales History</h2>
            <p className="text-gray-600 mt-1">
              {totalItems} sale{totalItems !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewSale}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Sale
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading.sales ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : paginatedSales.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {paginatedSales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-xl mr-3">
                      <ShoppingCart className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDate(getSafeDate(sale))}
                      </p>
                      <p className="font-semibold text-gray-800">
                        {getSafeCustomer(sale)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(getSafePrice(sale))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Amount
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Quantity</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {sale.quantity || 0} units
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Unit Price</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {formatCurrency(getSafeUnitPrice(sale))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        getSafeStatus(sale).toLowerCase() === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : getSafeStatus(sale).toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : getSafeStatus(sale).toLowerCase() === 'refunded'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getSafeStatus(sale)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-gray-600">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-semibold">{totalItems}</span> sales
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={!canGoPrev}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => goToPage(page)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))
                    }
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={!canGoNext}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Sales Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            This product has no sales history yet. Start by recording your first sale.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewSale}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            Record First Sale
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

// Component for the unified stock history tab - consumes context data
const UnifiedStockHistoryTab = ({ formatDate }) => {
  const { product, stockMovements, loading } = useProductData();
  
  // Manual pagination implementation
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalItems = stockMovements?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Clamp current page to valid range
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }
  
  // Calculate paginated data
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMovements = stockMovements?.slice(startIndex, endIndex) || [];
  
  // Pagination controls
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  // Safe data access functions
  const getSafeDate = (movement) => {
    const date = movement?.createdAt || movement?.created_at || movement?.date;
    return date && date !== 'null' && date !== 'undefined' ? date : new Date().toISOString();
  };

  const getSafeQuantity = (movement) => {
    const qty = movement?.quantity || 0;
    return isNaN(qty) ? 0 : Math.abs(qty);
  };

  const getSafeBalance = (movement) => {
    const balance = movement?.balanceAfter || movement?.balance_after || movement?.balance;
    return isNaN(balance) || balance === null || balance === undefined ? 'Not tracked' : balance;
  };

  const getSafeReason = (movement) => {
    return movement?.reason || movement?.description || 'No reason specified';
  };

  const getSafeReference = (movement) => {
    return movement?.reference || movement?.reference_id || movement?.ref || null;
  };

  const getMovementTypeInfo = (type) => {
    const normalizedType = type?.toLowerCase() || 'unknown';
    
    switch (normalizedType) {
      case 'in':
      case 'purchase':
      case 'stock_in':
        return {
          color: 'from-green-400 to-emerald-500',
          bgColor: 'from-green-50 to-emerald-50',
          textColor: 'text-green-600',
          borderColor: 'border-green-500',
          icon: <TrendingUp className="w-5 h-5" />,
          label: 'Stock In',
          sign: '+'
        };
      case 'out':
      case 'sale':
      case 'stock_out':
        return {
          color: 'from-red-400 to-rose-500',
          bgColor: 'from-red-50 to-rose-50',
          textColor: 'text-red-600',
          borderColor: 'border-red-500',
          icon: <TrendingDown className="w-5 h-5" />,
          label: 'Stock Out',
          sign: '-'
        };
      case 'adjustment':
      case 'correction':
        return {
          color: 'from-yellow-400 to-orange-500',
          bgColor: 'from-yellow-50 to-orange-50',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-500',
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Adjustment',
          sign: '±'
        };
      default:
        return {
          color: 'from-gray-400 to-gray-500',
          bgColor: 'from-gray-50 to-slate-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-500',
          icon: <Activity className="w-5 h-5" />,
          label: 'Movement',
          sign: '±'
        };
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-8 shadow-lg">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-2xl mr-4 shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Stock Movement History</h2>
            <p className="text-gray-600 mt-1">
              {totalItems} movement{totalItems !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-6 py-3 shadow-lg border border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Current Stock</p>
            <p className="text-2xl font-bold text-purple-600">
              {product?.quantity || product?.stock || 0} units
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading.stockMovements ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : paginatedMovements.length > 0 ? (
        <>
          <div className="space-y-4 mb-8">
            {paginatedMovements.map((movement, index) => {
              const typeInfo = getMovementTypeInfo(movement.type);
              return (
                <motion.div
                  key={movement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gradient-to-r ${typeInfo.bgColor} rounded-2xl p-6 shadow-lg border-l-4 ${typeInfo.borderColor} hover:shadow-xl transition-all duration-300`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`bg-gradient-to-r ${typeInfo.color} p-3 rounded-xl text-white shadow-lg`}>
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`font-bold text-lg ${typeInfo.textColor}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            #{movement.id}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {formatDate(getSafeDate(movement))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${typeInfo.textColor} mb-1`}>
                        {typeInfo.sign}{getSafeQuantity(movement)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Balance: <span className="font-semibold">{getSafeBalance(movement)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Movement Details */}
                  <div className="bg-white/60 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reason</p>
                        <p className="font-medium text-gray-800">
                          {getSafeReason(movement)}
                        </p>
                      </div>
                      {getSafeReference(movement) && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Reference</p>
                          <p className="font-medium text-gray-800 font-mono text-sm">
                            {getSafeReference(movement)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-gray-600">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-semibold">{totalItems}</span> movements
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={!canGoPrev}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => goToPage(page)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))
                    }
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={!canGoNext}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <Activity className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Stock Movements Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            This product has no stock movement history yet. Stock movements will appear here when inventory changes occur.
          </p>
        </motion.div>
      )}
    </div>
  );
};

// ========== PRODUCT DETAILS CONTENT (USES CONTEXT) ==========
const ProductDetailsContent = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // ===== USE UNIFIED DATA =====
  const { 
    product, 
    sales, 
    purchases, 
    analytics, 
    loading, 
    rawLoading, 
    refreshAllData, 
    optimisticUpdate,
    lastUpdated,
    isRefreshing
  } = useProductData();

  // ===== SIMPLIFIED MODAL STATE =====
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: "",
    description: "",
    image: null,
    price: "",
    stock: "",
    category: null,
  });
  const [editErrors, setEditErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  const [isQuickSaleModalOpen, setIsQuickSaleModalOpen] = useState(false);
  const [quickSaleData, setQuickSaleData] = useState({
    customer_name: "",
    quantity: 1,
    price: "",
    tax: 0,
    discount: 0,
  });

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  
  // ===== CATEGORIES AND MUTATIONS =====
  const [loadCategories, { data: categoriesData, loading: loadingCategories }] =
    useCategoriesQuery();
  const { updateProduct, loading: updateProductLoading } =
    useUpdateProductMutation();
  const [categories, setCategories] = useState([]);

  // ===== LOAD CATEGORIES =====
  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData?.categories]);
  

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock < 10)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Not set';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Not set';
      }
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return 'Not set';
    }
  };

  // Helper function to get properly formatted image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
      return null;
    }
    
    // If it's already a full URL (starts with http), return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's a relative path, construct the full URL
    // This assumes the backend serves images from the storage/app/public directory
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    // Handle different path formats
    if (imageUrl.startsWith('/storage/')) {
      return `${backendUrl}${imageUrl}`;
    } else if (imageUrl.startsWith('storage/')) {
      return `${backendUrl}/${imageUrl}`;
    } else {
      return `${backendUrl}/storage/${imageUrl}`;
    }
  };

  // Edit Product Modal Functions
  const openEditModal = () => {
    if (!product) return;

    
    // Load categories first if needed
    if (categories.length === 0) {
      loadCategories();
    }
    
    // Set basic form data first (category will be set when categories are ready)
    setEditFormData({
      id: product.id,
      name: product.name,
      description: product.description || "",
      image: product.image,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: "", // Will be set by useEffect below
    });
    
    setImagePreview(getImageUrl(product.image));
    setEditErrors({});
    setIsEditModalOpen(true);
  };
  
  // Update category in form data when both product and categories are available
  useEffect(() => {
    if (isEditModalOpen && product && categories.length > 0) {
      
      let categoryValue = "";
      
      if (typeof product.category === 'string') {
        // If category is a string, find the matching category ID
        const matchingCategory = categories.find(cat => cat.name === product.category);
        categoryValue = matchingCategory ? matchingCategory.id.toString() : "";
      } else if (product.category?.id) {
        // If category is an object with ID
        categoryValue = product.category.id.toString();
      }
      
      
      // Update only the category field
      setEditFormData(prev => ({
        ...prev,
        category: categoryValue
      }));
      
    }
  }, [isEditModalOpen, product, categories]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData({
      id: null,
      name: "",
      description: "",
      image: null,
      price: "",
      stock: "",
      category: null,
    });
    setImagePreview(null);
    setEditErrors({});
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    const files = e.target.files;
    setEditFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Create image preview if image is selected
    if (name === "image" && files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(files[0]);
    }
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!editFormData.price || parseFloat(editFormData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!editFormData.stock || parseInt(editFormData.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }
    if (!editFormData.category) {
      newErrors.category = "Category is required";
    }

    if (!editFormData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (validateEditForm()) {
      try {
        // Build product data object, only include image if a new file was selected
        const productData = {
          name: editFormData.name,
          description: editFormData.description,
          price: parseFloat(editFormData.price),
          stock: parseInt(editFormData.stock),
          category_id: parseInt(editFormData.category),
        };
        
        // Only include image field if a new image file was selected
        if (editFormData.image instanceof File) {
          productData.image = editFormData.image;
        }
        
        const { data } = await updateProduct({
          variables: {
            id: product.id,
            product: productData,
          },
        });

        // DISABLE optimistic update to prevent race condition with manual refresh
        
        // Refresh data from backend
        await refreshAllData();

        toast.success("Product updated successfully!");
        closeEditModal();
      } catch (error) {
        toast.error(
          error?.errors?.[0]?.extensions?.validation?.["product.image"]?.[0] ||
            "Error updating product"
        );
      }
    }
  };

  // Quick Sale Modal Functions
  const openQuickSaleModal = () => {
    if (!product) return;

    setQuickSaleData({
      customer_name: "",
      quantity: 1,
      price: product.price.toString(),
      tax: 0,
      discount: 0,
    });
    setIsQuickSaleModalOpen(true);
  };

  const closeQuickSaleModal = () => {
    setIsQuickSaleModalOpen(false);
    setQuickSaleData({
      customer_name: "",
      quantity: 1,
      price: "",
      tax: 0,
      discount: 0,
    });
  };

  // ===== SIMPLIFIED SALE CREATION HANDLER =====
  const handleQuickSaleCreated = async (newSaleItem) => {
    try {
      toast.success('Sale created successfully! 🎉');
      
      // Direct refresh with network-only queries
      const success = await refreshAllData();
      if (success) {
        toast.success('✅ Analytics updated!', { duration: 2000 });
      } else {
        toast.warning('Data refresh encountered an issue. Analytics may take a moment to update.', { duration: 3000 });
      }
    } catch (error) {
      toast.error('Sale created but data refresh failed: ' + (error.message || 'Unknown error'));
    }
  };

  // Purchase Modal Functions
  const openPurchaseModal = () => {
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
  };

  const handlePurchaseSubmit = async (payload) => {
    try {
      await createPurchase(payload);
      toast.success("Purchase created successfully! 🎉");
      closePurchaseModal();
      
      // Immediately refresh all data (non-blocking)
      refreshAllData().then((success) => {
        if (success) {
        } else {
          toast.warning('Data may take a moment to update');
        }
      }).catch((error) => {
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || "Error creating purchase";
      toast.error(errorMessage);
      throw error; // Re-throw to let modal know there was an error
    }
  };

  // Sale Modal Functions
  const openSaleModal = () => {
    setIsSaleModalOpen(true);
  };

  const closeSaleModal = () => {
    setIsSaleModalOpen(false);
  };

  const handleSaleSubmit = async (payload) => {
    try {
      await createSale(payload);
      toast.success("Sale created successfully! 🎉 Updating display...");
      closeSaleModal();
      
      // Show immediate feedback that refresh is starting
      toast.info('🔄 Refreshing product data...', { duration: 2000 });
      
      // Immediately refresh all data (non-blocking)
      refreshAllData().then((success) => {
        if (success) {
          toast.success('✅ Product data updated!', { duration: 2000 });
        } else {
          toast.warning('⚠️ Data refresh failed, trying again...', { duration: 3000 });
        }
      }).catch((error) => {
        toast.error('❌ Refresh error: ' + (error.message || 'Please refresh page'));
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || "Error creating sale";
      toast.error(errorMessage);
      throw error; // Re-throw to let modal know there was an error
    }
  };

  // Print functionality
  const handlePrint = () => {
    const printData = generatePrintData();
    const printWindow = window.open("", "_blank");
    printWindow.document.write(generatePrintHTML(printData));
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintData = () => {
    // Use actual calculated values from context analytics
    const actualTotalSold = sales.reduce((total, sale) => total + (sale.quantity || 0), 0);
    const actualTotalPurchased = purchases.reduce((total, purchase) => total + (purchase.quantity || 0), 0);
    const actualTotalSaleValue = analytics?.totalSalesValue || 0;
    const actualTotalPurchaseValue = analytics?.totalPurchaseValue || 0;
    const actualProfitValue = analytics?.profitValue || 0;
    const actualProfitPercentage = actualTotalSaleValue > 0 ? (actualProfitValue / actualTotalSaleValue) * 100 : 0;
    const actualSalesVelocity = analytics?.salesVelocity || 0;

    // Calculate restock needed
    const monthsOfStock = actualSalesVelocity > 0 ? product.stock / actualSalesVelocity : Infinity;
    const restockNeeded = monthsOfStock < 1 ? Math.max(0, actualSalesVelocity - product.stock) : 0;

    let salesHighlight = "No significant sales activity";
    if (actualSalesVelocity > 0) {
      salesHighlight = `Sales velocity: ${actualSalesVelocity} units/month${restockNeeded > 0 ? ` - Restock ${restockNeeded} units needed` : " - Stock levels adequate"}`;
    }

    return {
      name: product.name,
      image: getImageUrl(product.image),
      description: product.description,
      category: product.category,
      sellingPrice: product.price,
      availableStock: product.stock,
      sku: product.sku,
      salesCount: actualTotalSold,
      purchasesCount: actualTotalPurchased,
      profitPercentage: actualProfitPercentage.toFixed(2),
      profitNumber: actualProfitValue.toFixed(2),
      totalSoldValue: actualTotalSaleValue.toFixed(2),
      totalPurchasedValue: actualTotalPurchaseValue.toFixed(2),
      salesVelocity: actualSalesVelocity,
      restockNeeded: restockNeeded,
      salesHighlight: salesHighlight,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  };

  const generatePrintHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product Details - ${data.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { color: #1f2937; font-size: 28px; margin: 0 0 10px 0; }
          .header p { color: #6b7280; margin: 0; }
          .product-info { display: grid; grid-template-columns: 250px 1fr; gap: 30px; margin-bottom: 40px; background: #f8fafc; padding: 25px; border-radius: 12px; }
          .product-image { width: 250px; height: 200px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .product-details h2 { color: #1f2937; font-size: 24px; margin: 0 0 15px 0; }
          .product-details p { margin: 5px 0; }
          .product-details strong { color: #374151; }
          .sku-badge { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-top: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .info-item { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid #e5e7eb; }
          .info-item.profit { border-left-color: #10b981; }
          .info-item.sales { border-left-color: #3b82f6; }
          .info-item.stock { border-left-color: #8b5cf6; }
          .info-item.purchases { border-left-color: #f59e0b; }
          .info-label { font-weight: 600; color: #374151; font-size: 14px; margin-bottom: 8px; }
          .info-value { font-size: 18px; font-weight: 700; color: #1f2937; }
          .highlight { background: linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%); border-left-color: #3b82f6; }
          .analytics-section { margin-top: 30px; }
          .analytics-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
          .metadata-item { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .metadata-label { font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .metadata-value { color: #1f2937; margin-top: 5px; }
          @media print { 
            body { margin: 0; font-size: 12px; }
            .header h1 { font-size: 24px; }
            .product-details h2 { font-size: 20px; }
            .info-value { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 Product Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        
        <div class="product-info">
          <div>
            ${
              data.image
                ? `<img src="${data.image}" alt="${data.name}" class="product-image" />`
                : '<div class="product-image" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); color: #9ca3af; font-size: 16px; font-weight: 600;">📦 No Image</div>'
            }
          </div>
          <div class="product-details">
            <h2>${data.name}</h2>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <span class="sku-badge">SKU: ${data.sku}</span>
          </div>
        </div>
        
        <div class="analytics-section">
          <h3 class="analytics-title">📊 Performance Analytics</h3>
          <div class="info-grid">
            <div class="info-item stock">
              <div class="info-label">💼 Current Selling Price</div>
              <div class="info-value">$${data.sellingPrice}</div>
            </div>
            <div class="info-item stock">
              <div class="info-label">📦 Available Stock</div>
              <div class="info-value">${data.availableStock} units</div>
            </div>
            <div class="info-item sales">
              <div class="info-label">📈 Total Units Sold</div>
              <div class="info-value">${data.salesCount} units</div>
            </div>
            <div class="info-item purchases">
              <div class="info-label">🚛 Total Units Purchased</div>
              <div class="info-value">${data.purchasesCount} units</div>
            </div>
            <div class="info-item profit">
              <div class="info-label">💰 Total Revenue</div>
              <div class="info-value">$${data.totalSoldValue}</div>
            </div>
            <div class="info-item purchases">
              <div class="info-label">💳 Total Purchase Cost</div>
              <div class="info-value">$${data.totalPurchasedValue}</div>
            </div>
            <div class="info-item profit">
              <div class="info-label">📊 Profit Margin</div>
              <div class="info-value">${data.profitPercentage}%</div>
            </div>
            <div class="info-item profit">
              <div class="info-label">💵 Net Profit</div>
              <div class="info-value">$${data.profitNumber}</div>
            </div>
            <div class="info-item sales">
              <div class="info-label">⚡ Sales Velocity</div>
              <div class="info-value">${data.salesVelocity} units/month</div>
            </div>
            <div class="info-item stock">
              <div class="info-label">🔄 Restock Needed</div>
              <div class="info-value">${data.restockNeeded} units</div>
            </div>
            ${
              data.salesHighlight
                ? `
            <div class="info-item highlight" style="grid-column: 1 / -1;">
              <div class="info-label">🎯 Key Insights</div>
              <div class="info-value" style="font-size: 16px; line-height: 1.5;">${data.salesHighlight}</div>
            </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="metadata">
          <div class="metadata-item">
            <div class="metadata-label">Created Date</div>
            <div class="metadata-value">${new Date(data.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Last Updated</div>
            <div class="metadata-value">${new Date(data.updatedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download CSV functionality - Enhanced with multiple sheets
  const handleDownloadCSV = () => {
    const data = generatePrintData();
    generateExcelData(data);

    // Create workbook and worksheets
    const wb = {
      SheetNames: ["Product Summary", "Purchases", "Sales"],
      Sheets: {},
    };

    // Product Summary Sheet
    const productHeaders = [
      "Product Name",
      "Description",
      "Category",
      "Selling Price",
      "Available Stock",
      "Sales Count",
      "Purchases Count",
      "Profit Percentage",
      "Profit Amount",
      "Total Sold Value",
      "Total Purchased Value",
      "Sales Highlight",
    ];

    const productData = [
      [
        data.name,
        data.description,
        data.category,
        data.sellingPrice,
        data.availableStock,
        data.salesCount,
        data.purchasesCount,
        `${data.profitPercentage}%`,
        `$${data.profitNumber}`,
        `$${data.totalSoldValue}`,
        `$${data.totalPurchasedValue}`,
        data.salesHighlight,
      ],
    ];

    wb.Sheets["Product Summary"] = arrayToSheet([
      productHeaders,
      ...productData,
    ]);

    // Purchases Sheet
    const purchaseHeaders = [
      "Purchase ID",
      "Date",
      "Supplier",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Purchased By",
    ];

    // TODO: Add pagination support for comprehensive exports
    const purchaseData = [["No data - use Purchases tab for detailed view"]];
    wb.Sheets["Purchases"] = arrayToSheet([purchaseHeaders, ...purchaseData]);

    // Sales Sheet
    const salesHeaders = [
      "Sale ID",
      "Date",
      "Customer",
      "Quantity",
      "Unit Price",
      "Tax",
      "Discount",
      "Total Amount",
      "Sold By",
    ];

    const salesData = [["No data - use Sales tab for detailed view"]];
    wb.Sheets["Sales"] = arrayToSheet([salesHeaders, ...salesData]);

    // Convert to CSV format (multiple files approach since we can't do multi-sheet CSV)
    downloadAsMultipleCSVs(wb, data);
  };

  const arrayToSheet = (data) => {
    const ws = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };

    for (let R = 0; R < data.length; ++R) {
      for (let C = 0; C < data[R].length; ++C) {
        if (range.s.r > R) range.s.r = R;
        if (range.s.c > C) range.s.c = C;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;

        const cell_ref = encodeCell({ c: C, r: R });
        const cell = { v: data[R][C] };

        if (cell.v == null) continue;

        if (typeof cell.v === "number") cell.t = "n";
        else if (typeof cell.v === "boolean") cell.t = "b";
        else cell.t = "s";

        ws[cell_ref] = cell;
      }
    }

    if (range.s.c < 10000000) ws["!ref"] = encodeRange(range);
    return ws;
  };

  const encodeCell = (cell) => {
    return String.fromCharCode(65 + cell.c) + (cell.r + 1);
  };

  const encodeRange = (range) => {
    return encodeCell(range.s) + ":" + encodeCell(range.e);
  };

  const downloadAsMultipleCSVs = (wb) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const baseFilename = `product-${product.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-${timestamp}`;

    // Download Product Summary
    const productCSV = convertSheetToCSV(wb.Sheets["Product Summary"]);
    downloadCSVFile(productCSV, `${baseFilename}-summary.csv`);

    // Download Purchases
    const purchasesCSV = convertSheetToCSV(wb.Sheets["Purchases"]);
    downloadCSVFile(purchasesCSV, `${baseFilename}-purchases.csv`);

    // Download Sales
    const salesCSV = convertSheetToCSV(wb.Sheets["Sales"]);
    downloadCSVFile(salesCSV, `${baseFilename}-sales.csv`);

    toast.success(
      "CSV files downloaded successfully! Check your downloads folder for 3 files."
    );
  };

  const convertSheetToCSV = (sheet) => {
    const range = decodeRange(sheet["!ref"] || "A1:A1");
    const rows = [];

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = encodeCell({ c: C, r: R });
        const cell = sheet[cell_ref];
        row.push(cell ? `"${cell.v}"` : '""');
      }
      rows.push(row.join(","));
    }

    return rows.join("\n");
  };

  const decodeRange = (range) => {
    const parts = range.split(":");
    return {
      s: decodeCell(parts[0]),
      e: decodeCell(parts[1] || parts[0]),
    };
  };

  const decodeCell = (cellRef) => {
    const match = cellRef.match(/([A-Z]+)(\d+)/);
    if (!match) return { c: 0, r: 0 };

    let col = 0;
    for (let i = 0; i < match[1].length; i++) {
      col = col * 26 + (match[1].charCodeAt(i) - 64);
    }

    return {
      c: col - 1,
      r: parseInt(match[2]) - 1,
    };
  };

  const downloadCSVFile = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateExcelData = (data) => {
    return {
      product: data,
      purchases: [], // TODO: Add pagination support for exports
      sales: [], // TODO: Add pagination support for exports
    };
  };

  // Show loading while data is being fetched for the first time
  if (loading.product || (!product && rawLoading?.product)) {
    return (
      <div className="max-w-[90rem] mx-auto p-6">
        <ContentSpinner message="Loading product details..." fullWidth />
      </div>
    );
  }

  // Only show "not found" if we've finished loading and there's genuinely no product
  if (!loading.product && !product && !rawLoading?.product) {
    return (
      <div className="max-w-[90rem] mx-auto p-6">
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Product not found
          </h3>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-[90rem] mx-auto p-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8"
        >
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-3xl -z-10" />
          
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center space-x-6">
                {/* Enhanced Back Button */}
                <motion.button
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(-1)}
                  className="group p-3 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform duration-300" />
                </motion.button>
                
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2"
                  >
                    📦 Product Analytics
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-gray-600 text-lg"
                  >
                    Comprehensive product insights and management
                  </motion.p>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center space-x-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                  className="group px-6 py-3 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 flex items-center shadow-sm hover:shadow-md"
                >
                  <div className="p-1 bg-gray-100 group-hover:bg-green-100 rounded-lg mr-3 transition-colors duration-300">
                    <Printer className="h-4 w-4 group-hover:text-green-600 transition-colors duration-300" />
                  </div>
                  <span className="font-medium">Print Report</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadCSV}
                  className="group px-6 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-xl hover:shadow-2xl"
                >
                  <div className="p-1 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors duration-300">
                    <Download className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Export Data</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Refresh Indicator */}
        <AnimatePresence>
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="mb-4 mx-auto max-w-md"
            >
              <div className="bg-blue-50/80 backdrop-blur-xl rounded-2xl border border-blue-200/50 shadow-lg p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="relative">
                    <div className="w-6 h-6 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-700">
                      🔄 Refreshing data...
                    </p>
                    <p className="text-xs text-blue-600/70">
                      Please wait while we update the information
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Product Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 p-8 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
                    <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                      {product.name}
                    </h2>
                    <div className="flex items-center space-x-3">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm shadow-lg border ${stockStatus.color} border-white/20`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          stockStatus.text === 'In Stock' ? 'bg-green-400' :
                          stockStatus.text === 'Low Stock' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                        {stockStatus.text}
                      </motion.span>
                      {product.category && (
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 shadow-sm"
                        >
                          <Tag className="h-3 w-3 mr-2" />
                          {product.category}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="bg-white/80 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-mono font-semibold text-gray-800">{product.sku}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Product Image */}
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 rounded-2xl overflow-hidden border border-gray-200/50 shadow-lg">
                    {getImageUrl(product.image) ? (
                      <>
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                          onError={(e) => {
                            // Hide broken image and show fallback
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center">
                                <div class="text-center">
                                  <div class="w-20 h-20 mx-auto mb-4 text-gray-300">📦</div>
                                  <span class="text-gray-500 font-medium">Image Not Available</span>
                                </div>
                              </div>
                            `;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                          <span className="text-gray-500 font-medium">No Image Available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Description and Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-200/50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-blue-500" />
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {product.description || "No description available for this product."}
                    </p>
                  </div>

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Unit Price</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Current Stock</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {product.stock} <span className="text-sm text-gray-500">units</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(analytics.totalSalesValue)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <ShoppingCart className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Net Profit</p>
                          <p className={`text-2xl font-bold ${
                            analytics.profitValue >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(analytics.profitValue)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openEditModal}
                      className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="p-1 bg-white/20 rounded-lg mr-3">
                        <Edit className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Edit Product</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openQuickSaleModal}
                      className="flex items-center px-6 py-3 bg-white hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-2xl border border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-lg"
                    >
                      <div className="p-1 bg-gray-100 hover:bg-green-100 rounded-lg mr-3 transition-colors duration-300">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Quick Sale</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-2">
            <div className="flex overflow-x-auto space-x-2">
              {[
                { id: "overview", label: "Overview", icon: BarChart3, color: "from-blue-500 to-indigo-500" },
                { id: "purchases", label: "Purchases", icon: Truck, color: "from-cyan-500 to-blue-500" },
                { id: "sales", label: "Sales", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
                { id: "stock-history", label: "Stock History", icon: Package, color: "from-purple-500 to-pink-500" },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-xl`
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mr-3 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white/20"
                      : "bg-gray-100"
                  }`}>
                    <tab.icon className="h-4 w-4" />
                  </div>
                  <span>{tab.label}</span>
                  
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8"
        >
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <UnifiedOverviewTab
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "purchases" && (
            <UnifiedPurchasesTab
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onNewPurchase={openPurchaseModal}
            />
          )}

          {activeTab === "sales" && (
            <UnifiedSalesTab
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onNewSale={openSaleModal}
            />
          )}

          {activeTab === "stock-history" && (
            <UnifiedStockHistoryTab
              formatDate={formatDate}
            />
          )}
        </AnimatePresence>
        </motion.div>

        {/* Enhanced Modals */}
        <AnimatePresence>
          {isEditModalOpen && (
            <ProductModal
              formData={editFormData}
              errors={editErrors}
              editingProduct={{ id: editFormData.id }}
              imagePreview={imagePreview}
              handleInputChange={handleEditInputChange}
              handleSubmit={handleEditSubmit}
              closeModal={closeEditModal}
              categories={categories}
              loadingCategories={loadingCategories}
              createProductLoading={false}
              updateProductLoading={updateProductLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isQuickSaleModalOpen && (
            <QuickSaleModal
              product={product}
              quickSaleData={quickSaleData}
              setQuickSaleData={setQuickSaleData}
              closeModal={closeQuickSaleModal}
              formatCurrency={formatCurrency}
              onSaleCreated={handleQuickSaleCreated}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPurchaseModalOpen && (
            <PurchaseModal
              open={isPurchaseModalOpen}
              onClose={closePurchaseModal}
              onSubmit={handlePurchaseSubmit}
              initial={null}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSaleModalOpen && (
            <SaleModal
              open={isSaleModalOpen}
              onClose={closeSaleModal}
              onSubmit={handleSaleSubmit}
              initial={null}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// QuickSaleModal Component - Unified with context integration
const QuickSaleModal = ({ product, quickSaleData, setQuickSaleData, closeModal, formatCurrency, onSaleCreated }) => {
  const [errors, setErrors] = useState({});
  const { createSaleItem, loading: createSaleLoading } = useCreateSaleItemMutation();
  const toast = useToast();
  const { validateProductStock, getValidationState, clearValidationState } = useStockValidation();
  
  // Clear validation state when modal opens
  useEffect(() => {
    clearValidationState();
    // Initial validation if quantity is set
    if (product?.id && quickSaleData.quantity > 0) {
      validateProductStock(product.id, parseInt(quickSaleData.quantity), { key: 'quick_sale' });
    }
  }, []); // Only run on mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuickSaleData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Validate stock when quantity changes
    if (name === 'quantity' && product?.id && value > 0) {
      const validationKey = 'quick_sale';
      validateProductStock(product.id, parseInt(value), { key: validationKey });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!quickSaleData.quantity || quickSaleData.quantity <= 0) {
      newErrors.quantity = 'Quantity is required and must be greater than 0';
    } else if (parseInt(quickSaleData.quantity) > product?.stock) {
      newErrors.quantity = `Quantity cannot exceed available stock (${product?.stock})`;
    }
    
    if (!quickSaleData.price || quickSaleData.price <= 0) {
      newErrors.price = 'Price is required and must be greater than 0';
    }
    
    // Check stock validation state
    const validationKey = 'quick_sale';
    const stockValidation = getValidationState(validationKey);
    if (product?.id && quickSaleData.quantity > 0 && !stockValidation.valid && stockValidation.error) {
      newErrors.stock = stockValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await createSaleItem({
        variables: {
          saleItem: {
            product_id: product.id,
            quantity: parseInt(quickSaleData.quantity),
            price: parseFloat(quickSaleData.price),
            tax: parseFloat(quickSaleData.tax || 0),
            discount: parseFloat(quickSaleData.discount || 0),
            customer_name: quickSaleData.customer_name,
          },
        },
      });
      
      const createdSaleItem = result?.data?.createSaleByProduct;
      
      if (!createdSaleItem) {
        throw new Error('Failed to create sale item - no data returned');
      }
      
      if (onSaleCreated) {
        onSaleCreated(createdSaleItem);
      }
      closeModal();
    } catch (error) {
      toast.error(error.message || "Failed to create sale.");
    }
  };

  const subtotal = parseFloat(quickSaleData.price || 0) * parseInt(quickSaleData.quantity || 0);
  const taxAmount = subtotal * (parseFloat(quickSaleData.tax || 0) / 100);
  const discountAmount = subtotal * (parseFloat(quickSaleData.discount || 0) / 100);
  const total = subtotal + taxAmount - discountAmount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Quick Sale - {product?.name}
            </h2>
            <button
              onClick={closeModal}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Info */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{product?.name}</h3>
                  <p className="text-sm text-gray-600">Available: {product?.stock} units</p>
                  <p className="text-sm text-gray-600">Current Price: {formatCurrency(product?.price)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={quickSaleData.customer_name}
                  onChange={handleInputChange}
                  className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="Optional"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Quantity *
                  {(() => {
                    const validationKey = 'quick_sale';
                    const stockValidation = getValidationState(validationKey);
                    if (product?.id && quickSaleData.quantity > 0) {
                      if (stockValidation.loading) {
                        return <Clock className="h-4 w-4 ml-2 text-blue-500 animate-spin" />;
                      } else if (stockValidation.valid) {
                        return <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />;
                      } else if (stockValidation.error) {
                        return <XCircle className="h-4 w-4 ml-2 text-red-500" />;
                      }
                    }
                    return null;
                  })()} 
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="quantity"
                    value={quickSaleData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    max={product?.stock}
                    className={`px-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none ${
                      errors.quantity || errors.stock
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : (() => {
                            const validationKey = 'quick_sale';
                            const stockValidation = getValidationState(validationKey);
                            if (product?.id && quickSaleData.quantity > 0 && stockValidation.valid) {
                              return 'border-green-300 focus:border-green-400 focus:ring-green-100';
                            }
                            return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20';
                          })()
                    }`}
                  />
                  <div className="absolute top-3 right-3 text-xs text-gray-500">
                    Stock: {product?.stock}
                  </div>
                </div>
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.quantity}
                  </p>
                )}
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.stock}
                  </p>
                )}
                {(() => {
                  const validationKey = 'quick_sale';
                  const stockValidation = getValidationState(validationKey);
                  if (product?.id && quickSaleData.quantity > 0 && stockValidation.valid && stockValidation.warnings?.length > 0) {
                    return (
                      <p className="text-amber-600 text-sm mt-1 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {stockValidation.warnings[0]}
                      </p>
                    );
                  }
                  return null;
                })()} 
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={quickSaleData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`px-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none ${
                    errors.price
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              {/* Tax */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax (%)
                </label>
                <input
                  type="number"
                  name="tax"
                  value={quickSaleData.tax}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={quickSaleData.discount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Sale Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sale Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                {quickSaleData.tax > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tax ({quickSaleData.tax}%):</span>
                    <span className="font-medium text-gray-800">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                {quickSaleData.discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Discount ({quickSaleData.discount}%):</span>
                    <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={createSaleLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {createSaleLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Sale...
                  </div>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Create Quick Sale
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductDetails;
