// ProductDetails.jsx
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  Download,
  Edit,
  Eye,
  Package,
  Plus,
  Printer,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ContentSpinner from "../../../components/Spinners/ContentSpinner";
import { useToast } from "../../../components/Toaster/ToastContext";
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);

  // Sample data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Simulate API calls
      setTimeout(() => {
        const sampleProduct = {
          id: parseInt(id),
          name: "Wireless Headphones",
          description:
            "Premium wireless headphones with noise cancellation and 30-hour battery life",
          image: null,
          price: 199.99,
          stock: 45,
          category: "Electronics",
          sku: "ELEC-001",
          createdAt: "2023-01-15",
          updatedAt: "2023-10-20",
        };

        const samplePurchases = [
          {
            id: 1,
            supplier: {
              id: 1,
              name: "Tech Supplies Inc.",
              email: "contact@techsupplies.com",
              phone: "+1-555-0123",
              address: "123 Tech Street, San Francisco, CA",
            },
            user: {
              id: 1,
              name: "Oussama Meqqadmi",
            },
            quantity: 50,
            price: 150.0,
            total_amount: 7500.0,
            purchase_date: "2023-10-15T10:30:00",
            createdAt: "2023-10-15T10:30:00",
          },
          {
            id: 2,
            supplier: {
              id: 2,
              name: "Global Electronics",
              email: "sales@globalelectronics.com",
              phone: "+1-555-0456",
              address: "456 Circuit Ave, Austin, TX",
            },
            user: {
              id: 2,
              name: "Sarah Johnson",
            },
            quantity: 30,
            price: 145.0,
            total_amount: 4350.0,
            purchase_date: "2023-08-22T14:15:00",
            createdAt: "2023-08-22T14:15:00",
          },
        ];

        const sampleSales = [
          {
            id: 1,
            customer_name: "John Smith",
            user: {
              id: 1,
              name: "Oussama Meqqadmi",
            },
            quantity: 2,
            price: 199.99,
            total_amount: 399.98,
            tax: 28.0,
            discount: 0.0,
            sale_date: "2023-10-18T09:45:00",
            createdAt: "2023-10-18T09:45:00",
          },
          {
            id: 2,
            customer_name: "Emma Wilson",
            user: {
              id: 3,
              name: "Mike Chen",
            },
            quantity: 1,
            price: 199.99,
            total_amount: 199.99,
            tax: 14.0,
            discount: 10.0,
            sale_date: "2023-10-12T16:20:00",
            createdAt: "2023-10-12T16:20:00",
          },
          {
            id: 3,
            customer_name: "Retail Store #45",
            user: {
              id: 2,
              name: "Sarah Johnson",
            },
            quantity: 10,
            price: 180.0,
            total_amount: 1800.0,
            tax: 126.0,
            discount: 0.0,
            sale_date: "2023-09-30T11:30:00",
            createdAt: "2023-09-30T11:30:00",
          },
        ];

        const sampleStockHistory = [
          {
            id: 1,
            type: "purchase",
            quantity: 50,
            previous_stock: 0,
            new_stock: 50,
            date: "2023-10-15T10:30:00",
            reference: "Purchase #001",
          },
          {
            id: 2,
            type: "sale",
            quantity: -2,
            previous_stock: 50,
            new_stock: 48,
            date: "2023-10-18T09:45:00",
            reference: "Sale #001",
          },
          {
            id: 3,
            type: "sale",
            quantity: -1,
            previous_stock: 48,
            new_stock: 47,
            date: "2023-10-12T16:20:00",
            reference: "Sale #002",
          },
          {
            id: 4,
            type: "purchase",
            quantity: 30,
            previous_stock: 47,
            new_stock: 77,
            date: "2023-08-22T14:15:00",
            reference: "Purchase #002",
          },
          {
            id: 5,
            type: "sale",
            quantity: -10,
            previous_stock: 77,
            new_stock: 67,
            date: "2023-09-30T11:30:00",
            reference: "Sale #003",
          },
          {
            id: 6,
            type: "adjustment",
            quantity: -22,
            previous_stock: 67,
            new_stock: 45,
            date: "2023-10-20T08:00:00",
            reference: "Stock Adjustment",
          },
        ];

        setProduct(sampleProduct);
        setPurchases(samplePurchases);
        setSales(sampleSales);
        setStockHistory(sampleStockHistory);
        setIsLoading(false);
      }, 1500);
    };

    fetchData();
  }, [id]);

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock < 10)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <ContentSpinner message="Loading product details..." fullWidth />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Product not found
          </h3>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 rounded-xl mr-4 hover:bg-gray-200 transition-colors duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Product Details
            </h1>
            <p className="text-gray-600">
              Manage and track product information
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-300"
          >
            <Printer className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-300"
          >
            <Download className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Product Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="md:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h2>
                <div className="flex items-center space-x-3 mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}
                  >
                    {stockStatus.text}
                  </span>
                  {product.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.category}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            </div>

            <p className="text-gray-600 mb-6">{product.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Price
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {formatCurrency(product.price)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <Package className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Current Stock
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {product.stock} units
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Total Sold
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {sales.reduce((total, sale) => total + sale.quantity, 0)}{" "}
                  units
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <ShoppingCart className="h-4 w-4 text-orange-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Total Revenue
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {formatCurrency(
                    sales.reduce((total, sale) => total + sale.total_amount, 0)
                  )}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-300 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Sale
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex overflow-x-auto space-x-1 mb-6"
      >
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "purchases", label: "Purchases", icon: Truck },
          { id: "sales", label: "Sales", icon: TrendingUp },
          { id: "stock-history", label: "Stock History", icon: Package },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6"
      >
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <OverviewTab
              product={product}
              purchases={purchases}
              sales={sales}
            />
          )}

          {activeTab === "purchases" && (
            <PurchasesTab
              purchases={purchases}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "sales" && (
            <SalesTab
              sales={sales}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "stock-history" && (
            <StockHistoryTab
              stockHistory={stockHistory}
              formatDate={formatDate}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ product, purchases, sales }) => {
  const totalPurchased = purchases.reduce(
    (total, purchase) => total + purchase.quantity,
    0
  );
  const totalSold = sales.reduce((total, sale) => total + sale.quantity, 0);
  const totalPurchaseValue = purchases.reduce(
    (total, purchase) => total + purchase.total_amount,
    0
  );
  const totalSaleValue = sales.reduce(
    (total, sale) => total + sale.total_amount,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Product Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <Package className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Current Stock
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {product.stock} units
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Total Sold
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalSold} units</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <Truck className="h-5 w-5 text-purple-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Total Purchased
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {totalPurchased} units
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <DollarSign className="h-5 w-5 text-orange-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Profit Margin
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {totalSaleValue > 0
              ? Math.round(
                  ((totalSaleValue - totalPurchaseValue) / totalSaleValue) * 100
                )
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Activity
          </h4>
          <div className="space-y-3">
            {[...purchases, ...sales]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
              .map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.quantity} units{" "}
                      {item.total_amount ? "sold" : "purchased"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-gray-800">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(item.total_amount)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Stock Analysis
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Stock Level</span>
                <span className="text-sm font-medium text-gray-800">
                  {product.stock} units
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min((product.stock / 100) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Sales Velocity</span>
                <span className="text-sm font-medium text-gray-800">
                  12 units/week
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Restock Need</span>
                <span className="text-sm font-medium text-gray-800">
                  In 3 weeks
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "30%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Purchases Tab Component
const PurchasesTab = ({ purchases, formatCurrency, formatDate }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Purchase History
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </motion.button>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No purchases found
          </h4>
          <p className="text-gray-500">
            This product hasn't been purchased yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Purchased By
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDate(purchase.purchase_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {purchase.supplier.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {purchase.supplier.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {purchase.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(purchase.price)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {formatCurrency(purchase.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {purchase.user.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

// Sales Tab Component
const SalesTab = ({ sales, formatCurrency, formatDate }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Sales History</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-300 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Sale
        </motion.button>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No sales found
          </h4>
          <p className="text-gray-500">This product hasn't been sold yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Tax
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Sold By
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDate(sale.sale_date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {sale.customer_name || "Walk-in Customer"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {sale.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(sale.price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(sale.discount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(sale.tax)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {sale.user.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

// Stock History Tab Component
const StockHistoryTab = ({ stockHistory, formatDate }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case "purchase":
        return "text-green-600 bg-green-100";
      case "sale":
        return "text-red-600 bg-red-100";
      case "adjustment":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "purchase":
        return <Truck className="h-4 w-4" />;
      case "sale":
        return <TrendingUp className="h-4 w-4" />;
      case "adjustment":
        return <Package className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Stock History
      </h3>

      {stockHistory.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No stock history
          </h4>
          <p className="text-gray-500">No stock movements recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stockHistory.map((history) => (
            <div
              key={history.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${getTypeColor(history.type)}`}>
                  {getTypeIcon(history.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-800 capitalize">
                    {history.type}
                  </p>
                  <p className="text-sm text-gray-500">{history.reference}</p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`font-bold ${
                    history.quantity > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {history.quantity > 0 ? "+" : ""}
                  {history.quantity} units
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(history.date)}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">Previous</p>
                <p className="font-medium text-gray-800">
                  {history.previous_stock}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">New</p>
                <p className="font-medium text-gray-800">{history.new_stock}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProductDetails;
