// src/api/Dashboard.js
import { AxiosClient } from "./AxiosClient";

export const getDashboardMetrics = async (params = {}) => {
  const { range_days = 30, low_stock_threshold = 5 } = params;
  const response = await AxiosClient.get("/dashboard/metrics", {
    params: { range_days, low_stock_threshold },
  });
  return response.data;
};

/**
 * Get accurate sales overview statistics using the same method as SalesAnalyticsController
 * @param {{ period?: string }} params
 * @returns {Promise<{
 *   total_sales: number,
 *   total_orders: number,
 *   average_order_value: number,
 *   total_items_sold: number,
 *   unique_customers: number
 * }>}
 */
export const getDashboardSalesOverview = async (params = {}) => {
  const { period = "30" } = params;
  const response = await AxiosClient.get("/dashboard/sales/overview", {
    params: { period },
  });
  return response.data;
};

/**
 * Get accurate sales trends using the same method as SalesAnalyticsController
 * @param {{ period?: string, interval?: string }} params
 */
export const getDashboardSalesTrends = async (params = {}) => {
  const { period = "30", interval = "day" } = params;
  const response = await AxiosClient.get("/dashboard/sales/trends", {
    params: { period, interval },
  });
  return response.data;
};

/**
 * Get low stock alerts with velocity data
 * @param {{ days?: number, threshold?: number }} params
 * @returns {Promise<Array>} Array of low stock products with velocity analysis
 */
export const getDashboardLowStockAlerts = async (params = {}) => {
  const { days = 30, threshold = 10 } = params;
  const response = await AxiosClient.get("/dashboard/low-stock-alerts", {
    params: { days, threshold },
  });
  return response.data;
};

/**
 * Get enhanced dashboard data with better low stock alerts
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Enhanced dashboard data
 */
export const getEnhancedDashboardData = async (params = {}) => {
  const { range_days = 30, low_stock_threshold = 5 } = params;
  
  // Get regular dashboard metrics
  const dashboardData = await getDashboardMetrics(params);
  
  // Get enhanced low stock alerts
  const lowStockAlerts = await getDashboardLowStockAlerts({
    days: range_days,
    threshold: low_stock_threshold
  });
  
  // Merge the data
  return {
    ...dashboardData,
    low_stock: lowStockAlerts
  };
};
