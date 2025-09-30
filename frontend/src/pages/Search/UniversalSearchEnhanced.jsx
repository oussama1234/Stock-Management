// src/pages/Search/UniversalSearchEnhanced.jsx
// Complete Universal Search page with modern design and performance optimizations
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Sparkles, 
  Zap, 
  Clock, 
  TrendingUp,
  Filter,
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Target
} from 'lucide-react';

// Import our enhanced components
import SearchInput from '@/components/Search/SearchInput';
import SearchStats from '@/components/Search/SearchStats';
import SearchResultsContainer from '@/components/Search/SearchResultsContainer';
import { EnhancedSearchService } from '@/api/EnhancedSearch';
import { useToast } from '@/components/Toaster/ToastContext';

// Custom hook for search functionality
const useUniversalSearch = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  
  const abortControllerRef = useRef(null);
  const toast = useToast();

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((query, results) => {
    const historyItem = {
      id: Date.now(),
      query,
      timestamp: new Date().toISOString(),
      resultCount: Object.values(results?.results || {})
        .reduce((sum, section) => sum + (section?.data?.length || 0), 0)
    };

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query !== query);
      const updated = [historyItem, ...filtered].slice(0, 20);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Perform search
  const performSearch = useCallback(async (query, options = {}) => {
    if (!query || query.trim().length === 0) {
      setSearchResults(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const searchParams = {
        q: query.trim(),
        per_page: options.perPage || 12,
        ...options.filters
      };

      const result = await EnhancedSearchService.searchAll(searchParams, {
        signal: abortControllerRef.current.signal,
        bypassCache: options.bypassCache
      });

      setSearchResults(result);
      saveToHistory(query, result);

      // Success analytics
      if (result?._cached) {
        toast.info('Results loaded from cache', { duration: 2000 });
      }

    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled') {
        const errorMessage = err?.response?.data?.message || err.message || 'Search failed';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Search error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory, toast]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    searchHistory,
    performSearch,
    clearResults: () => {
      setSearchResults(null);
      setError(null);
    },
    clearHistory: () => {
      setSearchHistory([]);
      localStorage.removeItem('search_history');
    }
  };
};

// Main UniversalSearch component
const UniversalSearchEnhanced = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({});
  
  const {
    searchResults,
    isLoading,
    error,
    searchHistory,
    performSearch,
    clearResults,
    clearHistory
  } = useUniversalSearch();

  const toast = useToast();

  // Parse URL parameters
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      q: params.get('q') || '',
      category: params.get('category'),
      dateRange: params.get('dateRange')
    };
  }, [location.search]);

  // Initialize search from URL
  useEffect(() => {
    if (urlParams.q && urlParams.q !== searchQuery) {
      setSearchQuery(urlParams.q);
      performSearch(urlParams.q, { filters: urlParams });
    }
  }, [urlParams, performSearch]); // Don't include searchQuery to avoid infinite loop

  // Handle search input change
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  // Handle search execution
  const handleSearch = useCallback((query = searchQuery) => {
    if (!query.trim()) return;

    const searchParams = new URLSearchParams();
    searchParams.set('q', query.trim());
    
    if (filters.category) searchParams.set('category', filters.category);
    if (filters.dateRange) searchParams.set('dateRange', filters.dateRange);

    // Update URL without causing a navigation
    const newUrl = `${location.pathname}?${searchParams.toString()}`;
    navigate(newUrl, { replace: true });

    // Perform search
    performSearch(query, { filters });
  }, [searchQuery, filters, performSearch, navigate, location.pathname]);

  // Handle result actions (view, edit, etc.)
  const handleResultAction = useCallback((item, action, section) => {
    console.log(`Action: ${action} on ${section}:`, item);
    
    switch (action) {
      case 'view':
        if (section === 'products') {
          navigate(`/dashboard/products/${item.id}`);
        } else if (section === 'users') {
          navigate('/dashboard/users');
        }
        break;
        
      case 'edit':
        toast.info(`Edit ${section} functionality coming soon!`);
        break;
        
      default:
        console.log(`Unhandled action: ${action}`);
    }
  }, [navigate, toast]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (searchQuery) {
      performSearch(searchQuery, { bypassCache: true });
    }
  }, [searchQuery, performSearch]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    clearResults();
    navigate(location.pathname, { replace: true });
  }, [clearResults, navigate, location.pathname]);

  // Get cache stats for debugging
  const cacheStats = useMemo(() => {
    return EnhancedSearchService.getCacheStats();
  }, [searchResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
              >
                <SearchIcon className="w-8 h-8 text-white" />
              </motion.div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Universal Search
                </h1>
                <p className="text-gray-600 mt-1">
                  Search across products, sales, customers, and more
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {searchHistory.length > 0 && (
                <button
                  onClick={() => console.log('Show search history')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">History ({searchHistory.length})</span>
                </button>
              )}

              {searchResults && (
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
                  title="Refresh Results"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}

              {/* Cache indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-sm">
                <Zap className="w-4 h-4" />
                <span>Cache: {cacheStats.size}/{cacheStats.maxSize}</span>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            placeholder="Search products, sales, customers, suppliers..."
            autoFocus={!urlParams.q}
            className="max-w-4xl mx-auto"
          />

          {/* Search Tips */}
          {!searchQuery && !searchResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Try: "laptop", "John Doe", "damaged"</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Searches across all data</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Real-time results</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Search Error</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Statistics */}
        <SearchStats 
          searchResults={searchResults}
          searchQuery={searchQuery}
          isLoading={isLoading}
        />

        {/* Search Results */}
        {(searchQuery || searchResults) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <SearchResultsContainer
              searchResults={searchResults}
              searchQuery={searchQuery}
              isLoading={isLoading}
              onAction={handleResultAction}
              onRefresh={handleRefresh}
            />
          </motion.div>
        )}

        {/* Search History (when no active search) */}
        {!searchQuery && !searchResults && searchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Recent Searches
                </h2>
                <button
                  onClick={clearHistory}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-3">
                {searchHistory.slice(0, 10).map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSearchQuery(item.query);
                      handleSearch(item.query);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <SearchIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="font-medium text-gray-900">{item.query}</span>
                      <span className="text-sm text-gray-500">{item.resultCount} results</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center text-sm text-gray-500"
        >
          <p className="mb-2">
            Powered by Enhanced Search • Real-time indexing • Smart caching
          </p>
          <div className="flex items-center justify-center gap-4">
            <span>Cache Hit Rate: {searchResults?._cached ? 'High' : 'Building'}</span>
            <span>•</span>
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UniversalSearchEnhanced;