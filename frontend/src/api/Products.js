// src/api/Products.js
// Products API for analytics and reporting
import { AxiosClient } from "./AxiosClient";

// Get all products (for basic product listing)
export const getProducts = async (params = {}) => {
  const response = await AxiosClient.get("/products", {
    params: {
      page: params.page || 1,
      limit: params.limit || 50,
      search: params.search || '',
      category: params.category || '',
      status: params.status || 'active',
      ...params
    }
  });
  return response.data;
};

// Get product by ID
export const getProductById = async (id) => {
  const response = await AxiosClient.get(`/products/${id}`);
  return response.data;
};

// Helper function to map days to backend date range format
const mapDaysToDateRange = (days) => {
  switch (days) {
    case 7:
      return 'last_7_days';
    case 14:
      return 'last_14_days';
    case 30:
      return 'last_30_days';
    case 60:
      return 'last_60_days';
    case 90:
      return 'last_90_days';
    case 180:
      return 'last_6_months';
    case 365:
      return 'last_year';
    default:
      return 'last_30_days';
  }
};

// Helper function to prepare report parameters
const prepareReportParams = (params = {}) => {
  const prepared = { ...params };
  
  // Handle date range conversion
  if (params.range_days) {
    prepared.date_range = mapDaysToDateRange(params.range_days);
    delete prepared.range_days;
  } else if (params.from_date && params.to_date) {
    // Support custom date range
    prepared.date_range = 'custom';
    prepared.from_date = params.from_date;
    prepared.to_date = params.to_date;
  } else if (!prepared.date_range) {
    prepared.date_range = 'last_30_days';
  }
  
  return prepared;
};

export class ProductsService {
  // Get comprehensive product analytics
  static async analytics(params = {}) {
    const preparedParams = prepareReportParams({
      limit: 50,
      ...params
    });
    
    const response = await AxiosClient.get("/reports/products-sold", {
      params: preparedParams
    });
    return response.data;
  }

  // Get sales report for products
  static async salesReport(params = {}) {
    const preparedParams = prepareReportParams({
      group_by: 'day',
      ...params
    });
    
    const response = await AxiosClient.get("/reports/sales", {
      params: preparedParams
    });
    return response.data;
  }

  // Get purchases report for products
  static async purchasesReport(params = {}) {
    const preparedParams = prepareReportParams({
      group_by: 'day',
      ...params
    });
    
    const response = await AxiosClient.get("/reports/purchases", {
      params: preparedParams
    });
    return response.data;
  }

  // Get stock movements
  static async stockMovements(params = {}) {
    const preparedParams = prepareReportParams({
      group_by: 'day',
      ...params
    });
    
    const response = await AxiosClient.get("/reports/stock-movements", {
      params: preparedParams
    });
    return response.data;
  }

  // Get top selling products
  static async topSelling(params = {}) {
    const preparedParams = prepareReportParams({
      limit: 10,
      ...params
    });
    
    const response = await AxiosClient.get("/reports/products-sold", {
      params: preparedParams
    });
    return response.data;
  }

  // Get top purchased products
  static async topPurchased(params = {}) {
    const preparedParams = prepareReportParams({
      limit: 10,
      ...params
    });
    
    const response = await AxiosClient.get("/reports/products-purchased", {
      params: preparedParams
    });
    return response.data;
  }

  // Get low stock alerts
  static async lowStockAlerts(params = {}) {
    const preparedParams = prepareReportParams({
      threshold: 10,
      ...params
    });
    
    const response = await AxiosClient.get("/reports/low-stock", {
      params: preparedParams
    });
    return response.data;
  }

  // Get product metrics (summary data)
  static async metrics(params = {}) {
    const [sales, purchases, lowStock] = await Promise.all([
      this.salesReport(params),
      this.purchasesReport(params),
      this.lowStockAlerts(params)
    ]);

    return {
      total_revenue: sales.summary?.total_sales_amount || 0,
      total_purchases: purchases.summary?.total_purchases_amount || 0,
      total_profit: (sales.summary?.total_sales_amount || 0) - (purchases.summary?.total_purchases_amount || 0),
      total_orders: sales.summary?.orders_count || 0,
      avg_order_value: sales.summary?.avg_order_value || 0,
      low_stock_count: lowStock.items?.length || 0,
      profit_margin: sales.summary?.total_sales_amount > 0 
        ? (((sales.summary.total_sales_amount - (purchases.summary?.total_purchases_amount || 0)) / sales.summary.total_sales_amount) * 100)
        : 0
    };
  }
}