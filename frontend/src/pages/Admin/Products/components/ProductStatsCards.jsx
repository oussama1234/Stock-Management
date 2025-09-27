import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useProductData } from '../context/ProductDataContext';
import { useFormatters } from '../hooks/useFormatters';
import { useStockValidation } from '../hooks/useStockValidation';

const StatCard = memo(({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'blue',
  delay = 0,
  onClick 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-green-600',
    red: 'from-red-500 to-rose-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-violet-600',
    gray: 'from-gray-500 to-slate-600'
  };

  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border-0 p-4 ${
        onClick ? 'cursor-pointer' : ''
      } transition-all duration-300 text-sm`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-2 truncate" title={title}>{title}</p>
          <p className="text-lg md:text-xl font-bold text-gray-900 mb-1 leading-tight truncate" title={String(value)}>
            <span className="block max-w-full truncate">{value}</span>
          </p>
          
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}

          {trend && trendValue && trendIcon && (
            <div className="mt-1 flex items-center space-x-1">
              {React.createElement(trendIcon, { 
                className: `h-3.5 w-3.5 ${trendColor}` 
              })}
              <span className={`text-xs font-medium ${trendColor}`}>
                {trendValue}
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={`shrink-0 p-2 bg-gradient-to-r ${colorClasses[color]} rounded-xl shadow-lg`}>
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
});

const ProductStatsCards = memo(() => {
  const { 
    product, 
    analytics, 
    isLoading,
    error,
    sales,
    purchases
  } = useProductData();
  
  const { formatCurrency, formatCompactCurrency, formatNumber, formatPercentage, formatCompactNumber } = useFormatters();
  // Use stock if present, otherwise fall back to quantity
  const currentStock = (typeof product?.stock === 'number') 
    ? product.stock 
    : (typeof product?.quantity === 'number' ? product.quantity : 0);
  
  const { stockStatus } = useStockValidation(currentStock);

  if (isLoading || !product) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <p className="text-red-700 font-medium">Error loading product statistics</p>
        </div>
      </motion.div>
    );
  }

  // Calculate derived statistics with robust fallbacks to match context analytics keys
  const totalSalesValue = analytics?.totalSalesValue ?? 0;
  const totalPurchasesValue = analytics?.totalPurchaseValue ?? 0; // context provides totalPurchaseValue
  const totalUnitsSold = analytics?.totalSaleQuantity ?? (sales?.reduce((sum, s) => sum + (s?.quantity || 0), 0) || 0);
  const totalUnitsPurchased = analytics?.totalPurchaseQuantity ?? (purchases?.reduce((sum, p) => sum + (p?.quantity || 0), 0) || 0);
  const profitValue = (analytics?.profitValue ?? (totalSalesValue - totalPurchasesValue)) || 0;
  const profitMargin = totalSalesValue > 0 ? ((profitValue) / totalSalesValue) * 100 : 0;
  const turnoverRate = currentStock > 0 && totalUnitsSold > 0 ? (totalUnitsSold / currentStock) : 0;

  // Stock status configuration
  const stockColor = stockStatus.level === 'good' ? 'green' : 
                    stockStatus.level === 'low' ? 'amber' : 'red';

  const stockIcon = stockStatus.level === 'good' ? CheckCircle :
                   stockStatus.level === 'low' ? Clock : AlertTriangle;

  const statsData = [
    {
      title: 'Current Stock',
      value: formatCompactNumber(currentStock || 0),
      icon: stockIcon,
      color: stockColor,
      trend: analytics?.stockTrend,
      trendValue: analytics?.stockTrendValue ? `${analytics.stockTrendValue}%` : null,
    },
    {
      title: 'Revenue',
      value: formatCompactCurrency(totalSalesValue),
      subtitle: `${formatNumber(totalUnitsSold)} units sold`,
      icon: DollarSign,
      color: 'green',
      trend: analytics?.salesTrend,
      trendValue: analytics?.salesTrendValue ? `${analytics.salesTrendValue}%` : null,
    },
    {
      title: 'Profit',
      value: formatCompactCurrency(profitValue),
      subtitle: `Margin ${formatPercentage(profitMargin)}`,
      icon: BarChart3,
      color: profitValue >= 0 ? 'green' : 'red',
      trend: analytics?.profitTrend,
      trendValue: analytics?.profitTrendValue ? `${analytics.profitTrendValue}%` : null,
    },
    {
      title: 'Units Sold',
      value: formatCompactNumber(totalUnitsSold),
      subtitle: analytics?.salesVelocity ? `${analytics.salesVelocity} / mo` : undefined,
      icon: TrendingUp,
      color: 'blue',
      trend: analytics?.unitsSoldTrend,
      trendValue: analytics?.unitsSoldTrendValue ? `${analytics.unitsSoldTrendValue}%` : null,
    },
    {
      title: 'Cost',
      value: formatCompactCurrency(totalPurchasesValue),
      subtitle: `${formatCompactNumber(totalUnitsPurchased)} units bought`,
      icon: Package,
      color: 'purple',
      trend: analytics?.purchasesTrend,
      trendValue: analytics?.purchasesTrendValue ? `${analytics.purchasesTrendValue}%` : null,
    },
    {
      title: 'Profit Margin',
      value: formatPercentage(profitMargin),
      icon: BarChart3,
      color: profitMargin > 20 ? 'green' : profitMargin > 10 ? 'amber' : 'red',
      trend: analytics?.profitMarginTrend,
      trendValue: analytics?.profitMarginTrendValue ? `${analytics.profitMarginTrendValue}%` : null,
    },
    {
      title: 'Avg Sale Price',
      value: totalUnitsSold > 0 ? formatCompactCurrency(totalSalesValue / totalUnitsSold) : formatCompactCurrency(0),
      subtitle: totalUnitsSold > 0 ? `${formatCurrency(totalSalesValue)} / ${formatNumber(totalUnitsSold)} units` : undefined,
      icon: DollarSign,
      color: 'blue',
      trend: analytics?.avgPriceTrend,
      trendValue: analytics?.avgPriceTrendValue ? `${analytics.avgPriceTrendValue}%` : null,
    },
    {
      title: 'Turnover Rate',
      value: formatNumber(turnoverRate, 2) + 'x',
      icon: TrendingUp,
      color: turnoverRate > 2 ? 'green' : turnoverRate > 1 ? 'amber' : 'red',
      trend: analytics?.turnoverTrend,
      trendValue: analytics?.turnoverTrendValue ? `${analytics.turnoverTrendValue}%` : null,
    },
    {
      title: 'Days in Stock',
      value: analytics?.daysInStock ? `${analytics.daysInStock} days` : 'N/A',
      icon: Clock,
      color: 'gray',
      trend: analytics?.daysInStockTrend,
      trendValue: analytics?.daysInStockTrendValue ? `${analytics.daysInStockTrendValue}%` : null,
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsData.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            trendValue={stat.trendValue}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Stock Warning Alert */}
      {(stockStatus.level === 'low' || stockStatus.level === 'out') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`mt-6 p-4 rounded-2xl border-2 ${
            stockStatus.level === 'out' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-xl ${
              stockStatus.level === 'out' 
                ? 'bg-red-100' 
                : 'bg-amber-100'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                stockStatus.level === 'out' 
                  ? 'text-red-600' 
                  : 'text-amber-600'
              }`} />
            </div>
            <div>
              <h3 className={`font-semibold ${
                stockStatus.level === 'out' 
                  ? 'text-red-800' 
                  : 'text-amber-800'
              }`}>
                {stockStatus.level === 'out' ? 'Out of Stock' : 'Low Stock Warning'}
              </h3>
              <p className={`text-sm mt-1 ${
                stockStatus.level === 'out' 
                  ? 'text-red-700' 
                  : 'text-amber-700'
              }`}>
                {stockStatus.level === 'out' 
                  ? `This product is out of stock. Please restock to continue selling.`
                  : `This product is running low on stock (${currentStock} units remaining). Consider restocking soon.`
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

ProductStatsCards.displayName = 'ProductStatsCards';
StatCard.displayName = 'StatCard';

export default ProductStatsCards;