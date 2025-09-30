import { AxiosClient } from './AxiosClient'
import { EnhancedSearchService } from './EnhancedSearch'

// Simple in-memory cache for prefetch operations
const cache = new Map()
const put = (k, v, ttlMs = 30_000) => cache.set(k, { v, exp: Date.now() + ttlMs })
const get = (k) => {
  const c = cache.get(k)
  if (!c) return null
  if (Date.now() > c.exp) { cache.delete(k); return null }
  return c.v
}

export async function searchService(query, options = {}) {
  return EnhancedSearchService.universalSearch(query, {
    page: options.page || 1,
    limit: options.per_page || options.limit || 10,
    categories: ['products', 'sales', 'purchases', 'customers', 'suppliers', 'users', 'movements', 'reasons', 'categories'],
    ...options
  })
}

export async function prefetchProduct(id) {
  const key = `product:${id}`
  const cached = get(key)
  if (cached) return cached
  try {
    const res = await AxiosClient.get(`/products/${id}`)
    put(key, res.data)
    return res.data
  } catch {
    return null
  }
}

export async function prefetchSale(id) {
  const key = `sale:${id}`
  const cached = get(key)
  if (cached) return cached
  try {
    const res = await AxiosClient.get(`/sales/${id}`)
    put(key, res.data)
    return res.data
  } catch {
    return null
  }
}

export async function prefetchPurchase(id) {
  const key = `purchase:${id}`
  const cached = get(key)
  if (cached) return cached
  try {
    const res = await AxiosClient.get(`/purchases/${id}`)
    put(key, res.data)
    return res.data
  } catch {
    return null
  }
}
