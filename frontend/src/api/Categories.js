// src/api/Categories.js
import { AxiosClient } from './AxiosClient';

export const CategoriesService = {
  list: async (params = {}, options = {}) => {
    const controller = options.signal ? null : new AbortController();
    const signal = options.signal || controller?.signal;
    const res = await AxiosClient.get('/categories', { params, signal });
    return { data: res.data?.data || res.data, meta: res.data?.meta || res.data?.pagination || {} };
  },
  show: async (id, options = {}) => {
    const res = await AxiosClient.get(`/categories/${id}`, { signal: options.signal });
    return res.data;
  },
  create: async (payload) => {
    const res = await AxiosClient.post('/categories', payload);
    return res.data;
  },
  update: async (id, payload) => {
    const res = await AxiosClient.put(`/categories/${id}`, payload);
    return res.data;
  },
  remove: async (id) => {
    const res = await AxiosClient.delete(`/categories/${id}`);
    return res.data;
  },
  analytics: async (params = {}, options = {}) => {
    const res = await AxiosClient.get('/categories/analytics/overview', { params, signal: options.signal });
    return res.data?.data || res.data;
  },
  topSelling: async (params = {}, options = {}) => {
    const res = await AxiosClient.get('/categories/analytics/top-selling', { params, signal: options.signal });
    return res.data?.data || res.data;
  },
  topPurchased: async (params = {}, options = {}) => {
    const res = await AxiosClient.get('/categories/analytics/top-purchased', { params, signal: options.signal });
    return res.data?.data || res.data;
  },
  profitDistribution: async (params = {}, options = {}) => {
    const res = await AxiosClient.get('/categories/analytics/profit-distribution', { params, signal: options.signal });
    return res.data?.data || res.data;
  },
  metrics: async (params = {}, options = {}) => {
    const res = await AxiosClient.get('/categories/analytics/metrics', { params, signal: options.signal });
    return res.data?.data || res.data;
  },
};
