// src/api/Reports.js
// Reports API functions for the reports module endpoints

import { AxiosClient } from "./AxiosClient";

const defaultRange = {
  date_range: "last_30_days",
  group_by: "day",
};

export const getSalesReport = async (params = {}) => {
  const res = await AxiosClient.get("/reports/sales", { params: { ...defaultRange, ...params } });
  return res.data;
};

export const getPurchasesReport = async (params = {}) => {
  const res = await AxiosClient.get("/reports/purchases", { params: { ...defaultRange, ...params } });
  return res.data;
};

export const getStockMovementsReport = async (params = {}) => {
  const res = await AxiosClient.get("/reports/stock-movements", { params: { ...defaultRange, ...params } });
  return res.data;
};

export const getProductsSold = async (params = {}) => {
  const res = await AxiosClient.get("/reports/products-sold", { params: { ...defaultRange, ...params } });
  return res.data;
};

export const getProductsPurchased = async (params = {}) => {
  const res = await AxiosClient.get("/reports/products-purchased", { params: { ...defaultRange, ...params } });
  return res.data;
};

export const getLowStockReport = async (params = {}) => {
  const cleanParams = {
    // Remove date range defaults for low stock as it's about current state
    threshold: 10, // Default threshold
    ...params
  };
  
  // Clean up parameters
  if (typeof cleanParams.page === 'number' && cleanParams.page < 1) delete cleanParams.page;
  if (typeof cleanParams.per_page === 'number' && cleanParams.per_page < 1) delete cleanParams.per_page;
  if (typeof cleanParams.search === 'string' && cleanParams.search.trim() === '') delete cleanParams.search;
  if (typeof cleanParams.category_id === 'number' && cleanParams.category_id < 1) delete cleanParams.category_id;
  if (typeof cleanParams.threshold === 'number' && cleanParams.threshold < 0) cleanParams.threshold = 10;
  
  const res = await AxiosClient.get("/reports/low-stock", { params: cleanParams });
  return res.data;
};

export const getLowStockAlertsReport = async (params = {}) => {
  const cleanParams = {
    include_stats: true,
    include_categories: true,
    threshold: 10,
    ...params
  };
  
  const res = await AxiosClient.get("/reports/inventory/low-stock-alerts", { params: cleanParams });
  return res.data;
};

export const exportLowStockReport = async (params = {}) => {
  const cleanParams = {
    format: 'csv',
    threshold: 10,
    ...params
  };
  
  const res = await AxiosClient.get("/reports/low-stock/export", { 
    params: cleanParams,
    responseType: 'blob'
  });
  return res.data;
};
