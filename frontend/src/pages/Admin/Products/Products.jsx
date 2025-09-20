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
      console.log("productsData:", productsData);
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
      console.log("categories:", categoriesData);
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
          console.error("Error updating product:", error);
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
          console.error("Error creating product:", error);
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
        console.log("response called: ", data);
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <div>
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Product Management
          </h1>
          <p className="text-gray-600">
            Manage your inventory and product listings
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Product
        </motion.button>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={(e) => handleSearch(searchTerm)}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-300 flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredProducts.map((product) => {
            if (deletedProductId === product.id && deleteProductLoading)
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-all duration-300 group flex items-center justify-center min-h-[200px]"
                >
                  <ContentSpinner message="Deleting product..." size="small" />
                </motion.div>
              );

            const stockStatus = getStockStatus(product.stock);
            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  )}

                  {/* Stock Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                    >
                      {stockStatus.text}
                    </span>
                  </div>

                  {/* View Details Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openDetailModal(product)}
                    className="absolute top-3 right-3 p-2 bg-white/90 text-blue-600 rounded-lg hover:bg-white transition-colors duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <Eye className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                    {product.name}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                    {product.description || "No description available"}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-lg font-bold text-gray-800">
                        ${product.price}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-sm text-gray-600">
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>

                  {product.category.name && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {product.category.name}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const url = `${ProductDetailsRoute}/${product.id}`;
                        navigate(url);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors duration-300"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </motion.button>

                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal(product)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-300"
                      >
                        <Edit className="h-4 w-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteProduct(product.id)}
                        disabled={!!deleteProductLoading}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-300"
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

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or add a new product
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Product
          </motion.button>
        </motion.div>
      )}

      {/* Pagination */}
      {metaData.lastPage > 1 && (
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
  );
};

// Product Modal Component
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <button
              onClick={closeModal}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Image */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-blue-400 transition-colors duration-300 overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">
                        Upload Image
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-blue-500 p-2 rounded-lg group-hover:bg-blue-600 transition-colors duration-300">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
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
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                >
                  {loadingCategories ? (
                    <option>Loading categories...</option>
                  ) : (
                    <>
                      <option>Select a category</option>
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
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                className={`px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
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
const ProductDetailModal = ({ product, closeModal }) => {
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
