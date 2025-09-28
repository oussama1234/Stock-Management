// src/api/Inventory.js
import { AxiosClient } from "./AxiosClient";

export const getInventoryOverview = async (params = {}, options = {}) => {
  const cleanParams = {};
  if (typeof params.page === 'number') cleanParams.page = params.page;
  if (typeof params.per_page === 'number') cleanParams.per_page = params.per_page;
  if (typeof params.search === 'string' && params.search.trim() !== '') cleanParams.search = params.search.trim();
  if (['low','out','in'].includes(params.stock_status)) cleanParams.stock_status = params.stock_status;
  if (typeof params.category_id === 'number') cleanParams.category_id = params.category_id;
  if (typeof params.supplier_id === 'number') cleanParams.supplier_id = params.supplier_id;
  if (typeof params.sort_by === 'string') cleanParams.sort_by = params.sort_by;
  if (typeof params.sort_order === 'string') cleanParams.sort_order = params.sort_order;
  const config = { params: cleanParams };
  if (options.signal) config.signal = options.signal;
  const res = await AxiosClient.get("/inventory", config);
  return res.data;
};

export const postInventoryAdjustment = async (payload) => {
  const res = await AxiosClient.post("/inventory/adjustments", payload);
  return res.data;
};

export const getInventoryHistory = async (params = {}) => {
  const res = await AxiosClient.get("/inventory/history", { params });
  return res.data;
};

export const exportInventoryHistory = async (params = {}) => {
  const res = await AxiosClient.get("/inventory/history/export", { params, responseType: 'blob' });
  return res.data;
};

export const getInventoryKpis = async (params = {}) => {
  const res = await AxiosClient.get("/inventory/dashboard/kpis", { params });
  return res.data;
};