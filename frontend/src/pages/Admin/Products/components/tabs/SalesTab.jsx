import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
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
import useTabPagination from '../../hooks/useTabPagination';
import useProductSalesTabData from '../../hooks/useProductSalesTabData';
import FilterBar from '@/components/filters/FilterBar';
import Pagination from '@/components/Pagination/Pagination';
import ContentSpinner from '@/components/Spinners/ContentSpinner';

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

const SalesTab = memo(({ productId, showFilters, onEditSale, onDeleteSale, onAddNewSale }) => {
  const [selectedSale, setSelectedSale] = useState(null);

  const { product } = useProductData();
  const { page, perPage, setPage, setPerPage, params } = useTabPagination({ page: 1, perPage: 10 });
  const { items, meta, loading, error, filters, setFilter, networkStatus } = useProductSalesTabData(productId, params, { sortBy: 'sale_date', sortOrder: 'desc' });

  const sortField = filters.sortBy;
  const sortDirection = filters.sortOrder;

  const { formatCurrency, formatNumber } = useFormatters();

  // Draft filters for Apply behavior
  const [draft, setDraft] = useState({
    search: filters.search || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    sortBy: filters.sortBy || 'sale_date',
    sortOrder: filters.sortOrder || 'desc',
  });

  // Keep draft in sync when external filters change (e.g., after Clear)
  useEffect(() => {
    setDraft({
      search: filters.search || '',
      dateFrom: filters.dateFrom || '',
      dateTo: filters.dateTo || '',
      sortBy: filters.sortBy || 'sale_date',
      sortOrder: filters.sortOrder || 'desc',
    });
  }, [filters.search, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder]);

  const applyFilters = useCallback(() => {
    setFilter('search', draft.search || '');
    setFilter('dateFrom', draft.dateFrom || '');
    setFilter('dateTo', draft.dateTo || '');
    setFilter('sortBy', draft.sortBy || 'sale_date');
    setFilter('sortOrder', draft.sortOrder || 'desc');
    setPage(1);
  }, [draft, setFilter, setPage]);

  const handleSort = useCallback((field) => {
    setFilter('sortBy', field);
    setFilter('sortOrder', filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc');
  }, [filters.sortBy, filters.sortOrder, setFilter]);

  const clearFilters = useCallback(() => {
    const defaults = { search: '', dateFrom: '', dateTo: '', sortBy: 'sale_date', sortOrder: 'desc' };
    setDraft(defaults);
    setFilter('search', '');
    setFilter('dateFrom', '');
    setFilter('dateTo', '');
    setFilter('sortBy', 'sale_date');
    setFilter('sortOrder', 'desc');
    setPage(1);
  }, [setFilter, setPage]);

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
    if (onAddNewSale) {
      onAddNewSale();
      return;
    }
    console.log('Adding new sale for product:', productId);
  }, [productId, onAddNewSale]);

  // Precompute summary stats regardless of render path to keep hooks order stable
  const totalSales = useMemo(() => (items ?? []).reduce((sum, saleItem) => {
    if (saleItem.sale?.total_amount) {
      return sum + parseFloat(saleItem.sale.total_amount);
    }
    return sum + ((saleItem.unit_price || saleItem.price) * saleItem.quantity);
  }, 0), [items]);
  const totalUnits = useMemo(() => (items ?? []).reduce((sum, sale) => sum + sale.quantity, 0), [items]);
  const averageSalePrice = totalUnits > 0 ? totalSales / totalUnits : 0;

  if (loading) {
    return (
      <div className="py-12">
        <ContentSpinner theme="sales" size="medium" variant="minimal" fullWidth={true} message="Loading sales..." />
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

  if (!items || items.length === 0) {
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
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from.green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg transition-all duration-200 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add First Sale</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // Calculate summary stats on current page dataset
  const sortedSales = items; // server-side sorting

  const isRefetching = !loading && [2,3,4,6].includes(networkStatus ?? 0);

  return (
    <div className="relative space-y-6">
      {isRefetching && (
        <div className="absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
          <ContentSpinner theme="sales" size="small" variant="minimal" />
        </div>
      )}
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

      {/* Filters */}
      {showFilters && (
        <FilterBar>
          <input
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            placeholder="Search by customer/product..."
            value={draft.search}
            onChange={(e) => setDraft(prev => ({ ...prev, search: e.target.value }))}
          />
          <input
            type="date"
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            value={draft.dateFrom}
            onChange={(e) => setDraft(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <input
            type="date"
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            value={draft.dateTo}
            onChange={(e) => setDraft(prev => ({ ...prev, dateTo: e.target.value }))}
          />
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            value={draft.sortBy}
            onChange={(e) => setDraft(prev => ({ ...prev, sortBy: e.target.value }))}
          >
            <option value="sale_date">Date</option>
            <option value="created_at">Created</option>
            <option value="quantity">Quantity</option>
            <option value="unit_price">Unit Price</option>
            <option value="total_amount">Total Amount</option>
          </select>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            value={draft.sortOrder}
            onChange={(e) => setDraft(prev => ({ ...prev, sortOrder: e.target.value }))}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            onClick={applyFilters}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-red-50 text-red-600 hover:bg-red-100"
          >
            Clear Filters
          </button>
        </FilterBar>
      )}

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

      {/* Pagination */}
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
});

SalesTab.displayName = 'SalesTab';
SaleRow.displayName = 'SaleRow';

export default SalesTab;