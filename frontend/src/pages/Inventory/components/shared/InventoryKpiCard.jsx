// src/pages/Inventory/components/shared/InventoryKpiCard.jsx
// High-performance KPI card with beautiful modern design and animations
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CountUpAnimation = memo(({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = (value || 0) - startValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const currentValue = startValue + (diff * progress);

      setDisplayValue(Math.floor(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, displayValue]);

  return <span>{new Intl.NumberFormat().format(displayValue)}</span>;
});

CountUpAnimation.displayName = 'CountUpAnimation';

const InventoryKpiCard = memo(function InventoryKpiCard({
  title,
  value,
  previousValue,
  icon: Icon,
  variant = 'primary',
  format = 'number',
  suffix = '',
  subtitle,
  trend,
  className = '',
  animationDelay = 0
}) {
  // Calculate trend if not provided
  const calculatedTrend = React.useMemo(() => {
    if (trend !== undefined) return trend;
    if (previousValue === undefined || previousValue === null) return null;
    
    const current = Number(value || 0);
    const previous = Number(previousValue || 0);
    
    if (previous === 0) return current > 0 ? 'up' : current < 0 ? 'down' : 'neutral';
    
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.1) return 'neutral';
    
    return change > 0 ? 'up' : 'down';
  }, [value, previousValue, trend]);

  // Variant configurations
  const variants = {
    primary: {
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    success: {
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    warning: {
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    danger: {
      gradient: 'from-red-500 to-rose-600',
      iconBg: 'from-red-100 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    info: {
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400'
    },
    purple: {
      gradient: 'from-purple-500 to-violet-600',
      iconBg: 'from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  };

  const variantConfig = variants[variant] || variants.primary;

  // Format value
  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val || 0);
    }
    
    if (format === 'percentage') {
      return `${(val || 0).toFixed(1)}%`;
    }
    
    return new Intl.NumberFormat().format(val || 0);
  };

  const displayValue = format === 'number' ? value : formatValue(value);

  // Trend indicator
  const TrendIcon = calculatedTrend === 'up' ? TrendingUp : calculatedTrend === 'down' ? TrendingDown : Minus;
  const trendColor = calculatedTrend === 'up' ? 'text-emerald-500' : calculatedTrend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: animationDelay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`
        relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800
        border border-gray-200/60 dark:border-gray-700/60
        shadow-sm hover:shadow-lg transition-all duration-300
        backdrop-blur-sm
        ${className}
      `}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${variantConfig.gradient} opacity-[0.02]`} />
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          {/* Left side - Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${variantConfig.iconBg} shadow-sm`}>
                <Icon className={`w-6 h-6 ${variantConfig.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Value display */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {format === 'number' ? (
                  <CountUpAnimation value={value} />
                ) : (
                  displayValue
                )}
                {suffix && (
                  <span className="text-base font-normal text-gray-500 ml-1">
                    {suffix}
                  </span>
                )}
              </span>
              
              {/* Trend indicator */}
              {calculatedTrend && calculatedTrend !== 'neutral' && (
                <div className="flex items-center">
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar or additional info can go here */}
        <div className={`w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, delay: animationDelay + 0.2 }}
            className={`h-full bg-gradient-to-r ${variantConfig.gradient} opacity-20`}
          />
        </div>
      </div>
    </motion.div>
  );
});

export default InventoryKpiCard;