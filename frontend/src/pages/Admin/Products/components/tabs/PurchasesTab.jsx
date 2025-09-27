import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  DollarSign,
  Hash,
  User,
  AlertTriangle,
  Package,
  Edit3,
  Trash2,
  Plus,
  Truck
} from 'lucide-react';
import { useProductData } from '../../context/ProductDataContext';
import { useFormatters } from '../../hooks/useFormatters';

const PurchaseRow = memo(({ 
  purchase, 
  onEdit, 
  onDelete 
}) => {
  const { formatCurrency, formatDate } = useFormatters();

  const getSupplierName = () => {
    if (purchase?.supplier_name && typeof purchase.supplier_name === 'string') return purchase.supplier_name;
    if (purchase?.supplierName && typeof purchase.supplierName === 'string') return purchase.supplierName;
    if (purchase?.supplier && typeof purchase.supplier === 'string') return purchase.supplier;
    if (purchase?.supplier?.name && typeof purchase.supplier.name === 'string') return purchase.supplier.name;
    if (purchase?.purchase?.supplier_name && typeof purchase.purchase.supplier_name === 'string') return purchase.purchase.supplier_name;
    if (purchase?.purchase?.supplier?.name && typeof purchase.purchase.supplier.name === 'string') return purchase.purchase.supplier.name;
    if (purchase?.purchase?.supplier && typeof purchase.purchase.supplier === 'string') return purchase.purchase.supplier;
    return 'Unknown Supplier';
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
    >
      <td className="px-4 py-4">
        <span className="font-medium text-gray-900">#{purchase.reference || purchase.id}</span>
      </td>
      
      <td className="px-4 py-4">
        <span className="text-gray-900">{formatDate(purchase.purchase_date || purchase.created_at)}</span>
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">{purchase.quantity}</span>
          <span className="text-sm text-gray-500">units</span>
        </div>
      </td>
      
      <td className="px-4 py-4">
        <span className="font-medium text-blue-600">
          {formatCurrency(purchase.unit_price || purchase.price)}
        </span>
      </td>
      
      <td className="px-4 py-4">
        <span className="font-bold text-gray-900">
          {purchase.purchase?.total_amount 
            ? formatCurrency(purchase.purchase.total_amount) 
            : formatCurrency((purchase.unit_price || purchase.price) * purchase.quantity)
          }
        </span>
        {purchase.purchase?.total_amount && (purchase.purchase?.tax > 0 || purchase.purchase?.discount > 0) && (
          <div className="text-xs text-gray-500">
            {purchase.purchase?.tax > 0 && <span className="text-green-600">+{purchase.purchase.tax}% tax</span>}
            {purchase.purchase?.tax > 0 && purchase.purchase?.discount > 0 && <span className="mx-1">•</span>}
            {purchase.purchase?.discount > 0 && <span className="text-red-600">-{purchase.purchase.discount}% disc</span>}
          </div>
        )}
      </td>
      
      <td className="px-4 py-4 max-w-[220px]">
        <span className="text-gray-600 truncate block" title={getSupplierName()}>{getSupplierName()}</span>
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            purchase.status === 'received' ? 'bg-green-400' :
            purchase.status === 'pending' ? 'bg-yellow-400' :
            purchase.status === 'cancelled' ? 'bg-red-400' : 'bg-gray-400'
          }`} />
          <span className={`text-sm font-medium capitalize ${
            purchase.status === 'received' ? 'text-green-700' :
            purchase.status === 'pending' ? 'text-yellow-700' :
            purchase.status === 'cancelled' ? 'text-red-700' : 'text-gray-700'
          }`}>
            {purchase.status || 'unknown'}
          </span>
        </div>
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center space-x-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(purchase)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            title="Edit purchase"
          >
            <Edit3 className="h-4 w-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(purchase)}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
            title="Delete purchase"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
});

const PurchasesTab = memo(({ productId, showFilters, onEditPurchase, onDeletePurchase }) => {
  const [sortField, setSortField] = useState('purchase_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  const { 
    product,
    purchases,
    isLoading,
    error
  } = useProductData();

  const { formatCurrency, formatNumber } = useFormatters();
  
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleEditPurchase = useCallback((purchase) => {
    if (onEditPurchase) {
      onEditPurchase(purchase);
      return;
    }
    setSelectedPurchase(purchase);
    console.log('Editing purchase:', purchase);
  }, [onEditPurchase]);

  const handleDeletePurchase = useCallback((purchase) => {
    if (onDeletePurchase) {
      onDeletePurchase(purchase);
      return;
    }
    console.log('Deleting purchase:', purchase);
  }, [onDeletePurchase]);

  const handleAddPurchase = useCallback(() => {
    console.log('Adding new purchase for product:', productId);
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Purchases</h3>
        <p className="text-gray-600">Unable to load purchase data. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 inline-block">
          <Package className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchases Yet</h3>
          <p className="text-gray-600 mb-6">No purchases have been recorded for this product yet. Add your first purchase to start tracking inventory.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddPurchase}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add First Purchase</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // Calculate summary stats - use total_amount from backend which includes tax/discount
  const totalPurchases = purchases.reduce((sum, purchaseItem) => {
    // Access nested purchase object for total_amount (includes tax/discount)
    if (purchaseItem.purchase?.total_amount) {
      return sum + parseFloat(purchaseItem.purchase.total_amount);
    }
    // Fallback to line calculation for backward compatibility
    return sum + ((purchaseItem.unit_price || purchaseItem.price) * purchaseItem.quantity);
  }, 0);
  const totalUnits = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
  const averagePurchasePrice = totalUnits > 0 ? totalPurchases / totalUnits : 0;
  const receivedPurchases = purchases.filter(p => p.status === 'received').length;

  // Sort purchases
  const sortedPurchases = [...purchases].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'purchase_date' || sortField === 'created_at') {
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
      {/* Purchase Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Total Purchase Cost</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(totalPurchases)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Hash className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-800">Units Purchased</p>
              <p className="text-xl font-bold text-purple-900">{formatNumber(totalUnits)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Avg Purchase Price</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(averagePurchasePrice)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Received Orders</p>
              <p className="text-xl font-bold text-green-900">{receivedPurchases}/{purchases.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
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
                  onClick={() => handleSort('purchase_date')}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                    {sortField === 'purchase_date' && (
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
                  onClick={() => handleSort('unit_price')}
                >
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Unit Price</span>
                    {sortField === 'unit_price' && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Supplier</span>
                  </div>
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPurchases.map((purchase) => (
                <PurchaseRow
                  key={purchase.id}
                  purchase={purchase}
                  onEdit={handleEditPurchase}
                  onDelete={handleDeletePurchase}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

PurchasesTab.displayName = 'PurchasesTab';
PurchaseRow.displayName = 'PurchaseRow';

export default PurchasesTab;