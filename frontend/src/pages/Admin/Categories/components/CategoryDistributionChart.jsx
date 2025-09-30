// src/pages/Admin/Categories/components/CategoryDistributionChart.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon, ListTree } from 'lucide-react';

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export default function CategoryDistributionChart({ data = [] }) {
  const chartData = useMemo(() => {
    // Filter out zero values and sort by absolute profit
    const filtered = data.filter(item => (item.profit || 0) !== 0);
    
    if (filtered.length === 0) return [];
    
    // Calculate total for proper percentage calculation
    const total = filtered.reduce((sum, item) => sum + Math.abs(item.profit || 0), 0);
    
    // Sort by absolute profit value
    const sorted = filtered.sort((a, b) => Math.abs(b.profit || 0) - Math.abs(a.profit || 0));
    
    // Take top 6 categories and group rest as "Others"
    const top = sorted.slice(0, 6);
    const others = sorted.slice(6);
    
    const result = top.map(item => ({
      name: item.name,
      value: Math.abs(item.profit || 0),
      profit: item.profit || 0,
      percent: (Math.abs(item.profit || 0) / total) * 100
    }));
    
    if (others.length > 0) {
      const othersTotal = others.reduce((sum, item) => sum + Math.abs(item.profit || 0), 0);
      result.push({
        name: 'Others',
        value: othersTotal,
        profit: othersTotal,
        percent: (othersTotal / total) * 100
      });
    }
    
    return result;
  }, [data]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 backdrop-blur-sm">
          <p className="font-bold text-gray-800 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Profit: <span className={`font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${data.value.toFixed(2)}
              </span>
            </p>
            <p className="text-gray-600">
              Share: <span className="font-bold text-blue-600">{data.percent.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show labels for slices that are 5% or larger
    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-sm font-bold drop-shadow-lg"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-gray-400"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/><path d="M12 6a6 6 0 1 1-6 6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
          </div>
          <p className="text-gray-500 text-sm">No profit data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Left Panel: Profit Distribution */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100">
              <PieIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Profit Distribution</h4>
              <p className="text-xs text-gray-500">By category</p>
            </div>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="relative" style={{ width: 300, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={110}
                  innerRadius={70}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={900}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Panel: Category Breakdown */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100">
              <ListTree className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Category Breakdown</h4>
              <p className="text-xs text-gray-500">Top segments by profit contribution</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          {chartData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-800 truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-500 font-medium">{item.percent.toFixed(1)}%</span>
                <span className={`text-sm font-bold tabular-nums ${item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${item.value.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600 flex items-center justify-between">
          <span>Categories: <strong className="text-gray-800">{chartData.length}</strong></span>
          <span>Total: <strong className="text-gray-800">${chartData.reduce((s, i) => s + i.value, 0).toLocaleString()}</strong></span>
        </div>
      </div>
    </div>
  );
  
}