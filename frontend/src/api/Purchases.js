// src/api/Purchases.js
// Purchases API functions using AxiosClient. Server provides paginated results with
// optional search filter. All functions are documented and do not expose secrets.

import { AxiosClient } from "./AxiosClient";

/**
 * getPurchases
 * @param {{ page?: number, per_page?: number, search?: string, sortBy?: string, sortOrder?: string, dateFrom?: string, dateTo?: string, minAmount?: string, maxAmount?: string, supplierId?: number, userId?: number }} params
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
export const getPurchases = async (params = {}, options = {}) => {
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
  if (params.supplierId) cleanParams.supplier_id = params.supplierId;
  if (params.userId) cleanParams.user_id = params.userId;
  
  
  const res = await AxiosClient.get("/purchases", { 
    params: cleanParams,
    signal: options.signal 
  });
  return res.data;
};

/**
 * getPurchaseById
 * @param {number} id
 * @returns {Promise<Object>} Purchase with related items and product details
 */
export const getPurchaseById = async (id) => {
  const res = await AxiosClient.get(`/purchases/${id}`);
  return res.data;
};

/**
 * createPurchase
 * @param {{ supplier_id: number, purchase_date?: string, items: Array<{product_id:number, quantity:number, price:number}> }} payload
 * @returns {Promise<Object>} Created purchase with full details
 */
export const createPurchase = async (payload) => {
  const res = await AxiosClient.post("/purchases", payload);
  return res.data;
};

/**
 * updatePurchase
 * @param {number} id
 * @param {{ supplier_id?: number, purchase_date?: string, items?: Array<{product_id:number, quantity:number, price:number}> }} payload
 * @returns {Promise<Object>} Updated purchase with full details
 */
export const updatePurchase = async (id, payload) => {
  const res = await AxiosClient.put(`/purchases/${id}`, payload);
  return res.data;
};

/**
 * deletePurchase
 * @param {number} id
 * @returns {Promise<Object>} Success response
 */
export const deletePurchase = async (id) => {
  const res = await AxiosClient.delete(`/purchases/${id}`);
  return res.data;
};

/**
 * exportPurchases
 * Export purchases data to CSV or JSON
 * @param {{ search?: string, dateFrom?: string, dateTo?: string, format?: string }} params
 * @returns {Promise<Blob>} File download response
 */
export const exportPurchases = async (params = {}) => {
  const cleanParams = {
    format: params.format || 'csv'
  };
  
  // Only add non-empty parameters
  if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params.dateFrom && params.dateFrom.trim()) cleanParams.date_from = params.dateFrom;
  if (params.dateTo && params.dateTo.trim()) cleanParams.date_to = params.dateTo;
  
  
  const res = await AxiosClient.get("/purchases/export", {
    params: cleanParams,
    responseType: 'blob' // Important for file downloads
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from response headers or create default
  const contentDisposition = res.headers['content-disposition'];
  let filename = 'purchases_export.csv';
  if (contentDisposition) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(contentDisposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return res.data;
};

/**
 * getPurchasesByProduct
 * Get purchases for a specific product (used in ProductDetails page)
 * @param {number} productId
 * @returns {Promise<Array>} List of purchases containing the product
 */
export const getPurchasesByProduct = async (productId) => {
  const res = await AxiosClient.get(`/purchases/product/${productId}`);
  return res.data;
};

/**
 * getSuppliers
 * Get suppliers for purchase form dropdown
 * @param {{ search?: string, per_page?: number }} params
 * @returns {Promise<Array>} List of suppliers
 */
export const getSuppliers = async (params = {}) => {
  const cleanParams = {};
  
  if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params.per_page) cleanParams.per_page = params.per_page;
  
  
  try {
    const res = await AxiosClient.get("/suppliers", { params: cleanParams });
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * createSupplier
 * Create a new supplier
 * @param {{ name: string, email?: string, phone?: string, address?: string }} payload
 * @returns {Promise<Object>} Created supplier
 */
export const createSupplier = async (payload) => {
  const res = await AxiosClient.post("/suppliers", payload);
  return res.data;
};
