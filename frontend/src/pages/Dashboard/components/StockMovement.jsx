// src/pages/Dashboard/components/StockMovement.jsx
// Beautiful stock movements visualization with enhanced UX and date information

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Package, 
  ArrowUp, 
  ArrowDown,
  Activity,
  BarChart3,
  Plus,
  Minus
} from "lucide-react";
import { fmtNumber } from "../utils";

const StockMovement = React.memo(function StockMovement({ rows = [] }) {
  const stats = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    
    const totalIn = rows.reduce((sum, r) => sum + Number(r.in_qty || 0), 0);
    const totalOut = rows.reduce((sum, r) => sum + Number(r.out_qty || 0), 0);
    const netMovement = totalIn - totalOut;
    const mostActiveDay = rows.reduce((max, current) => {
      const currentTotal = Number(current.in_qty || 0) + Number(current.out_qty || 0);
      const maxTotal = Number(max.in_qty || 0) + Number(max.out_qty || 0);
      return currentTotal > maxTotal ? current : max;
    }, rows[0]);
    
    return { totalIn, totalOut, netMovement, mostActiveDay };
  }, [rows]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-3xl p-8 text-center border border-gray-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gradient-to-r from-gray-400 to-slate-500 p-4 rounded-2xl">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">No Stock Movements</h3>
            <p className="text-gray-600">Stock movements will appear here when you make purchases or sales</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-4 border border-emerald-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Stock In</p>
              <p className="text-xl font-bold text-emerald-800">{fmtNumber(stats.totalIn)}</p>
            </div>
            <div className="bg-emerald-500 p-2 rounded-xl">
              <ArrowUp className="h-5 w-5 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-4 border border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Stock Out</p>
              <p className="text-xl font-bold text-red-800">{fmtNumber(stats.totalOut)}</p>
            </div>
            <div className="bg-red-500 p-2 rounded-xl">
              <ArrowDown className="h-5 w-5 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`bg-gradient-to-br rounded-2xl p-4 border ${
            stats.netMovement >= 0 
              ? 'from-blue-50 to-indigo-100 border-blue-200' 
              : 'from-orange-50 to-amber-100 border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                stats.netMovement >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>Net Change</p>
              <p className={`text-xl font-bold ${
                stats.netMovement >= 0 ? 'text-blue-800' : 'text-orange-800'
              }`}>
                {stats.netMovement >= 0 ? '+' : ''}{fmtNumber(stats.netMovement)}
              </p>
            </div>
            <div className={`p-2 rounded-xl ${
              stats.netMovement >= 0 ? 'bg-blue-500' : 'bg-orange-500'
            }`}>
              {stats.netMovement >= 0 ? <Plus className="h-5 w-5 text-white" /> : <Minus className="h-5 w-5 text-white" />}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-4 border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Most Active</p>
              <p className="text-sm font-bold text-purple-800">{formatDate(stats.mostActiveDay.date)}</p>
            </div>
            <div className="bg-purple-500 p-2 rounded-xl">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Daily Movement Cards */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {rows.map((day, index) => {
          const inQty = Number(day.in_qty || 0);
          const outQty = Number(day.out_qty || 0);
          const totalActivity = inQty + outQty;
          const netChange = inQty - outQty;
          
          if (totalActivity === 0) return null; // Skip days with no activity
          
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-r from-white via-gray-50/50 to-slate-50/50 rounded-2xl p-4 border border-gray-200/60 hover:border-indigo-300/60 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                {/* Date */}
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{formatDate(day.date)}</h4>
                    <p className="text-xs text-gray-600">
                      {totalActivity} total movements
                    </p>
                  </div>
                </div>
                
                {/* Movement Details */}
                <div className="flex items-center space-x-4">
                  {inQty > 0 && (
                    <div className="flex items-center space-x-2 bg-emerald-100 rounded-lg px-3 py-1">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">
                        +{fmtNumber(inQty)}
                      </span>
                    </div>
                  )}
                  
                  {outQty > 0 && (
                    <div className="flex items-center space-x-2 bg-red-100 rounded-lg px-3 py-1">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        -{fmtNumber(outQty)}
                      </span>
                    </div>
                  )}
                  
                  {/* Net Change */}
                  <div className={`text-sm font-bold ${
                    netChange > 0 ? 'text-emerald-600' :
                    netChange < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {netChange > 0 ? '+' : ''}{fmtNumber(netChange)}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-gray-800">Summary</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Net Stock Change</p>
            <p className={`text-lg font-bold ${
              stats.netMovement >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {stats.netMovement >= 0 ? '+' : ''}{fmtNumber(stats.netMovement)} items
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
});

export default StockMovement;
