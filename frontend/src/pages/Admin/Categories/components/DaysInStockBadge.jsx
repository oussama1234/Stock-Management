// src/pages/Admin/Categories/components/DaysInStockBadge.jsx
import React from 'react';
import { Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

/**
 * Enhanced badge component for displaying average days in stock
 * with color coding and performance indicators
 */
export default function DaysInStockBadge({ days, showIcon = true, size = 'sm' }) {
  // Ensure days is a valid number and cap at 365
  const validDays = Math.min(365, Math.max(0, Number(days) || 0));
  const roundedDays = Math.round(validDays);
  
  // Determine performance category
  const getPerformance = () => {
    if (roundedDays <= 30) {
      return {
        label: 'Fast',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: TrendingUp,
        description: 'Excellent turnover'
      };
    } else if (roundedDays <= 60) {
      return {
        label: 'Good',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: TrendingUp,
        description: 'Good turnover'
      };
    } else if (roundedDays <= 90) {
      return {
        label: 'Moderate',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: Clock,
        description: 'Average turnover'
      };
    } else if (roundedDays <= 180) {
      return {
        label: 'Slow',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: TrendingDown,
        description: 'Slow turnover'
      };
    } else if (roundedDays < 365) {
      return {
        label: 'Very Slow',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: AlertCircle,
        description: 'Very slow turnover'
      };
    } else {
      return {
        label: 'Stagnant',
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: AlertCircle,
        description: 'No recent sales'
      };
    }
  };
  
  const performance = getPerformance();
  const Icon = performance.icon;
  
  // Size classes
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2'
  };
  
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  // Format display text
  const displayText = roundedDays >= 365 ? '365+' : roundedDays.toString();
  
  return (
    <div className="inline-flex items-center">
      <div 
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${sizeClasses[size]}
          ${performance.color}
          ${performance.bg}
          ${performance.border}
          border transition-all duration-200
          hover:shadow-sm
        `}
        title={`${performance.description}: ${roundedDays} days average in stock`}
      >
        {showIcon && (
          <Icon className={`${iconSizes[size]} opacity-70`} />
        )}
        <span className="font-semibold">{displayText}d</span>
        {size !== 'xs' && (
          <span className="text-opacity-80 ml-0.5">
            ({performance.label.toLowerCase()})
          </span>
        )}
      </div>
    </div>
  );
}

// Export utility function for use in other components
export const getDaysInStockStatus = (days) => {
  const validDays = Math.min(365, Math.max(0, Number(days) || 0));
  const roundedDays = Math.round(validDays);
  
  if (roundedDays <= 30) return 'fast';
  if (roundedDays <= 60) return 'good';
  if (roundedDays <= 90) return 'moderate';
  if (roundedDays <= 180) return 'slow';
  if (roundedDays < 365) return 'very-slow';
  return 'stagnant';
};