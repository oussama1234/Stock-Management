// src/hooks/useStockValidation.js
// Custom hook for real-time stock validation in the frontend

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  validateProductStock, 
  getProductStockInfo,
  isStockValidationValid,
  getStockValidationError,
  getStockValidationWarnings,
  getStockStatusInfo
} from '@/api/StockValidation';
import { useToast } from '@/components/Toaster/ToastContext';

/**
 * Custom hook for stock validation
 */
export default function useStockValidation() {
  const [validationState, setValidationState] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const validationTimeouts = useRef({});

  /**
   * Clear validation timeout for a specific key
   */
  const clearValidationTimeout = useCallback((key) => {
    if (validationTimeouts.current[key]) {
      clearTimeout(validationTimeouts.current[key]);
      delete validationTimeouts.current[key];
    }
  }, []);

  /**
   * Validate stock for a single product with debouncing
   */
  const validateProductStockDebounced = useCallback(async (productId, quantity, options = {}) => {
    const { 
      debounceMs = 500, 
      showToast = false, 
      key = `${productId}_${quantity}`,
      onSuccess,
      onError 
    } = options;

    // Clear existing timeout for this key
    clearValidationTimeout(key);

    // Set loading state
    setValidationState(prev => ({
      ...prev,
      [key]: { ...prev[key], loading: true, error: null }
    }));

    return new Promise((resolve) => {
      validationTimeouts.current[key] = setTimeout(async () => {
        try {
          setLoading(true);
          const result = await validateProductStock(productId, quantity);
          
          const validationData = {
            valid: isStockValidationValid(result),
            error: getStockValidationError(result),
            warnings: getStockValidationWarnings(result),
            data: result.data,
            loading: false
          };

          setValidationState(prev => ({
            ...prev,
            [key]: validationData
          }));

          if (validationData.valid) {
            if (showToast && validationData.warnings.length > 0) {
              validationData.warnings.forEach(warning => toast.warning(warning));
            }
            onSuccess?.(validationData);
          } else {
            if (showToast) {
              toast.error(validationData.error || 'Stock validation failed');
            }
            onError?.(validationData);
          }

          resolve(validationData);
        } catch (error) {
          const errorData = {
            valid: false,
            error: error.message || 'Validation failed',
            warnings: [],
            data: null,
            loading: false
          };

          setValidationState(prev => ({
            ...prev,
            [key]: errorData
          }));

          if (showToast) {
            toast.error(errorData.error);
          }
          
          onError?.(errorData);
          resolve(errorData);
        } finally {
          setLoading(false);
          delete validationTimeouts.current[key];
        }
      }, debounceMs);
    });
  }, [clearValidationTimeout, toast]);

  /**
   * Get current stock information for a product
   */
  const getStockInfo = useCallback(async (productId, options = {}) => {
    const { showToast = false, onSuccess, onError } = options;

    try {
      setLoading(true);
      const result = await getProductStockInfo(productId);
      
      if (result.success) {
        const stockInfo = getStockStatusInfo(result.data);
        onSuccess?.({ stockInfo, rawData: result.data });
        return { stockInfo, rawData: result.data };
      } else {
        const error = result.message || 'Failed to get stock information';
        if (showToast) toast.error(error);
        onError?.(error);
        return null;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to get stock information';
      if (showToast) toast.error(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Validate stock for an array of items (for multi-item validation)
   */
  const validateItems = useCallback(async (items, options = {}) => {
    const { showToast = false, onSuccess, onError } = options;

    try {
      setLoading(true);
      const promises = items.map(item => 
        validateProductStockDebounced(item.product_id, item.quantity, {
          debounceMs: 0, // No debounce for batch validation
          showToast: false
        })
      );

      const results = await Promise.all(promises);
      
      const hasErrors = results.some(result => !result.valid);
      const allErrors = results.filter(result => !result.valid).map(result => result.error);
      const allWarnings = results.flatMap(result => result.warnings);

      const validationSummary = {
        valid: !hasErrors,
        errors: allErrors,
        warnings: allWarnings,
        results: results
      };

      if (!hasErrors) {
        if (showToast && allWarnings.length > 0) {
          allWarnings.forEach(warning => toast.warning(warning));
        }
        onSuccess?.(validationSummary);
      } else {
        if (showToast) {
          allErrors.forEach(error => toast.error(error));
        }
        onError?.(validationSummary);
      }

      return validationSummary;
    } catch (error) {
      const errorMessage = error.message || 'Batch validation failed';
      if (showToast) toast.error(errorMessage);
      onError?.(errorMessage);
      return {
        valid: false,
        errors: [errorMessage],
        warnings: [],
        results: []
      };
    } finally {
      setLoading(false);
    }
  }, [validateProductStockDebounced, toast]);

  /**
   * Get validation state for a specific key
   */
  const getValidationState = useCallback((key) => {
    return validationState[key] || { valid: true, error: null, warnings: [], loading: false };
  }, [validationState]);

  /**
   * Clear validation state for a specific key or all states
   */
  const clearValidationState = useCallback((key = null) => {
    if (key) {
      clearValidationTimeout(key);
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      Object.keys(validationTimeouts.current).forEach(clearValidationTimeout);
      setValidationState({});
    }
  }, [clearValidationTimeout]);

  /**
   * Check if any validation is currently loading
   */
  const isAnyLoading = useCallback(() => {
    return loading || Object.values(validationState).some(state => state.loading);
  }, [loading, validationState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(validationTimeouts.current).forEach(key => {
        if (validationTimeouts.current[key]) {
          clearTimeout(validationTimeouts.current[key]);
        }
      });
    };
  }, []);

  return {
    validateProductStock: validateProductStockDebounced,
    validateItems,
    getStockInfo,
    getValidationState,
    clearValidationState,
    isLoading: isAnyLoading,
    validationState
  };
}