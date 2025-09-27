// src/api/PurchasesAnalytics.js
// PurchasesAnalytics API functions using AxiosClient for comprehensive analytics data
// All functions are documented and include proper error handling with caching support

import { AxiosClient } from "./AxiosClient";

/**
 * getPurchasesOverview
 * Get comprehensive overview of purchases analytics
 * @param {{ range_days?: number }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} Overview analytics with totals, growth, top suppliers/products
 */
export const getPurchasesOverview = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  if (params.range_days) cleanParams.range_days = params.range_days;
  
  
  const res = await AxiosClient.get("/purchases/analytics/overview", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getPurchasesTrends
 * Get purchase trends over time (daily/weekly/monthly)
 * @param {{ range_days?: number, group_by?: string }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} Trends data with time series information
 */
export const getPurchasesTrends = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  if (params.range_days) cleanParams.range_days = params.range_days;
  if (params.group_by) cleanParams.group_by = params.group_by;
  
  
  const res = await AxiosClient.get("/purchases/analytics/trends", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getPurchasesTopProducts
 * Get top purchased products with analytics
 * @param {{ range_days?: number, limit?: number }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} Top products data with quantities, values, and purchase counts
 */
export const getPurchasesTopProducts = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  if (params.range_days) cleanParams.range_days = params.range_days;
  if (params.limit) cleanParams.limit = params.limit;
  
  
  const res = await AxiosClient.get("/purchases/analytics/top-products", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getPurchasesSuppliers
 * Get supplier analytics with performance metrics
 * @param {{ range_days?: number, limit?: number }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} Suppliers data with spending, frequency, and consistency scores
 */
export const getPurchasesSuppliers = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  if (params.range_days) cleanParams.range_days = params.range_days;
  if (params.limit) cleanParams.limit = params.limit;
  
  
  const res = await AxiosClient.get("/purchases/analytics/suppliers", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getPurchasesCategories
 * Get category-wise purchase analytics
 * @param {{ range_days?: number }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} Categories data with purchase values and percentages
 */
export const getPurchasesCategories = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  if (params.range_days) cleanParams.range_days = params.range_days;
  
  
  const res = await AxiosClient.get("/purchases/analytics/categories", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getPurchasingTeam
 * Get purchasing team performance analytics
 * @param {{ range_days?: number }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} Team performance data with individual metrics
 */
export const getPurchasingTeam = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  if (params.range_days) cleanParams.range_days = params.range_days;
  
  
  const res = await AxiosClient.get("/purchases/analytics/purchasing-team", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getCostAnalysis
 * Get cost savings and price efficiency analytics
 * @param {{ range_days?: number }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} Cost analysis with price trends and savings opportunities
 */
export const getCostAnalysis = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  if (params.range_days) cleanParams.range_days = params.range_days;
  
  
  const res = await AxiosClient.get("/purchases/analytics/cost-analysis", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getAllPurchasesAnalytics
 * Fetch all analytics data in parallel for comprehensive dashboard
 * @param {{ range_days?: number }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<Object>} All analytics data combined
 */
export const getAllPurchasesAnalytics = async (params = {}, options = {}) => {
  try {
    
    const [
      overview,
      trends,
      topProducts,
      suppliers,
      categories,
      team,
      costAnalysis
    ] = await Promise.all([
      getPurchasesOverview(params, options),
      getPurchasesTrends(params, options),
      getPurchasesTopProducts({ ...params, limit: 10 }, options),
      getPurchasesSuppliers({ ...params, limit: 10 }, options),
      getPurchasesCategories(params, options),
      getPurchasingTeam(params, options),
      getCostAnalysis(params, options)
    ]);
    
    return {
      overview,
      trends,
      topProducts,
      suppliers,
      categories,
      team,
      costAnalysis,
      _fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    throw error;
  }
};
