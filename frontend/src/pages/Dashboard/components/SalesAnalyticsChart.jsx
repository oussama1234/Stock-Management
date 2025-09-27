// src/pages/Dashboard/components/SalesAnalyticsChart.jsx
// Sales analytics chart component showing sales trends and revenue breakdown
// Lightweight SVG-based chart with memoization for performance

import React from "react";
import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import SectionCard from "./SectionCard";
import SparkLine from "./SparkLine";
import { fmtCurrency, fmtNumber } from "../utils";

const SalesAnalyticsChart = React.memo(function SalesAnalyticsChart({ 
  salesSeries = [], 
  data = {}, 
  rangeDays = 30 
}) {
  // Use accurate sales data if available, fallback to regular data
  const accurateSales = data?.accurate_sales;
  const totalSales = accurateSales?.total_sales || data?.financials?.total_sales_amount || 0;
  const salesCount = accurateSales?.total_orders || data?.counts?.sales || 0;
  const avgOrderValue = accurateSales?.average_order_value || data?.financials?.avg_order_value || 0;
  const totalItemsSold = accurateSales?.total_items_sold || 0;
  const salesDelta = data?.financials?.sales_delta_pct || 0;

  // Calculate trend direction and get date range
  const trendDirection = salesSeries.length >= 2 ? 
    (salesSeries[salesSeries.length - 1] > salesSeries[0] ? 'up' : 'down') : 'neutral';
  
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - rangeDays);
    
    return {
      start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };
  
  const dateRange = getDateRange();

  return (
    <div className="space-y-4">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-xl">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Sales Analytics</h3>
            <p className="text-xs text-gray-600">
              {dateRange.start} - {dateRange.end} • {rangeDays} days
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
          trendDirection === 'up' ? 'bg-emerald-100 text-emerald-700' :
          trendDirection === 'down' ? 'bg-rose-100 text-rose-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {trendDirection === 'up' && '📈'}
          {trendDirection === 'down' && '📉'}
          {trendDirection === 'neutral' && '➡️'}
          <span>{salesDelta >= 0 ? '+' : ''}{salesDelta}%</span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl p-4 border border-indigo-200/30">
        <div className="relative">
          <SparkLine values={salesSeries} color="#6366f1" height={100} />
          
          {/* Chart Labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{dateRange.start}</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Revenue</div>
              <div className="text-lg font-bold text-blue-900">{fmtCurrency(totalSales)}</div>
            </div>
            <div className="bg-blue-500 p-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-xl p-3 border border-violet-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-violet-600 font-semibold uppercase tracking-wide">Orders</div>
              <div className="text-lg font-bold text-violet-900">{fmtNumber(salesCount)}</div>
            </div>
            <div className="bg-violet-500 p-2 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-3 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Avg Value</div>
              <div className="text-lg font-bold text-emerald-900">{fmtCurrency(avgOrderValue)}</div>
            </div>
            <div className="bg-emerald-500 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${
              salesDelta >= 10 ? 'bg-emerald-500' :
              salesDelta >= 0 ? 'bg-blue-500' :
              salesDelta >= -10 ? 'bg-amber-500' :
              'bg-red-500'
            }`}>
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Performance Status</p>
              <p className="text-xs text-gray-600">{totalItemsSold > 0 ? `${fmtNumber(totalItemsSold)} items sold` : 'Track your sales progress'}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            salesDelta >= 10 ? 'bg-emerald-100 text-emerald-700' :
            salesDelta >= 0 ? 'bg-blue-100 text-blue-700' :
            salesDelta >= -10 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {salesDelta >= 10 ? '🚀 Excellent' :
             salesDelta >= 0 ? '📈 Growing' :
             salesDelta >= -10 ? '⚠️ Stable' :
             '🔻 Declining'}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SalesAnalyticsChart;
