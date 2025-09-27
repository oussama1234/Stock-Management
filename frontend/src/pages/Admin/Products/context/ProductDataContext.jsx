import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { useGetProductQuery } from '../../../../GraphQL/Products/Queries/Products';
import { usePaginatedSaleItemsByProductQuery } from '../../../../GraphQL/SaleItem/Queries/PaginatedSaleItemsByProduct';
import { usePaginatedPurchaseItemsByProductQuery } from '../../../../GraphQL/PurchaseItem/Queries/PaginatedPurchaseItemsByProduct';
import { usePaginatedStockMovementsByProductQuery } from '../../../../GraphQL/StockMovement/Queries/PaginatedStockMovementsByProduct';
import { useToast } from '../../../../components/Toaster/ToastContext';

const ProductDataContext = createContext(null);

export const useProductData = () => {
  const context = useContext(ProductDataContext);
  if (!context) {
    throw new Error('useProductData must be used within ProductDataProvider');
  }
  return context;
};

export const ProductDataProvider = React.memo(({ children, productId }) => {
  const toast = useToast();
  const manualRefreshLock = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert productId to integer for GraphQL queries
  const productIdInt = parseInt(productId, 10);
  
  // Validate productId conversion
  if (isNaN(productIdInt) || productIdInt <= 0) {
    throw new Error('Invalid product ID provided');
  }

  // GraphQL queries with proper error handling
  const {
    data: productData,
    loading: productLoading,
    error: productError,
    refetch: refetchProduct,
  } = useGetProductQuery(productIdInt);

  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
    refetch: refetchSales,
  } = usePaginatedSaleItemsByProductQuery(productIdInt, 1, 100);

  const {
    data: purchasesData,
    loading: purchasesLoading,
    error: purchasesError,
    refetch: refetchPurchases,
  } = usePaginatedPurchaseItemsByProductQuery(productIdInt, 1, 100);

  const {
    data: stockMovementsData,
    loading: stockMovementsLoading,
    error: stockMovementsError,
    refetch: refetchStockMovements,
  } = usePaginatedStockMovementsByProductQuery(productIdInt, 1, 100);

  // Memoized data extraction
  const product = useMemo(() => {
    if (!productData?.productById) return null;
    
    const prod = productData.productById;
    return {
      ...prod,
      category: prod.category?.name || 'Unknown',
      sku: prod.category?.name
        ? prod.category.name
            .split(' ')
            .map((word) => word.substring(0, 4).toUpperCase())
            .join('') +
          '-' +
          (prod.id < 10 ? '00' + prod.id : prod.id)
        : 'N/A'
    };
  }, [productData?.productById]);

  const sales = useMemo(() => 
    salesData?.paginatedSaleItemsByProduct?.data || [], 
    [salesData?.paginatedSaleItemsByProduct?.data]
  );

  const purchases = useMemo(() => 
    purchasesData?.paginatedPurchaseItemsByProduct?.data || [], 
    [purchasesData?.paginatedPurchaseItemsByProduct?.data]
  );

  const stockMovements = useMemo(() => 
    stockMovementsData?.paginatedStockMovementsByProduct?.data || [], 
    [stockMovementsData?.paginatedStockMovementsByProduct?.data]
  );

  // Memoized analytics calculation
  const analytics = useMemo(() => {
    const daysInStockBackend = productData?.productById?.days_in_stock;
    if (!sales.length && !purchases.length) {
      return {
        totalSalesCount: 0,
        totalPurchasesCount: 0,
        totalSalesValue: 0,
        totalPurchaseValue: 0,
        profitValue: 0,
        profitPercentage: 0,
        salesVelocity: 0,
        daysInStock: typeof daysInStockBackend === 'number' ? daysInStockBackend : null,
        salesHighlight: 'No sales data available'
      };
    }

    // Revenue: favor sale.total_amount proportional allocation if available
    const totalSalesValue = sales.reduce((total, saleItem) => {
      let itemRevenue = 0;
      if (saleItem.sale?.total_amount && saleItem.sale?.items) {
        const saleTotal = saleItem.sale.total_amount;
        const allItemsValue = saleItem.sale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        if (allItemsValue > 0) {
          const thisItemValue = saleItem.quantity * saleItem.price;
          itemRevenue = (thisItemValue / allItemsValue) * saleTotal;
        } else {
          itemRevenue = saleItem.quantity * saleItem.price;
        }
      } else {
        itemRevenue = saleItem.quantity * saleItem.price;
      }
      return total + (itemRevenue || 0);
    }, 0);

    // Cost: group items by purchase, apply tax/discount when available, or use purchase.total_amount
    const byPurchase = new Map();
    purchases.forEach((item) => {
      const p = item.purchase || {};
      const pid = p.id || item.purchase_id || item.purchaseId || `i-${item.id}`;
      const entry = byPurchase.get(pid) || { subtotal: 0, total_amount: p.total_amount, tax: p.tax, discount: p.discount };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price || item.price) || 0;
      entry.subtotal += qty * price;
      if (p.total_amount !== undefined) entry.total_amount = p.total_amount;
      if (p.tax !== undefined) entry.tax = p.tax;
      if (p.discount !== undefined) entry.discount = p.discount;
      byPurchase.set(pid, entry);
    });

    const totalPurchaseValue = Array.from(byPurchase.values()).reduce((sum, entry) => {
      if (entry.total_amount !== undefined && entry.total_amount !== null) {
        return sum + Number(entry.total_amount || 0);
      }
      const sub = Number(entry.subtotal || 0);
      const taxPct = Number(entry.tax ?? 0);
      const discPct = Number(entry.discount ?? 0);
      const taxAmt = sub * (taxPct / 100);
      const discAmt = sub * (discPct / 100);
      const total = sub + taxAmt - discAmt;
      return sum + total;
    }, 0);

    const profitValue = totalSalesValue - totalPurchaseValue;
    const profitPercentage = totalSalesValue > 0 ? ((profitValue / totalSalesValue) * 100) : 0;

    // Sales velocity calculation
    const totalSold = sales.reduce((acc, sale) => acc + (sale.quantity || 0), 0);
    let salesVelocity = 0;
    if (sales.length > 0 && totalSold > 0) {
      const validSales = sales
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
        const diffMonths = Math.max(1, (lastSaleDate.getFullYear() - firstSaleDate.getFullYear()) * 12 + (lastSaleDate.getMonth() - firstSaleDate.getMonth()) + 1);
        salesVelocity = Math.round(totalSold / diffMonths);
      } else {
        salesVelocity = totalSold;
      }
    }

    return {
      totalSalesCount: sales.length,
      totalPurchasesCount: purchases.length,
      totalSalesValue,
      totalPurchaseValue,
      profitValue,
      profitPercentage,
      salesVelocity,
      daysInStock: typeof daysInStockBackend === 'number' ? daysInStockBackend : null,
      salesHighlight: salesVelocity > 0 ? `Sales velocity: ${salesVelocity} units/month` : 'No significant sales activity'
    };
  }, [sales, purchases, productData?.productById?.days_in_stock]);

  // Memoized loading state
  const loading = useMemo(() => ({
    product: productLoading,
    sales: salesLoading,
    purchases: purchasesLoading,
    stockMovements: stockMovementsLoading
  }), [productLoading, salesLoading, purchasesLoading, stockMovementsLoading]);

  // Memoized error state
  const error = useMemo(() => {
    return productError?.message || 
           salesError?.message || 
           purchasesError?.message || 
           stockMovementsError?.message || 
           null;
  }, [productError, salesError, purchasesError, stockMovementsError]);

  // Optimized refresh function
  const refreshAllData = useCallback(async () => {
    if (manualRefreshLock.current) return false;
    
    manualRefreshLock.current = true;
    setIsRefreshing(true);
    
    try {
      const promises = [
        refetchProduct(),
        refetchSales(),
        refetchPurchases(),
        refetchStockMovements()
      ];
      
      await Promise.all(promises);
      setRefreshKey(prev => prev + 1);
      
      setTimeout(() => {
        manualRefreshLock.current = false;
        setIsRefreshing(false);
      }, 300);
      
      return true;
    } catch (error) {
      toast.error('Failed to refresh data: ' + (error.message || 'Unknown error'));
      manualRefreshLock.current = false;
      setIsRefreshing(false);
      return false;
    }
  }, [refetchProduct, refetchSales, refetchPurchases, refetchStockMovements, toast]);

  // Optimistic update function
  const optimisticUpdate = useCallback((updates) => {
    if (manualRefreshLock.current) return;
    
    // For now, just trigger a refresh - can be enhanced later
    setRefreshKey(prev => prev + 1);
  }, []);

  // Memoized context value
  const contextValue = useMemo(() => ({
    product,
    sales,
    purchases,
    stockMovements,
    analytics,
    loading,
    // convenience boolean for components expecting isLoading
    isLoading: loading.product || loading.sales || loading.purchases || loading.stockMovements,
    error,
    // expose refresh with both names for compatibility
    refreshAllData,
    refreshData: refreshAllData,
    optimisticUpdate,
    isRefreshing,
    refreshKey,
    lastUpdated: Date.now()
  }), [
    product,
    sales,
    purchases,
    stockMovements,
    analytics,
    loading,
    error,
    refreshAllData,
    optimisticUpdate,
    isRefreshing,
    refreshKey
  ]);

  return (
    <ProductDataContext.Provider value={contextValue}>
      <div key={refreshKey}>
        {children}
      </div>
    </ProductDataContext.Provider>
  );
});