// src/api/EnhancedSearch.js
// Enhanced search API service with performance optimizations and caching
import { AxiosClient } from './AxiosClient';

// Cache for storing recent search results
const searchCache = new Map();
const CACHE_TTL = 30000; // 30 seconds
const MAX_CACHE_SIZE = 50;

// Clean expired cache entries
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, { timestamp }] of searchCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
};

// Get cached result if available and not expired
const getCachedResult = (cacheKey) => {
  cleanExpiredCache();
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

// Store result in cache
const setCachedResult = (cacheKey, data) => {
  if (searchCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }
  
  searchCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

export const EnhancedSearchService = {
  /**
   * Universal search with caching and abort control
   */
  searchAll: async (params = {}, options = {}) => {
    const cleanParams = {
      q: (params.q || '').trim(),
      page: params.page || 1,
      per_page: params.per_page || 10,
      category_id: params.category_id || null,
      status: params.status || null,
      from_date: params.from_date || null,
      to_date: params.to_date || null,
      ...params.filters
    };

    // Remove empty values
    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key] === null || cleanParams[key] === undefined || cleanParams[key] === '') {
        delete cleanParams[key];
      }
    });

    const cacheKey = `search:${JSON.stringify(cleanParams)}`;
    
    // Check cache first (unless explicitly disabled)
    if (!options.bypassCache) {
      const cached = getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const controller = options.signal ? null : new AbortController();
      const signal = options.signal || controller?.signal;

      const response = await AxiosClient.get('/search', { 
        params: cleanParams, 
        signal 
      });

      const result = {
        ...response.data,
        _cached: false,
        _timestamp: Date.now()
      };

      // Cache the result
      setCachedResult(cacheKey, result);

      return result;
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        throw error;
      }
      
      // Enhanced error handling
      const enhancedError = {
        ...error,
        searchParams: cleanParams,
        timestamp: Date.now()
      };
      
      throw enhancedError;
    }
  },

  /**
   * Search suggestions for autocomplete (lighter weight)
   */
  searchSuggestions: async (query, options = {}) => {
    if (!query || query.length < 2) return { suggestions: [] };

    const params = {
      q: query.trim(),
      per_page: options.limit || 5,
      suggestions_only: true
    };

    const cacheKey = `suggestions:${JSON.stringify(params)}`;
    
    const cached = getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const response = await AxiosClient.get('/search/suggestions', { 
        params,
        signal: options.signal
      });

      const result = response.data;
      setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.warn('Search suggestions failed:', error);
      return { suggestions: [] };
    }
  },

  /**
   * Universal search with multiple entity categories
   */
  universalSearch: async (query, options = {}) => {
    const params = {
      q: query.trim(),
      page: options.page || 1,
      per_page: options.limit || options.per_page || 10,
      categories: options.categories ? options.categories.join(',') : 'products,sales,purchases,customers,suppliers,users,movements,reasons,categories'
    };

    // Add any additional filters
    if (options.category_id) params.category_id = options.category_id;
    if (options.status) params.status = options.status;
    if (options.from_date) params.from_date = options.from_date;
    if (options.to_date) params.to_date = options.to_date;

    return EnhancedSearchService.searchAll(params, options);
  },

  /**
   * Get detailed search analytics
   */
  getSearchAnalytics: async (query, options = {}) => {
    if (!query) return null;

    try {
      const response = await AxiosClient.get('/search/analytics', {
        params: { q: query },
        signal: options.signal
      });

      return response.data;
    } catch (error) {
      console.warn('Search analytics failed:', error);
      return null;
    }
  },

  /**
   * Clear search cache
   */
  clearCache: () => {
    searchCache.clear();
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    cleanExpiredCache();
    return {
      size: searchCache.size,
      maxSize: MAX_CACHE_SIZE,
      ttl: CACHE_TTL
    };
  }
};