// src/api/Dashboard.js
import { AxiosClient } from "./AxiosClient";

export const getDashboardMetrics = async (params = {}) => {
  const { range_days = 30, low_stock_threshold = 5 } = params;
  const response = await AxiosClient.get("/dashboard/metrics", {
    params: { range_days, low_stock_threshold },
  });
  return response.data;
};
