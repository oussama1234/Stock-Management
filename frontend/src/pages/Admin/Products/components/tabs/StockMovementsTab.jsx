import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Hash,
  User,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  FileText,
  Plus,
  Activity
} from 'lucide-react';
import { useProductData } from '../../context/ProductDataContext';
import { useFormatters } from '../../hooks/useFormatters';

const MovementRow = memo(({ 
  movement 
}) => {
  const { formatDate, formatNumber } = useFormatters();
  
  const isPositive = movement.type === 'in' || movement.type === 'purchase' || movement.type === 'adjustment_in';
  const isNegative = movement.type === 'out' || movement.type === 'sale' || movement.type === 'adjustment_out';

  const getMovementIcon = (type) => {
    switch (type) {
      case 'in':
      case 'purchase':
      case 'adjustment_in':
        return <ArrowUpCircle className="h-5 w-5 text-green-600" />;
      case 'out':
      case 'sale':
      case 'adjustment_out':
        return <ArrowDownCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMovementColor = (type) => {
    switch (type) {
      case 'in':
      case 'purchase':
      case 'adjustment_in':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'out':
      case 'sale':
      case 'adjustment_out':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSafeStockAfter = (m) => {
    const v = m?.new_stock ?? m?.newStock ?? m?.stock_after ?? m?.stockAfter ?? m?.balance_after ?? m?.balanceAfter ?? m?.balance;
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
    >
      <td className="px-4 py-4">
        <span className="font-medium text-gray-900">#{movement.reference || movement.id}</span>
      </td>
      
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-gray-900">{formatDate(movement.movement_date || movement.created_at || movement.date)}</span>
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center space-x-3">
          {getMovementIcon(movement.type)}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMovementColor(movement.type)}`}>
            {movement.type ? movement.type.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
          </span>
        </div>
      </td>
      
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-900'}`}>
            {isPositive ? '+' : isNegative ? '-' : ''}{formatNumber(Math.abs(movement.quantity))}
          </span>
          <span className="text-sm text-gray-500">units</span>
        </div>
      </td>
      
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="font-medium text-gray-900">
          {(() => {
            const sa = getSafeStockAfter(movement);
            return sa === null ? 'Not tracked' : formatNumber(sa);
          })()}
        </span>
      </td>
      
      <td className="px-4 py-4 max-w-[220px]">
        <span className="text-gray-600 truncate block" title={movement.user_name || movement.user || 'System'}>{movement.user_name || movement.user || 'System'}</span>
      </td>
      
      <td className="px-4 py-4 max-w-xs">
        <p className="text-sm text-gray-600 truncate" title={movement.reason || movement.notes}>
          {movement.reason || movement.notes || 'No reason provided'}
        </p>
      </td>
    </motion.tr>
  );
});

const StockMovementsTab = memo(({ productId, showFilters }) => {
  const [sortField, setSortField] = useState('movement_date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const { 
    product,
    stockMovements,
    isLoading,
    error
  } = useProductData();

  const { formatNumber } = useFormatters();
  
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleAddMovement = useCallback(() => {
    console.log('Adding new stock movement for product:', productId);
  }, [productId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Stock Movements</h3>
        <p className="text-gray-600">Unable to load stock movement data. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!stockMovements || stockMovements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 inline-block">
          <Activity className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Movements</h3>
          <p className="text-gray-600 mb-6">No stock movements have been recorded for this product yet. Stock movements are automatically created from sales and purchases.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddMovement}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-xl shadow-lg transition-all duration-200 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add Manual Adjustment</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalMovements = stockMovements.length;
  const inMovements = stockMovements.filter(m => m.type === 'in' || m.type === 'purchase' || m.type === 'adjustment_in').length;
  const outMovements = stockMovements.filter(m => m.type === 'out' || m.type === 'sale' || m.type === 'adjustment_out').length;
  const totalInQuantity = stockMovements
    .filter(m => m.type === 'in' || m.type === 'purchase' || m.type === 'adjustment_in')
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
  const totalOutQuantity = stockMovements
    .filter(m => m.type === 'out' || m.type === 'sale' || m.type === 'adjustment_out')
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
  const netMovement = totalInQuantity - totalOutQuantity;

  // Sort movements
  const sortedMovements = [...stockMovements].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'movement_date' || sortField === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      {/* Stock Movement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Activity className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Total Movements</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(totalMovements)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Stock In</p>
              <p className="text-xl font-bold text-green-900">{formatNumber(totalInQuantity)}</p>
              <p className="text-xs text-green-600">{inMovements} movements</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">Stock Out</p>
              <p className="text-xl font-bold text-red-900">{formatNumber(totalOutQuantity)}</p>
              <p className="text-xs text-red-600">{outMovements} movements</p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-r p-4 rounded-xl border ${
          netMovement >= 0 
            ? 'from-blue-50 to-indigo-50 border-blue-200' 
            : 'from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              netMovement >= 0 ? 'bg-blue-100' : 'bg-amber-100'
            }`}>
              {netMovement >= 0 ? (
                <ArrowUpCircle className="h-5 w-5 text-blue-600" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${
                netMovement >= 0 ? 'text-blue-800' : 'text-amber-800'
              }`}>
                Net Movement
              </p>
              <p className={`text-xl font-bold ${
                netMovement >= 0 ? 'text-blue-900' : 'text-amber-900'
              }`}>
                {netMovement >= 0 ? '+' : ''}{formatNumber(netMovement)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movements Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('reference')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Reference</span>
                    {sortField === 'reference' && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('movement_date')}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                    {sortField === 'movement_date' && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span>Type</span>
                    {sortField === 'type' && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center space-x-1">
                    <Hash className="h-4 w-4" />
                    <span>Quantity</span>
                    {sortField === 'quantity' && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('stock_after')}
                >
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>New Stock</span>
                    {sortField === 'stock_after' && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>User</span>
                  </div>
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>Reason</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMovements.map((movement) => (
                <MovementRow
                  key={movement.id}
                  movement={movement}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

StockMovementsTab.displayName = 'StockMovementsTab';
MovementRow.displayName = 'MovementRow';

export default StockMovementsTab;