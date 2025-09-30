// src/pages/Inventory/components/charts/AdjustmentsChart.jsx
// Line chart for adjustment trends
import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getInventoryHistory } from '@/api/Inventory';

const AdjustmentsChart = memo(function AdjustmentsChart() {
  // Start with sample data for immediate display
  const [data, setData] = useState([
    { date: '2024-01-22', positive: 5, negative: 2 },
    { date: '2024-01-23', positive: 3, negative: 4 },
    { date: '2024-01-24', positive: 8, negative: 1 },
    { date: '2024-01-25', positive: 2, negative: 6 },
    { date: '2024-01-26', positive: 7, negative: 3 },
    { date: '2024-01-27', positive: 4, negative: 2 },
    { date: '2024-01-28', positive: 6, negative: 5 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(true);
  const abortRef = useRef(null);

  const fetchChartData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      console.log('🔄 [AdjustmentsChart] Attempting to fetch chart data...');
      setLoading(true);
      setError(null);

      const response = await getInventoryHistory({
        limit: 50, // Get more data for charting
        date_range: 'last_7_days'
      });

      console.log('📊 [AdjustmentsChart] Raw API response:', response);

      // Process data to group by date and count positive/negative adjustments
      const historyData = response?.data || response || [];
      console.log('📊 [AdjustmentsChart] History data array:', historyData);
      
      if (historyData.length === 0) {
        console.log('⚠️ [AdjustmentsChart] No data from API, keeping sample data');
        return;
      }
      
      const groupedData = {};

      historyData.forEach(item => {
        const date = new Date(item.created_at || item.date).toISOString().split('T')[0];
        if (!groupedData[date]) {
          groupedData[date] = { date, positive: 0, negative: 0 };
        }
        
        const adjustment = item.quantity_change || item.adjustment || 0;
        if (adjustment > 0) {
          groupedData[date].positive += 1;
        } else if (adjustment < 0) {
          groupedData[date].negative += 1;
        }
      });

      const chartData = Object.values(groupedData).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      console.log('✅ [AdjustmentsChart] Processed chart data:', chartData);
      setData(chartData);
      setUsingFallback(false);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('❌ [AdjustmentsChart] API Error:', e);
        setError(e?.response?.data?.message || e.message);
        console.log('📊 [AdjustmentsChart] Keeping sample data due to API error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChartData();
    return () => abortRef.current?.abort();
  }, [fetchChartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            {new Date(label).toLocaleDateString()}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (data.length === 0 && !usingFallback) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No adjustment data available</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {usingFallback && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            Sample Data
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={(date) => new Date(date).getDate().toString()}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="positive" 
          name="Positive Adjustments"
          stroke="#22c55e" 
          strokeWidth={2}
          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="negative" 
          name="Negative Adjustments"
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
});

export default AdjustmentsChart;