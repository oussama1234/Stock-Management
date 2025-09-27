import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  DollarSign,
  Hash,
  User,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { useProductData } from '../../context/ProductDataContext';
import { useFormatters } from '../../hooks/useFormatters';
import { useStockValidation } from '../../hooks/useStockValidation';

const SaleRow = memo(({ 
  sale, 
  onEdit, 
  onDelete,
  productStock 
}) => {
  const { formatCurrency, formatDate } = useFormatters();
  const { validateQuantity } = useStockValidation(productStock);
  
  const validation = validateQuantity(sale.quantity);
  const isValidSale = validation.isValid || sale.id; // Existing sales are always valid

  const getCustomerName = () => {
    if (sale?.customer_name && typeof sale.customer_name === 'string') return sale.customer_name;
    if (sale?.customerName && typeof sale.customerName === 'string') return sale.customerName;
    if (sale?.customer && typeof sale.customer === 'string') return sale.customer;
    if (sale?.customer?.name && typeof sale.customer.name === 'string') return sale.customer.name;
    if (sale?.sale?.customer_name && typeof sale.sale.customer_name === 'string') return sale.sale.customer_name;
    if (sale?.sale?.customer?.name && typeof sale.sale.customer.name === 'string') return sale.sale.customer.name;
    if (sale?.sale?.customer && typeof sale.sale.customer === 'string') return sale.sale.customer;
    return 'Walk-in Customer';
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 ${
        !isValidSale ? 'bg-red-50/30' : ''
      }`}
    >
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">#{sale.reference || sale.id}</span>
          {!isValidSale && (
            <AlertTriangle className="h-4 w-4 text-red-500" title={validation.message} />
          )}
        </div>
      </td>
      
      <td className="px-4 py-4">
        <span className="text-gray-900">{formatDate(sale.sale_date || sale.created_at)}</span>
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">{sale.quantity}</span>
          <span className="text-sm text-gray-500">units</span>
        </div>
      </td>
      
      <td className="px-4 py-4">
        <span className="font-medium text-green-600">
          {formatCurrency(sale.unit_price || sale.price)}
        </span>
      </td>
      
      <td className="px-4 py-4">
        <span className="font-bold text-gray-900">
          {sale.sale?.total_amount 
            ? formatCurrency(sale.sale.total_amount) 
            : formatCurrency((sale.unit_price || sale.price) * sale.quantity)
          }
        </span>
        {sale.sale?.total_amount && (sale.sale?.tax > 0 || sale.sale?.discount > 0) && (
          <div className="text-xs text-gray-500">
            {sale.sale?.tax > 0 && <span className="text-green-600">+{sale.sale.tax}% tax</span>}
            {sale.sale?.tax > 0 && sale.sale?.discount > 0 && <span className="mx-1">•</span>}
            {sale.sale?.discount > 0 && <span className="text-red-600">-{sale.sale.discount}% disc</span>}
          </div>
        )}
      </td>
      
      <td className="px-4 py-4 max-w-[220px]">
        <span className="text-gray-600 truncate block" title={getCustomerName()}>{getCustomerName()}</span>
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center space-x-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(sale)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            title="Edit sale"
          >
            <Edit3 className="h-4 w-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(sale)}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
            title="Delete sale"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
});

const SalesTab = memo(({ productId, showFilters, onEditSale, onDeleteSale }) => {
  const [sortField, setSortField] = useState('sale_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedSale, setSelectedSale] = useState(null);
  
  const { 
    product,
    sales,
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

  const handleEditSale = useCallback((sale) => {
    if (onEditSale) {
      onEditSale(sale);
      return;
    }
    setSelectedSale(sale);
    console.log('Editing sale:', sale);
  }, [onEditSale]);

  const handleDeleteSale = useCallback((sale) => {
    if (onDeleteSale) {
      onDeleteSale(sale);
      return;
    }
    console.log('Deleting sale:', sale);
  }, [onDeleteSale]);

  const handleAddSale = useCallback(() => {
    // This would open the add sale modal with stock validation
    console.log('Adding new sale for product:', productId);
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Sales</h3>
        <p className="text-gray-600">Unable to load sales data. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 inline-block">
          <DollarSign className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Yet</h3>
          <p className="text-gray-600 mb-6">This product hasn't been sold yet. Start by adding your first sale.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddSale}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg transition-all duration-200 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add First Sale</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // Calculate summary stats - use total_amount from backend which includes tax/discount
  const totalSales = sales.reduce((sum, saleItem) => {
    // Access nested sale object for total_amount (includes tax/discount)
    if (saleItem.sale?.total_amount) {
      return sum + parseFloat(saleItem.sale.total_amount);
    }
    // Fallback to line calculation for backward compatibility
    return sum + ((saleItem.unit_price || saleItem.price) * saleItem.quantity);
  }, 0);
  const totalUnits = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const averageSalePrice = totalUnits > 0 ? totalSales / totalUnits : 0;

  // Sort sales
  const sortedSales = [...sales].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'sale_date' || sortField === 'created_at') {
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
      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Total Sales Value</p>
              <p className="text-xl font-bold text-green-900">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Units Sold</p>
              <p className="text-xl font-bold text-blue-900">{formatNumber(totalUnits)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-800">Avg Sale Price</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(averageSalePrice)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
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
                  onClick={() => handleSort('sale_date')}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                    {sortField === 'sale_date' && (
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
                    <span>Customer</span>
                  </div>
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSales.map((sale) => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  productStock={product?.stock || 0}
                  onEdit={handleEditSale}
                  onDelete={handleDeleteSale}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

SalesTab.displayName = 'SalesTab';
SaleRow.displayName = 'SaleRow';

export default SalesTab;