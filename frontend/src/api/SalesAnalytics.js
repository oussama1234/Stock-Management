// src/api/SalesAnalytics.js
// Sales analytics API functions

import { AxiosClient } from "./AxiosClient";

/**
 * getSalesOverview - Get sales overview statistics
 * @param {{ period?: string }} params
 */
export const getSalesOverview = async (params = {}) => {
  const { period = "30" } = params;
  const res = await AxiosClient.get("/sales/analytics/overview", { 
    params: { period } 
  });
  return res.data;
};

/**
 * getSalesTrends - Get sales trends over time
 * @param {{ period?: string, interval?: string }} params
 */
export const getSalesTrends = async (params = {}) => {
  const { period = "30", interval = "day" } = params;
  const res = await AxiosClient.get("/sales/analytics/trends", {
    params: { period, interval }
  });
  return res.data;
};

/**
 * getTopProducts - Get top selling products
 * @param {{ period?: string, limit?: number }} params
 */
export const getTopProducts = async (params = {}) => {
  const { period = "30", limit = 10 } = params;
  const res = await AxiosClient.get("/sales/analytics/top-products", {
    params: { period, limit }
  });
  return res.data;
};

/**
 * getTopCustomers - Get top customers
 * @param {{ period?: string, limit?: number }} params
 */
export const getTopCustomers = async (params = {}) => {
  const { period = "30", limit = 10 } = params;
  const res = await AxiosClient.get("/sales/analytics/customers", {
    params: { period, limit }
  });
  return res.data;
};

/**
 * getSalesByCategory - Get sales by category
 * @param {{ period?: string }} params
 */
export const getSalesByCategory = async (params = {}) => {
  const { period = "30" } = params;
  const res = await AxiosClient.get("/sales/analytics/categories", {
    params: { period }
  });
  return res.data;
};

/**
 * getSalesPeople - Get sales performance by salesperson
 * @param {{ period?: string }} params
 */
export const getSalesPeople = async (params = {}) => {
  const { period = "30" } = params;
  const res = await AxiosClient.get("/sales/analytics/sales-people", {
    params: { period }
  });
  return res.data;
};

/**
 * getLowStockAlerts - Get low stock alerts
 * @param {{ days?: number, threshold?: number }} params
 */
export const getLowStockAlerts = async (params = {}) => {
  const { days = 30, threshold = 10 } = params;
  const res = await AxiosClient.get("/sales/analytics/low-stock-alerts", {
    params: { days, threshold }
  });
  return res.data;
};