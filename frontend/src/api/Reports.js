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
  const res = await AxiosClient.get("/reports/low-stock", { params: { ...defaultRange, ...params } });
  return res.data;
};
