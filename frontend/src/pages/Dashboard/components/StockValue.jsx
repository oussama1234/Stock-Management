// src/pages/Dashboard/components/StockValue.jsx
// Displays accurate stock values with retail, cost, and potential profit

import React from "react";
import { Warehouse, TrendingUp, Package, DollarSign } from "lucide-react";
import { fmtCurrency } from "../utils";

const StockValue = React.memo(function StockValue({ 
  retail = 0, 
  cost = 0, 
  potential_profit = 0, 
  profit_margin_percent = 0,
  stock_products_count = 0 
}) {
  // Calculate potential profit if not provided
  const potentialProfit = potential_profit || (retail - cost);
  const profitMargin = profit_margin_percent || (retail > 0 ? ((potentialProfit / retail) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="text-sm text-gray-600 mb-4 leading-relaxed">
        <div className="flex items-center mb-2">
          <Package className="h-4 w-4 mr-2 text-gray-500" />
          <span className="font-medium">{stock_products_count} products</span> currently in stock
        </div>
        Stock values calculated using weighted average purchase prices
      </div>
      
      {/* Main Values Grid */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Retail Value */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 group hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Retail Value</div>
                <div className="text-xs text-blue-500">Potential revenue if sold at retail price</div>
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{fmtCurrency(retail)}</div>
        </div>

        {/* Cost Value */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5 group hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="bg-emerald-500 p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                <Warehouse className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Cost Value</div>
                <div className="text-xs text-emerald-500">Total investment based on purchase prices</div>
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{fmtCurrency(cost)}</div>
        </div>
      </div>

      {/* Profit Metrics */}
      <div className="grid grid-cols-1 gap-4">
        {/* Potential Profit */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 group hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-purple-500 p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Potential Profit</div>
                <div className="text-lg font-bold text-purple-900">{fmtCurrency(potentialProfit)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                profitMargin >= 30 
                  ? 'bg-green-100 text-green-800' 
                  : profitMargin >= 20 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profitMargin.toFixed(1)}% margin
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-gray-800">Inventory Health</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            profitMargin >= 25 ? 'bg-green-100 text-green-700' :
            profitMargin >= 15 ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {profitMargin >= 25 ? '💚 Excellent' :
             profitMargin >= 15 ? '💙 Good' :
             '💛 Needs attention'}
          </div>
        </div>
      </div>
    </div>
  );
});

export default StockValue;
