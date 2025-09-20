// src/pages/Admin/Sales/components/ProductSelector.jsx
// Searchable dropdown for product selection in sales modal
// Shows product name, category, current stock, and price

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, ChevronDown, Check, AlertTriangle } from "lucide-react";
import { getProducts } from "@/api/Products";
import { useToast } from "@/components/Toaster/ToastContext";

export default function ProductSelector({ value, onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const toast = useToast();

  // Find selected product
  const selectedProduct = useMemo(() => 
    products.find(p => p.id === parseInt(value)) || null, 
    [products, value]
  );

  // Filtered products based on search
  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  );

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('ProductSelector: Loading products...'); // Debug log
        const result = await getProducts({ per_page: 100 });
        console.log('ProductSelector: Products loaded:', result); // Debug log
        setProducts(result.data || []);
      } catch (error) {
        console.error("ProductSelector: Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []); // Load once on mount

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (product) => {
    // Check for low stock warning
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    } else if (product.stock <= 10) {
      toast.warning(`Low stock alert: Only ${product.stock} units of ${product.name} remaining!`);
    }
    
    onChange(product.id);
    setIsOpen(false);
    setSearch("");
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);

  const getStockStatus = (stock) => {
    if (stock <= 0) return { color: "text-red-600", bg: "bg-red-50", label: "Out of Stock" };
    if (stock <= 10) return { color: "text-amber-600", bg: "bg-amber-50", label: "Low Stock" };
    return { color: "text-green-600", bg: "bg-green-50", label: "In Stock" };
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Product Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-left flex items-center justify-between"
      >
        <div className="flex items-center flex-1 min-w-0">
          <Package className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            {selectedProduct ? (
              <div>
                <div className="font-medium text-gray-900 truncate">
                  {selectedProduct.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {selectedProduct.category?.name} • {formatCurrency(selectedProduct.price)} • Stock: {selectedProduct.stock}
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Select a product...</span>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Products List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {search ? "No products match your search" : "No products available"}
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
                  const stockStatus = getStockStatus(product.stock);
                  
                  return (
                    <motion.button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelect(product)}
                      whileHover={{ backgroundColor: "rgb(249, 250, 251)" }}
                      disabled={product.stock <= 0}
                      className={`w-full p-3 text-left border-b border-gray-50 last:border-b-0 transition-colors ${
                        product.stock <= 0 
                          ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                          : isSelected 
                            ? 'bg-indigo-50' 
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <div className={`font-medium truncate ${
                              product.stock <= 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {product.name}
                              {product.stock <= 0 && <span className="ml-2 text-xs text-red-500">(Out of Stock)</span>}
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-indigo-600 ml-2 flex-shrink-0" />}
                          </div>
                          
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <span className="truncate">
                              {product.category?.name || 'No category'}
                            </span>
                            <span className="mx-2">•</span>
                            <span className="font-medium">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                          
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                              {product.stock <= 10 && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {product.stock} in stock
                            </span>
                          </div>
                        </div>
                        
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover ml-3 flex-shrink-0"
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}