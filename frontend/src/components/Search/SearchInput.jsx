// src/components/Search/SearchInput.jsx
// Modern search input with suggestions, keyboard navigation, and debounced search
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Clock, TrendingUp, Sparkles, Zap,
  ArrowRight, Filter, SortDesc, ChevronDown
} from 'lucide-react';
import { EnhancedSearchService } from '@/api/EnhancedSearch';

// Search suggestion item component
const SuggestionItem = memo(({ suggestion, isSelected, onSelect, onHover }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    whileHover={{ x: 4 }}
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'bg-blue-50 border-l-4 border-blue-500' 
        : 'hover:bg-gray-50 border-l-4 border-transparent'
    }`}
    onClick={() => onSelect(suggestion)}
    onMouseEnter={() => onHover(suggestion)}
  >
    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
      <Search className="w-4 h-4 text-blue-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-900 truncate">
        {suggestion.title}
      </div>
      {suggestion.description && (
        <div className="text-xs text-gray-500 truncate mt-1">
          {suggestion.description}
        </div>
      )}
    </div>
    <ArrowRight className="w-4 h-4 text-gray-400" />
  </motion.div>
));

// Recent search item component
const RecentSearchItem = memo(({ search, onSelect, onRemove }) => (
  <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 group transition-colors">
    <Clock className="w-4 h-4 text-gray-400" />
    <button 
      onClick={() => onSelect(search)}
      className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900 truncate"
    >
      {search}
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(search);
      }}
      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
    >
      <X className="w-3 h-3 text-gray-500" />
    </button>
  </div>
));

// Main search input component
const SearchInput = memo(({ 
  value = '', 
  onChange, 
  onSearch, 
  placeholder = "Search products, sales, customers...",
  autoFocus = false,
  showSuggestions = true,
  showRecentSearches = true,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search_recent');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.warn('Failed to load recent searches:', e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query) => {
    if (!query || query.length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== query);
      const updated = [query, ...filtered].slice(0, 5);
      localStorage.setItem('search_recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Remove recent search
  const removeRecentSearch = useCallback((query) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== query);
      localStorage.setItem('search_recent', JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const result = await EnhancedSearchService.searchSuggestions(query, {
        limit: 8,
        signal: abortControllerRef.current.signal
      });

      // Mock suggestions for now (replace with actual API data)
      const mockSuggestions = [
        { title: `Products containing "${query}"`, description: 'Search in product names and descriptions', type: 'products' },
        { title: `Sales containing "${query}"`, description: 'Search in customer names and order details', type: 'sales' },
        { title: `Suppliers containing "${query}"`, description: 'Search in supplier names and contacts', type: 'suppliers' },
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Suggestion fetch failed:', error);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced input change
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      if (showSuggestions) {
        fetchSuggestions(newValue);
      }
    }, 300);

    setSelectedIndex(-1);
    setShowDropdown(true);
  }, [onChange, showSuggestions, fetchSuggestions]);

  // Handle search submission
  const handleSearch = useCallback((query = inputValue) => {
    if (!query.trim()) return;
    
    const searchQuery = query.trim();
    saveRecentSearch(searchQuery);
    onSearch?.(searchQuery);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    // Clear suggestions
    setSuggestions([]);
  }, [inputValue, saveRecentSearch, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const allItems = [...suggestions, ...recentSearches.map(s => ({ title: s, type: 'recent' }))];
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          const selected = allItems[selectedIndex];
          handleSearch(selected.type === 'recent' ? selected.title : selected.title.replace(/.*"([^"]*)".*/, '$1'));
        } else {
          handleSearch();
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
        
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
        
      default:
        break;
    }
  }, [selectedIndex, suggestions, recentSearches, handleSearch]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowDropdown(true);
  }, []);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    // Don't close dropdown if clicking inside it
    if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget)) {
      return;
    }
    
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 150);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    const searchQuery = suggestion.type === 'recent' 
      ? suggestion.title 
      : suggestion.title.replace(/.*"([^"]*)".*/, '$1') || suggestion.title;
    
    setInputValue(searchQuery);
    handleSearch(searchQuery);
  }, [handleSearch]);

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    onChange?.('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]); // Don't include inputValue to avoid infinite loop

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const hasContent = inputValue.length > 0;
  const showSuggestionsList = showDropdown && isFocused && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`relative group transition-all duration-300 ${
        isFocused ? 'scale-[1.02]' : ''
      }`}>
        <div className={`relative flex items-center bg-white border rounded-2xl shadow-lg transition-all duration-300 ${
          isFocused 
            ? 'border-blue-500 shadow-blue-500/20 shadow-2xl' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
        }`}>
          {/* Search Icon */}
          <div className="flex items-center px-4">
            <motion.div
              animate={{ 
                scale: isLoading ? 0.8 : 1,
                rotate: isLoading ? 360 : 0 
              }}
              transition={{ 
                rotate: { duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }
              }}
            >
              {isLoading ? (
                <Sparkles className="w-5 h-5 text-blue-500" />
              ) : (
                <Search className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              )}
            </motion.div>
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 py-4 px-2 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none text-lg"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Right Actions */}
          <div className="flex items-center px-4 gap-2">
            <AnimatePresence>
              {hasContent && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
            
            <div className="h-6 w-px bg-gray-200" />
            
            <button
              onClick={() => handleSearch()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
              type="button"
            >
              <Zap className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestionsList && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto"
          >
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <TrendingUp className="w-4 h-4" />
                    Suggestions
                  </div>
                </div>
                <div className="py-2">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionItem
                      key={index}
                      suggestion={suggestion}
                      isSelected={selectedIndex === index}
                      onSelect={handleSuggestionSelect}
                      onHover={() => setSelectedIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {showRecentSearches && recentSearches.length > 0 && (
              <div>
                {suggestions.length > 0 && <div className="h-px bg-gray-100" />}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Clock className="w-4 h-4" />
                      Recent Searches
                    </div>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('search_recent');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <div className="py-2">
                  {recentSearches.map((search, index) => (
                    <RecentSearchItem
                      key={index}
                      search={search}
                      onSelect={(query) => {
                        setInputValue(query);
                        handleSearch(query);
                      }}
                      onRemove={removeRecentSearch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {suggestions.length === 0 && recentSearches.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Start typing to see suggestions</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SearchInput;