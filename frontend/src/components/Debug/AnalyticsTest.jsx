// AnalyticsTest.jsx - Test component to check what analytics data we get from backend
import { useEffect } from 'react';
import { useGetProductWithAnalyticsQuery } from '@/GraphQL/Products/Queries/Products';

const AnalyticsTest = ({ productId }) => {
  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
  } = useGetProductWithAnalyticsQuery(parseInt(productId));

  useEffect(() => {
    if (analyticsData) {
        data: analyticsData,
        productById: analyticsData.productById,
        analytics: {
          total_sales_count: analyticsData.productById?.total_sales_count,
          total_purchases_count: analyticsData.productById?.total_purchases_count,
          total_sales_value: analyticsData.productById?.total_sales_value,
          total_purchase_value: analyticsData.productById?.total_purchase_value,
          profit_value: analyticsData.productById?.profit_value,
          profit_percentage: analyticsData.productById?.profit_percentage,
          sales_highlight: analyticsData.productById?.sales_highlight,
        }
      });
    }
    
    if (analyticsError) {
    }
  }, [analyticsData, analyticsError]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-green-100 border border-green-300 rounded-lg p-3 text-sm shadow-lg z-50">
      <div className="font-semibold text-green-800 mb-2">🎯 Analytics Test</div>
      <div className="text-green-700 text-xs">
        <div>Loading: {analyticsLoading ? 'Yes' : 'No'}</div>
        <div>Error: {analyticsError ? 'Yes' : 'No'}</div>
        <div>Data: {analyticsData ? 'Yes' : 'No'}</div>
        {analyticsData?.productById && (
          <div className="mt-2 space-y-1">
            <div>Sales Count: {analyticsData.productById.total_sales_count}</div>
            <div>Sales Value: ${analyticsData.productById.total_sales_value}</div>
            <div>Profit: ${analyticsData.productById.profit_value}</div>
            <div>Highlight: {analyticsData.productById.sales_highlight}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTest;
