import { useCallback, useMemo } from 'react';

/**
 * Custom hook for stock validation with quantity checks
 * @param {number} availableStock - Current available stock
 * @returns {object} - Validation functions and stock status
 */
export const useStockValidation = (availableStock = 0) => {
  const stockStatus = useMemo(() => {
    if (availableStock === 0) {
      return { 
        text: "Out of Stock", 
        color: "bg-red-100 text-red-800 border-red-200",
        canSell: false,
        level: 'out'
      };
    }
    if (availableStock < 10) {
      return { 
        text: "Low Stock", 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        canSell: true,
        level: 'low'
      };
    }
    return { 
      text: "In Stock", 
      color: "bg-green-100 text-green-800 border-green-200",
      canSell: true,
      level: 'good'
    };
  }, [availableStock]);

  const validateQuantity = useCallback((quantity) => {
    const qty = parseInt(quantity) || 0;
    
    if (qty <= 0) {
      return {
        isValid: false,
        error: "Quantity must be greater than 0"
      };
    }
    
    if (qty > availableStock) {
      return {
        isValid: false,
        error: `Cannot exceed available stock (${availableStock} units)`
      };
    }
    
    if (!stockStatus.canSell) {
      return {
        isValid: false,
        error: "Cannot sell - product is out of stock"
      };
    }
    
    return {
      isValid: true,
      error: null
    };
  }, [availableStock, stockStatus.canSell]);

  const getMaxAllowedQuantity = useCallback(() => {
    return stockStatus.canSell ? availableStock : 0;
  }, [availableStock, stockStatus.canSell]);

  const getStockWarning = useCallback((quantity) => {
    const qty = parseInt(quantity) || 0;
    
    if (qty > availableStock * 0.8) {
      return {
        level: 'high',
        message: `Warning: This sale will significantly reduce stock levels (${availableStock - qty} remaining)`
      };
    }
    
    if (qty > availableStock * 0.5) {
      return {
        level: 'medium',
        message: `Notice: This sale will use more than half the available stock`
      };
    }
    
    return null;
  }, [availableStock]);

  return {
    stockStatus,
    validateQuantity,
    getMaxAllowedQuantity,
    getStockWarning,
    availableStock
  };
};