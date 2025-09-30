// src/pages/Inventory/components/tables/AdjustmentsTable.jsx
// Table for displaying inventory adjustments
import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  User, 
  Calendar, 
  FileText,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  Truck
} from 'lucide-react';
import { getInventoryHistory } from '@/api/Inventory';

const AdjustmentsTable = memo(function AdjustmentsTable() {
  // Start with sample data for immediate display
  const [data, setData] = useState([
    {
      id: 1,
      product: 'Wireless Bluetooth Headphones',
      adjustment: +15,
      reason: 'Stock replenishment',
      user: 'John Smith',
      date: '2024-01-28T10:30:00Z',
      notes: 'New shipment received from supplier'
    },
    {
      id: 2,
      product: 'Gaming Mechanical Keyboard',
      adjustment: -3,
      reason: 'Damaged items',
      user: 'Sarah Johnson',
      date: '2024-01-27T14:15:00Z',
      notes: 'Water damage during transport'
    },
    {
      id: 3,
      product: 'USB-C Charging Cable',
      adjustment: +25,
      reason: 'Inventory correction',
      user: 'Mike Wilson',
      date: '2024-01-26T09:45:00Z',
      notes: 'Physical count adjustment'
    },
    {
      id: 4,
      product: 'Wireless Mouse',
      adjustment: -2,
      reason: 'Customer return',
      user: 'Emily Davis',
      date: '2024-01-25T16:20:00Z',
      notes: 'Defective units returned'
    },
    {
      id: 5,
      product: 'Portable SSD 1TB',
      adjustment: +8,
      reason: 'Stock transfer',
      user: 'David Brown',
      date: '2024-01-24T11:10:00Z',
      notes: 'Transfer from warehouse B'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(true);
  const abortRef = useRef(null);

  const fetchAdjustments = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      console.log('🔄 [AdjustmentsTable] Attempting to fetch adjustments data...');
      setLoading(true);
      setError(null);

      const response = await getInventoryHistory({
        limit: 10,
        // Remove type filter since it causes 422 error
      });

      console.log('📋 [AdjustmentsTable] Raw API response:', response);

      // Transform API data to match component expectations
      const historyData = response?.data || response || [];
      console.log('📋 [AdjustmentsTable] History data array:', historyData);
      
      if (historyData.length === 0) {
        console.log('⚠️ [AdjustmentsTable] No data from API, keeping sample data');
        return;
      }

      const adjustments = historyData.map(item => {
        // Calculate adjustment based on type and quantity
        const adjustment = item.type === 'in' ? item.quantity : -item.quantity;
        
        return {
          id: item.id,
          product: item.product_name || item.product?.name || `Product #${item.product_id}`,
          adjustment: adjustment,
          reason: item.type === 'in' ? 'Stock In' : 'Stock Out',
          user: item.user_name || item.user?.name || 'System',
          date: item.created_at || item.date,
          notes: item.notes || item.description || ''
        };
      });

      console.log('✅ [AdjustmentsTable] Processed adjustments:', adjustments);
      setData(adjustments);
      setUsingFallback(false);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('❌ [AdjustmentsTable] API Error:', e);
        setError(e?.response?.data?.message || e.message);
        console.log('📋 [AdjustmentsTable] Keeping sample data due to API error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdjustments();
    return () => abortRef.current?.abort();
  }, [fetchAdjustments]);

  const getAdjustmentBadge = (adjustment) => {
    const isPositive = adjustment > 0;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isPositive 
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? '+' : ''}{adjustment}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
          <p className="text-gray-500">Loading adjustments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50 text-red-400" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto relative">
      {usingFallback && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            Sample Data
          </span>
        </div>
      )}
      <div className="space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {item.product}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.reason}
                  </p>
                </div>
              </div>
              {getAdjustmentBadge(item.adjustment)}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{item.user}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {item.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Notes:</span> {item.notes}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {data.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No adjustments found</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default AdjustmentsTable;