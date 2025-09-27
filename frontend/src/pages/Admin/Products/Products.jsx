// Products.jsx
import { useQuery } from "@apollo/client/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Camera,
  Check,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Image as ImageIcon,
  Info,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../../../components/ConfirmContext/ConfirmContext";
import ContentSpinner from "../../../components/Spinners/ContentSpinner";
import { MiniSpinner } from "../../../components/Spinners/LoadingSpinner";
import { useToast } from "../../../components/Toaster/ToastContext";
import { useCategoriesQuery } from "../../../GraphQL/Categories/Queries/Categories";
import { useCreateProductMutation } from "../../../GraphQL/Products/Mutations/CreateProduct";
import { useDeleteProductMutation } from "../../../GraphQL/Products/Mutations/DeleteProduct";
import { useUpdateProductMutation } from "../../../GraphQL/Products/Mutations/UpdateProduct";
import { PRODUCTS_QUERY } from "../../../GraphQL/Products/Queries/Products";
import { ProductDetailsRoute } from "../../../router/Index";
// Shared pagination hook and controls
import PaginationControls from "@/components/pagination/PaginationControls";
import usePagination from "@/components/pagination/usePagination";

const Products = () => {
  // Centralized pagination state shared across pages via hook
  const { currentPage, perPage, setPage, setPerPage, generatePages } =
    usePagination({ initialPage: 1, initialPerPage: 9 });
  const [productSearchFilter, setProductSearchFilter] = useState("");
  const {
    data: productsData,
    loading,
    refetch: refetchProducts,
  } = useQuery(PRODUCTS_QUERY, {
    variables: {
      page: currentPage,
      limit: perPage,
      search: productSearchFilter,
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const [loadCategories, { data: categoriesData, loading: loadingCategories }] =
    useCategoriesQuery();

  const {
    createProduct,
    data: createProductData,
    loading: createProductLoading,
  } = useCreateProductMutation();

  const {
    updateProduct,
    data: updateProductData,
    loading: updateProductLoading,
  } = useUpdateProductMutation();

  const {
    deleteProductMutation,
    data: deleteProductData,
    loading: deleteProductLoading,
  } = useDeleteProductMutation();

  const { confirm } = useConfirm();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [deletedProductId, setDeletedProductId] = useState(null);
  const [metaData, setMetaData] = useState({});

  const toast = useToast();
  const navigate = useNavigate();

  // Sample initial data
  useEffect(() => {
    if (productsData?.products?.data) {
      setProducts(
        productsData?.products.data.map((product) => ({
          ...product,
          price: product.price.toString(),
          stock: product.stock.toString(),
        }))
      );
      setFilteredProducts(
        productsData?.products.data.map((product) => ({
          ...product,
          price: product.price.toString(),
          stock: product.stock.toString(),
        }))
      );

      setMetaData({
        total: productsData?.products?.total,
        perPage: productsData?.products?.per_page,
        currentPage: productsData?.products?.current_page,
        lastPage: productsData?.products?.last_page,
        from: productsData?.products?.from,
        to: productsData?.products?.to,
        hasMorePages: productsData?.products?.has_more_pages,
      });
    }
  }, [productsData?.products?.data]);

  // loading Lazy data categories from GraphQL API
  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData?.categories]);

  /*   // Filter products based on search term
  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.stock
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.price
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]); */

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    image: null,
    price: "",
    stock: "",
    category: null,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Create image preview if image is selected
    if (name === "image" && files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(files[0]);
    }
  };

  /**
   * Validates the form data and returns true if the form is valid, false otherwise.
   * Checks if the product name, price, stock, category and description are valid.
   * If any of the fields are invalid, sets the corresponding error message in the errors state.
   * @return {boolean} True if the form is valid, false otherwise.
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      if (editingProduct) {
        // Update existing product
        try {
          const { data } = await updateProduct({
            variables: {
              id: editingProduct.id,
              product: {
                name: formData.name,
                description: formData.description,
                image: formData.image instanceof File ? formData.image : null,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                category_id: parseInt(formData.category),
              },
            },
          });

          // update state with updated product
          setProducts(
            products.map((product) =>
              product.id === data.updateProduct.id
                ? {
                    ...product,
                    ...data.updateProduct,
                    price: parseFloat(data.updateProduct.price),
                    stock: parseInt(data.updateProduct.stock),
                  }
                : product
            )
          );

          // update state with updated product for filtered products
          setFilteredProducts(
            filteredProducts.map((product) => {
              if (product.id === data.updateProduct.id) {
                return {
                  ...product,
                  ...data.updateProduct,
                  price: parseFloat(data.updateProduct.price),
                  stock: parseInt(data.updateProduct.stock),
                };
              }
              return product;
            })
          );

          toast.success("Product updated successfully!");
        } catch (error) {
          toast.error(
            error?.errors?.[0]?.extensions?.validation?.[
              "product.image"
            ]?.[0] || "Error creating product"
          );
        }
      } else {
        try {
          // Add new product
          const newProduct = {
            name: formData.name,
            description: formData.description,
            image: formData.image,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            category_id: parseInt(formData.category),
          };
          const { data } = await createProduct({
            variables: { product: newProduct },
          });
          setProducts((prevProducts) => [...prevProducts, data.createProduct]);
          setFilteredProducts((prevProducts) => [
            ...prevProducts,
            data.createProduct,
          ]);
          // refetchProducts(); is slower than setProducts state update
          toast.success("Product created successfully!");
        } catch (error) {
          toast.error(
            error?.errors?.[0]?.extensions?.validation?.[
              "product.image"
            ]?.[0] || "Error creating product"
          );
        }
      }

      closeModal();
    }
  };

  const openModal = (product = null) => {
    loadCategories();
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        image: product.image,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category.id || null,
      });

      setImagePreview(product.image);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        image: null,
        price: "",
        stock: "",
        category: "",
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      image: null,
      price: "",
      stock: "",
      category: "",
    });
    setImagePreview(null);
    setErrors({});
  };

  const openDetailModal = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const deleteProduct = async (productId) => {
    try {
      setDeletedProductId(productId);
      const confirmResult = await confirm({
        type: "warning",
        title: "Are you sure?",
        description: "This action cannot be undone.",
        confirmText: "Yes, proceed",
        cancelText: "No, cancel",
      });
      if (confirmResult) {
        // delete product mutation
        const { data } = await deleteProductMutation({
          variables: { id: productId },
        });
        if (data.deleteProduct?.success) {
          setProducts(products.filter((product) => product.id !== productId));
          setFilteredProducts(
            products.filter((product) => product.id !== productId)
          );
          toast.success(data.deleteProduct?.message);
        }
      }
    } catch (error) {
      toast.error(error?.message);
      refetchProducts();
    } finally {
      setDeletedProductId(null);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock < 10)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
  };

  // Pagination: compute visible pages using shared generator
  const pageList = generatePages(metaData?.lastPage || 1);

  const handleSearch = (searchTerm) => {
    setProductSearchFilter(searchTerm);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 bg-gray-200 rounded-xl w-64 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-xl w-40 animate-pulse"></div>
        </div>
        <ContentSpinner message="Loading products..." fullWidth size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8"
        >
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-3xl -z-10" />
          
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center space-x-6">
                {/* Enhanced Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
                  <div className="relative inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2"
                  >
                    📦 Product Inventory
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-gray-600 text-lg"
                  >
                    Manage your product catalog and inventory levels
                  </motion.p>
                </div>
              </div>

              {/* Quick Stats */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center space-x-6"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metaData.total || 0}</div>
                  <div className="text-sm text-gray-500">Total Products</div>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {products.filter(p => parseInt(p.stock) > 10).length}
                  </div>
                  <div className="text-sm text-gray-500">In Stock</div>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {products.filter(p => parseInt(p.stock) <= 10 && parseInt(p.stock) > 0).length}
                  </div>
                  <div className="text-sm text-gray-500">Low Stock</div>
                </div>
              </motion.div>
            </div>
            
            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex justify-end mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-xl hover:shadow-2xl"
              >
                <div className="p-1 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-semibold">Add New Product</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Enhanced Search Input */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                  placeholder="Search products by name, category, or description..."
                  className="pl-12 pr-4 py-4 w-full rounded-xl bg-white/70 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      handleSearch('');
                    }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Filter and Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSearch(searchTerm)}
                  className="group px-6 py-4 bg-white/90 text-gray-700 rounded-xl hover:bg-white border border-gray-200 hover:border-blue-300 transition-all duration-300 flex items-center shadow-sm hover:shadow-md"
                >
                  <Search className="h-4 w-4 mr-2 text-blue-500 group-hover:text-blue-600" />
                  <span className="font-medium">Search</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-6 py-4 bg-white/90 text-gray-700 rounded-xl hover:bg-white border border-gray-200 hover:border-purple-300 transition-all duration-300 flex items-center shadow-sm hover:shadow-md"
                >
                  <Filter className="h-4 w-4 mr-2 text-purple-500 group-hover:text-purple-600" />
                  <span className="font-medium">Filter</span>
                </motion.button>
              </div>
            </div>
            
            {/* Search Results Info */}
            {searchTerm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="flex items-center text-sm text-gray-600">
                  <Info className="h-4 w-4 mr-2" />
                  Showing {filteredProducts.length} results for 
                  <span className="mx-1 px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                    "{searchTerm}"
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Products Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => {
              if (deletedProductId === product.id && deleteProductLoading)
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden flex items-center justify-center min-h-[320px]"
                  >
                    <ContentSpinner message="Deleting product..." size="small" />
                  </motion.div>
                );

              const stockStatus = getStockStatus(product.stock);
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-2xl hover:border-blue-200/80 transition-all duration-500"
                >
                  {/* Enhanced Product Image */}
                  <div className="relative h-52 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 overflow-hidden">
                    {product.image ? (
                      <>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-500">
                        <div className="text-center">
                          <Package className="h-12 w-12 text-gray-300 mx-auto mb-2 group-hover:text-blue-400 transition-colors duration-300" />
                          <span className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors duration-300">No Image</span>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Stock Status Badge */}
                    <div className="absolute top-4 left-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg border ${stockStatus.color} border-white/20`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          stockStatus.text === 'In Stock' ? 'bg-green-400' :
                          stockStatus.text === 'Low Stock' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                        {stockStatus.text}
                      </motion.div>
                    </div>

                    {/* Action Buttons Overlay */}
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openDetailModal(product)}
                        className="p-2.5 bg-white/90 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-white border border-white/20 shadow-lg transition-all duration-300"
                      >
                        <Eye className="h-4 w-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const url = `${ProductDetailsRoute}/${product.id}`;
                          navigate(url);
                        }}
                        className="p-2.5 bg-white/90 backdrop-blur-sm text-purple-600 rounded-xl hover:bg-white border border-white/20 shadow-lg transition-all duration-300"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Enhanced Product Info */}
                  <div className="p-6">
                    {/* Product Name and Category */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-blue-800 transition-colors duration-300">
                        {product.name}
                      </h3>
                      {product.category.name && (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.category.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {product.description || "No description available"}
                    </p>

                    {/* Price and Stock Info */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <span className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                            ${product.price}
                          </span>
                          <p className="text-xs text-gray-500">Per unit</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-800">
                            {product.stock}
                          </span>
                          <p className="text-xs text-gray-500">In stock</p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <motion.button
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const url = `${ProductDetailsRoute}/${product.id}`;
                          navigate(url);
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-300"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </motion.button>

                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openModal(product)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteProduct(product.id)}
                          disabled={!!deleteProductLoading}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

        {/* Enhanced Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="col-span-full"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-12 text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl" />
                <div className="relative inline-flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {searchTerm ? 'No products match your search' : 'No products yet'}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? `We couldn't find any products matching "${searchTerm}". Try adjusting your search terms.`
                    : 'Start building your inventory by adding your first product to the catalog.'
                  }
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {searchTerm && (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSearchTerm('');
                        handleSearch('');
                      }}
                      className="px-6 py-3 bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 flex items-center justify-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Search
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openModal()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {searchTerm ? 'Add New Product' : 'Add Your First Product'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Pagination */}
        {metaData.lastPage > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={metaData.lastPage}
                onPageChange={(p) => {
                  setPage(p, metaData.lastPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                perPage={perPage}
                onPerPageChange={(v) => {
                  setPerPage(v);
                }}
                from={metaData.from}
                to={metaData.to}
                total={metaData.total}
                pages={pageList}
              />
            </div>
          </motion.div>
        )}

        {/* Add/Edit Product Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <ProductModal
              formData={formData}
              errors={errors}
              editingProduct={editingProduct}
              imagePreview={imagePreview}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              closeModal={closeModal}
              categories={categories}
              loadingCategories={loadingCategories}
              createProductLoading={createProductLoading}
              updateProductLoading={updateProductLoading}
            />
          )}
        </AnimatePresence>

        {/* Product Detail Modal */}
        <AnimatePresence>
          {isDetailModalOpen && selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              closeModal={closeDetailModal}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Enhanced Product Modal Component
export const ProductModal = ({
  formData,
  errors,
  editingProduct,
  imagePreview,
  handleInputChange,
  handleSubmit,
  closeModal,
  categories,
  loadingCategories,
  createProductLoading,
  updateProductLoading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0, rotateX: 15 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl">
                {editingProduct ? (
                  <Edit className="h-6 w-6 text-white" />
                ) : (
                  <Plus className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}
                </h2>
                <p className="text-gray-600 text-sm">
                  {editingProduct ? "Update product information" : "Create a new product for your inventory"}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeModal}
              className="p-2 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-xl transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Enhanced Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Enhanced Product Image Upload */}
            <div className="flex justify-center mb-8">
              <div className="text-center">
                <label className="relative cursor-pointer group block">
                  <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all duration-500 overflow-hidden">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 p-2 rounded-lg">
                            <Camera className="h-5 w-5 text-gray-700" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center group-hover:scale-105 transition-transform duration-300">
                        <div className="p-4 bg-white/80 rounded-xl mb-3 group-hover:bg-blue-50 transition-colors duration-300">
                          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto group-hover:text-blue-500 transition-colors duration-300" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors duration-300">
                          📷 Upload Image
                        </span>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </label>
                
                {imagePreview && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    type="button"
                    onClick={() => {
                      handleInputChange({ target: { name: 'image', files: null } });
                    }}
                    className="mt-3 text-sm text-red-500 hover:text-red-600 font-medium transition-colors duration-300"
                  >
                    🗑️ Remove Image
                  </motion.button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-20"
                    }`}
                    placeholder="Enter product name"
                  />
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Category */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={loadingCategories} // disable while loadings
                  className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                    errors.category
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-20"
                  }`}
                >
                  {loadingCategories ? (
                    <option>Loading categories...</option>
                  ) : (
                    <>
                      <option value="">Select a category</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                {/* little spinner below select when loading */}
                {loadingCategories && (
                  <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                    <MiniSpinner size="small" />
                    Loading categories...
                  </div>
                )}

                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              {/*check category equals to categories data so it matches and also load categories data in select */}

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.price
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-20"
                    }`}
                    placeholder="0.00"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.stock
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-20"
                    }`}
                    placeholder="0"
                  />
                  <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-300 ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-20"
                }`}
                placeholder="Enter product description..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-300"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!!createProductLoading || !!updateProductLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center"
              >
                {/* little spinner when creating product */}
                {createProductLoading || updateProductLoading ? (
                  <div className="flex items-center gap-2">
                    <MiniSpinner size="small" />
                    {editingProduct ? "Updating" : "Creating"} Product...
                  </div>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    {editingProduct ? "Update" : "Create"} Product
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Product Detail Modal Component
export const ProductDetailModal = ({ product, closeModal }) => {
  const stockStatus = getStockStatus(product.stock);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Product Details
            </h2>
            <button
              onClick={closeModal}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Package className="h-16 w-16 text-gray-300" />
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h3>
                {product.category.name && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.category.name}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 text-green-500 mr-2" />
                  <span className="text-2xl font-bold text-gray-800">
                    ${product.price}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}
                >
                  {stockStatus.text}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Description
                </h4>
                <p className="text-gray-600">
                  {product.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Stock Level
                  </h4>
                  <p className="text-2xl font-bold text-gray-800">
                    {product.stock}
                  </p>
                  <p className="text-sm text-gray-500">units available</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Product ID
                  </h4>
                  <p className="text-lg font-bold text-gray-800">
                    #{product.id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={closeModal}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper function for stock status
const getStockStatus = (stock) => {
  if (stock === 0)
    return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
  if (stock < 10)
    return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
  return { text: "In Stock", color: "bg-green-100 text-green-800" };
};

export default Products;
