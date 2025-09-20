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
  // Calculate some basic analytics from the data
  const totalSales = data?.financials?.total_sales_amount || 0;
  const salesCount = data?.counts?.sales || 0;
  const avgOrderValue = data?.financials?.avg_order_value || 0;
  const salesDelta = data?.financials?.sales_delta_pct || 0;

  // Calculate trend direction
  const trendDirection = salesSeries.length >= 2 ? 
    (salesSeries[salesSeries.length - 1] > salesSeries[0] ? 'up' : 'down') : 'neutral';

  return (
    <SectionCard
      title={`Sales Analytics (last ${rangeDays}d)`}
      Icon={TrendingUp}
      subtitle={`${fmtNumber(salesCount)} transactions • ${fmtCurrency(avgOrderValue)} avg`}
    >
      <div className="space-y-4">
        {/* Main trend chart */}
        <div className="relative">
          <SparkLine values={salesSeries} color="#6366f1" height={120} />
          
          {/* Trend indicator */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium ${
            trendDirection === 'up' ? 'bg-emerald-100 text-emerald-700' :
            trendDirection === 'down' ? 'bg-rose-100 text-rose-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {trendDirection === 'up' && '↗'}
            {trendDirection === 'down' && '↘'}
            {trendDirection === 'neutral' && '→'}
            {' '}
            {salesDelta >= 0 ? '+' : ''}{salesDelta}%
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-600 font-medium">Total Revenue</div>
                <div className="text-lg font-bold text-blue-900">{fmtCurrency(totalSales)}</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-violet-50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-violet-600 font-medium">Transactions</div>
                <div className="text-lg font-bold text-violet-900">{fmtNumber(salesCount)}</div>
              </div>
              <div className="p-2 bg-violet-100 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance indicator */}
        <div className="flex items-center justify-center pt-2">
          <div className={`text-xs px-3 py-1 rounded-full ${
            salesDelta >= 10 ? 'bg-emerald-100 text-emerald-700' :
            salesDelta >= 0 ? 'bg-blue-100 text-blue-700' :
            salesDelta >= -10 ? 'bg-amber-100 text-amber-700' :
            'bg-rose-100 text-rose-700'
          }`}>
            {salesDelta >= 10 ? '🚀 Excellent growth' :
             salesDelta >= 0 ? '📈 Positive trend' :
             salesDelta >= -10 ? '⚠️ Slight decline' :
             '📉 Needs attention'}
          </div>
        </div>
      </div>
    </SectionCard>
  );
});

export default SalesAnalyticsChart;