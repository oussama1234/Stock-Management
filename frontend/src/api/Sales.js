// src/api/Sales.js
// Sales API functions using AxiosClient. Server provides paginated results with
// optional search filter. All functions are documented and do not expose secrets.

import { AxiosClient } from "./AxiosClient";

/**
 * getSales
 * @param {{ page?: number, per_page?: number, search?: string }} params
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<{
 *   data: Array,
 *   current_page: number,
 *   last_page: number,
 *   per_page: number,
 *   total: number,
 *   from: number,
 *   to: number,
 * }>} paginated response
 */
export const getSales = async (params = {}, options = {}) => {
  const cleanParams = {};
  
  // Only add non-empty parameters
  if (params.page) cleanParams.page = params.page;
  if (params.per_page) cleanParams.per_page = params.per_page;
  if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params.sortBy) cleanParams.sort_by = params.sortBy;
  if (params.sortOrder) cleanParams.sort_order = params.sortOrder;
  if (params.dateFrom && params.dateFrom.trim()) cleanParams.date_from = params.dateFrom;
  if (params.dateTo && params.dateTo.trim()) cleanParams.date_to = params.dateTo;
  if (params.minAmount && params.minAmount.trim()) cleanParams.min_amount = params.minAmount;
  if (params.maxAmount && params.maxAmount.trim()) cleanParams.max_amount = params.maxAmount;
  if (params.customerId) cleanParams.customer_id = params.customerId;
  if (params.userId) cleanParams.user_id = params.userId;
  
  
  const res = await AxiosClient.get("/sales", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getSaleById
 * @param {number} id
 */
export const getSaleById = async (id) => {
  const res = await AxiosClient.get(`/sales/${id}`);
  return res.data;
};

/**
 * createSale
 * @param {{ customer_name?: string, tax?: number, discount?: number, sale_date?: string, items: Array<{product_id:number, quantity:number, price:number}> }} payload
 */
export const createSale = async (payload) => {
  
  const res = await AxiosClient.post("/sales", payload, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'x-no-cache': 'true',
      'x-cache-bust': Date.now().toString()
    }
  });
  
  return res.data;
};

/**
 * updateSale
 * @param {number} id
 * @param {{ customer_name?: string, tax?: number, discount?: number, sale_date?: string }} payload
 */
export const updateSale = async (id, payload) => {
  const res = await AxiosClient.put(`/sales/${id}`, payload);
  return res.data;
};

/**
 * deleteSale
 * @param {number} id
 */
export const deleteSale = async (id) => {
  const res = await AxiosClient.delete(`/sales/${id}`);
  return res.data;
};

/**
 * exportSales
 * @param {{ search?: string, format?: string }} params
 */
export const exportSales = async (params = {}) => {
  const cleanParams = {
    format: params.format || 'csv'
  };
  
  // Add search and filters if provided
  if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params.sortBy) cleanParams.sort_by = params.sortBy;
  if (params.sortOrder) cleanParams.sort_order = params.sortOrder;
  if (params.dateFrom && params.dateFrom.trim()) cleanParams.date_from = params.dateFrom;
  if (params.dateTo && params.dateTo.trim()) cleanParams.date_to = params.dateTo;
  if (params.minAmount && params.minAmount.trim()) cleanParams.min_amount = params.minAmount;
  if (params.maxAmount && params.maxAmount.trim()) cleanParams.max_amount = params.maxAmount;
  if (params.customerId) cleanParams.customer_id = params.customerId;
  if (params.userId) cleanParams.user_id = params.userId;

  const res = await AxiosClient.get("/sales/export", {
    params: cleanParams,
    responseType: 'blob'
  });
  
  // Create download link
  const blob = new Blob([res.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sales-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return res.data;
};
