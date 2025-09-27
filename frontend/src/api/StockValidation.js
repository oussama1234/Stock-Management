// src/api/StockValidation.js
// API service for stock validation operations

import { AxiosClient } from './AxiosClient';

/**
 * Validate stock for a single product
 * @param {number} productId - The product ID
 * @param {number} quantity - The requested quantity
 * @returns {Promise<Object>} Validation result
 */
export const validateProductStock = async (productId, quantity) => {
  const res = await AxiosClient.post('/stock-validation/validate-product', {
    product_id: productId,
    quantity: quantity
  });
  return res.data;
};

/**
 * Validate stock for multiple products (for multi-item sales)
 * @param {Array} items - Array of {product_id, quantity} objects
 * @returns {Promise<Object>} Validation result
 */
export const validateMultipleProductsStock = async (items) => {
  const res = await AxiosClient.post('/stock-validation/validate-multiple', {
    items: items
  });
  return res.data;
};

/**
 * Get current stock levels for multiple products
 * @param {Array} productIds - Array of product IDs
 * @returns {Promise<Object>} Stock levels
 */
export const getStockLevels = async (productIds) => {
  const res = await AxiosClient.post('/stock-validation/stock-levels', {
    product_ids: productIds
  });
  return res.data;
};

/**
 * Get real-time stock information for a single product
 * @param {number} productId - The product ID
 * @returns {Promise<Object>} Stock information
 */
export const getProductStockInfo = async (productId) => {
  const res = await AxiosClient.get(`/stock-validation/product/${productId}/stock-info`);
  return res.data;
};

/**
 * Utility function to check if stock validation result indicates success
 * @param {Object} validationResult - Result from validation API
 * @returns {boolean} True if validation passed
 */
export const isStockValidationValid = (validationResult) => {
  return validationResult?.data?.valid === true;
};

/**
 * Extract error message from validation result
 * @param {Object} validationResult - Result from validation API
 * @returns {string} Error message or empty string
 */
export const getStockValidationError = (validationResult) => {
  if (validationResult?.data?.error) {
    return validationResult.data.error;
  }
  
  if (validationResult?.data?.errors && validationResult.data.errors.length > 0) {
    return validationResult.data.errors.map(error => error.error).join(', ');
  }
  
  return '';
};

/**
 * Extract warnings from validation result
 * @param {Object} validationResult - Result from validation API
 * @returns {Array} Array of warning messages
 */
export const getStockValidationWarnings = (validationResult) => {
  if (validationResult?.data?.warnings) {
    return validationResult.data.warnings.map(warning => warning.message || warning);
  }
  
  return [];
};

/**
 * Get stock status for display (out_of_stock, low_stock, in_stock)
 * @param {Object} stockInfo - Stock information from API
 * @returns {Object} Status information for UI
 */
export const getStockStatusInfo = (stockInfo) => {
  const status = stockInfo?.stock_status || 'unknown';
  
  const statusConfig = {
    out_of_stock: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Out of Stock',
      icon: '❌',
      canSell: false
    },
    low_stock: {
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      label: 'Low Stock',
      icon: '⚠️',
      canSell: true
    },
    in_stock: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'In Stock',
      icon: '✅',
      canSell: true
    },
    unknown: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Unknown',
      icon: '❓',
      canSell: false
    }
  };
  
  return {
    ...statusConfig[status],
    currentStock: stockInfo?.current_stock || 0,
    threshold: stockInfo?.low_stock_threshold || 10
  };
};