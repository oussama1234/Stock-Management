// src/api/Products.js
// Products API functions for sales modal and product selection

import { AxiosClient } from "./AxiosClient";

/**
 * getProducts - Fetch products with optional search
 * @param {{ search?: string, per_page?: number }} params
 * @returns {Promise<{ data: Array, meta: object }>} products with metadata
 */
export const getProducts = async (params = {}) => {
  const { search = "", per_page = 100, page = 1 } = params;
  const res = await AxiosClient.get("/products", { 
    params: { search, per_page, page } 
  });
  return res.data;
};

/**
 * getProductById
 * @param {number} id
 */
export const getProductById = async (id) => {
  const res = await AxiosClient.get(`/products/${id}`);
  return res.data;
};
