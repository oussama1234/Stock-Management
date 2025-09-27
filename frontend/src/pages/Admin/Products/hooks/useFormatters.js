import { useCallback } from 'react';

/**
 * Custom hook for formatting utilities with memoized functions
 * @returns {object} - Formatting functions
 */
export const useFormatters = () => {
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount) || 0);
  }, []);

  const formatCompactCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1
    }).format(Number(amount) || 0);
  }, []);

  const formatDate = useCallback((dateString) => {
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
  }, []);

  const formatNumber = useCallback((number) => {
    return new Intl.NumberFormat("en-US").format(Number(number) || 0);
  }, []);

  const formatPercentage = useCallback((value, decimals = 1) => {
    return `${(Number(value) || 0).toFixed(decimals)}%`;
  }, []);

  const formatCompactNumber = useCallback((number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(Number(number) || 0);
  }, []);

  return {
    formatCurrency,
    formatCompactCurrency,
    formatDate,
    formatNumber,
    formatPercentage,
    formatCompactNumber
  };
};
