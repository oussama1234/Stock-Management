// src/api/Search.js
import { AxiosClient } from "./AxiosClient";

export const searchAll = async (params = {}) => {
  const clean = {};
  if (typeof params.q === 'string') clean.q = params.q.trim();
  if (typeof params.page === 'number') clean.page = params.page;
  if (typeof params.per_page === 'number') clean.per_page = params.per_page;
  if (typeof params.category_id === 'number') clean.category_id = params.category_id;
  if (typeof params.status === 'string') clean.status = params.status;
  if (typeof params.from_date === 'string') clean.from_date = params.from_date;
  if (typeof params.to_date === 'string') clean.to_date = params.to_date;

  const res = await AxiosClient.get('/search', { params: clean });
  return res.data;
};
