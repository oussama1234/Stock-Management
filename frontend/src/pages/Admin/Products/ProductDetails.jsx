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
import { useGetProductQuery } from "../../../GraphQL/Products/Queries/Products";
import { useGetPurchaseItemsByProductQuery } from "../../../GraphQL/PurchaseItem/Queries/PurchaseItemsByProduct";
import { useGetSaleItemsByProductQuery } from "../../../GraphQL/SaleItem/Queries/SaleItemsByProduct";
import { useGetStockMovementsByProductQuery } from "../../../GraphQL/StockMovement/Queries/StockMovementsQuery";
const ProductDetails = () => {
  const { id } = useParams();

  const {
    data: productData,
    loading: productLoading,
    error: productError,
  } = useGetProductQuery(parseInt(id));

  const {
    data: saleItemsData,
    loading: saleItemsLoading,
    error: saleItemsError,
  } = useGetSaleItemsByProductQuery(parseInt(id));

  const {
    data: purchaseItemsData,
    loading: purchaseItemsLoading,
    error: purchaseItemsError,
  } = useGetPurchaseItemsByProductQuery(parseInt(id));

  const {
    data: stockMovementsData,
    loading: stockMovementsLoading,
    error: stockMovementsError,
  } = useGetStockMovementsByProductQuery(parseInt(id));

  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const [product, setProduct] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);

  // Simulate data for purchases, sales, and stock history

  useEffect(() => {
    if (productData?.productById) {
      setProduct({
        id: productData.productById.id,
        name: productData.productById.name,
        description: productData.productById.description,
        image: productData.productById.image,
        price: productData.productById.price,
        stock: productData.productById.stock,
        category: productData.productById.category.name,
        createdAt: productData.productById.createdAt,
        updatedAt: productData.productById.updatedAt,
        // take 4 first letters of the category and join them with dashes
        sku:
          productData.productById.category.name
            .split(" ")
            .map((word) => word.substring(0, 4).toUpperCase())
            .join("") +
          "-" +
          (productData.productById.id < 10
            ? "00" + productData.productById.id
            : productData.productById.id),
      });
    }

    if (purchaseItemsData?.purchaseItemsByProduct) {
      const formattedPurchases = purchaseItemsData.purchaseItemsByProduct.map(
        (item) => ({
          id: item.id,
          supplier: {
            id: item.purchase.supplier.id,
            name: item.purchase.supplier.name,
          },
          user: {
            id: item.purchase.user.id,
            name: item.purchase.user.name,
            email: item.purchase.user.email,
            role: item.purchase.user.role,
          },
          quantity: item.quantity,
          price: item.price,
          total_amount: item.quantity * item.price,
          purchase_date: item.purchase.purchase_date,
          createdAt: item.created_at,
        })
      );
      setPurchases(formattedPurchases);
    }

    if (saleItemsData?.saleItemsByProduct) {
      const formattedSales = saleItemsData.saleItemsByProduct.map((item) => ({
        id: item.id,
        customer_name: item.sale.customer_name,
        user: {
          id: item.sale.user.id,
          name: item.sale.user.name,
          email: item.sale.user.email,
          role: item.sale.user.role,
        },
        quantity: item.quantity,
        price: item.price,
        total_amount: item.price * item.quantity,
        tax: item.sale.tax,
        discount: item.sale.discount,
        sale_date: item.sale.sale_date,
        createdAt: item.created_at,
      }));
      setSales(formattedSales);
    }

    if (stockMovementsData?.stockMovementsByProduct) {
      const formattedStockHistory = stockMovementsData.stockMovementsByProduct.map(
        (item) => {
          // server-provided signed quantity? keep UI convention: out movements negative
          const signedQty = item.type === "out" ? -Math.abs(item.quantity) : Math.abs(item.quantity);
          // Prefer backend-provided previous/new stock; fallback to computed for backward compatibility
          const prev = item.previous_stock ?? (item.type === "in" ? (item.new_stock != null ? item.new_stock - Math.abs(item.quantity) : null) : (item.new_stock != null ? item.new_stock + Math.abs(item.quantity) : null));
          const next = item.new_stock ?? (prev != null ? prev + signedQty : null);
          return {
            id: item.id,
            type: item.source?.__typename === "PurchaseItem" || item.type === "in" ? "purchase" : "sale",
            quantity: signedQty,
            previous_stock: prev,
            new_stock: next,
            date: item.movement_date,
            reference: item.source_id < 10 ? "#00" + item.source_id : "#" + item.source_id,
          };
        }
      );
      setStockHistory(formattedStockHistory);
    }

    // setPurchases(samplePurchases);
  }, [productData, saleItemsData, purchaseItemsData, id, stockMovementsData]);

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

  const getSalesVelocity = (sales) => {
    if (!sales || sales.length === 0) return 0;

    const totalUnitsSold = sales.reduce(
      (total, sale) => total + sale.quantity,
      0
    );

    const firstSaleDate = new Date(
      Math.min(...sales.map((s) => new Date(s.sale_date)))
    );
    const lastSaleDate = new Date(
      Math.max(...sales.map((s) => new Date(s.sale_date)))
    );

    const diffMonths =
      (lastSaleDate.getFullYear() - firstSaleDate.getFullYear()) * 12 +
      (lastSaleDate.getMonth() - firstSaleDate.getMonth()) +
      1; // avoid zero

    return Math.round(totalUnitsSold / diffMonths);
  };

  const restockNeeded = (currentStock, sales) => {
    const salesVelocity = getSalesVelocity(sales);
    // Estimate how many units are needed per month
    return salesVelocity > currentStock ? salesVelocity - currentStock : 0;
  };

  if (
    productLoading ||
    saleItemsLoading ||
    purchaseItemsLoading ||
    stockMovementsLoading
  ) {
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
              restockNeeded={restockNeeded}
              getSalesVelocity={getSalesVelocity}
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
const OverviewTab = ({
  product,
  purchases,
  sales,
  restockNeeded,
  getSalesVelocity,
}) => {
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
            {(() => {
              const merged = [
                ...purchases.map((p) => ({ ...p, type: "purchase" })),
                ...sales.map((s) => ({ ...s, type: "sale" })),
              ];
              // You can now render merged items here, for example:
              return merged
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || b.purchase_date || b.sale_date) -
                    new Date(a.createdAt || a.purchase_date || a.sale_date)
                )
                .slice(0, 5)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === "purchase"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span className="text-gray-700">
                      {item.type === "purchase"
                        ? `Purchased ${item.quantity} units from ${item.supplier.name}`
                        : `Sold ${item.quantity} units to ${
                            item.customer_name || "Customer"
                          }`}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(
                        item.createdAt || item.purchase_date || item.sale_date
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ));
            })()}
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
                  {getSalesVelocity(sales)} units/month
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(getSalesVelocity(sales), 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Restock Needed</span>
                <span className="text-sm font-medium text-gray-800">
                  {restockNeeded(product.stock, sales)} units/month
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      restockNeeded(product.stock, sales),
                      100
                    )}%`,
                  }}
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
                  <td className="px-4 py-3 text-sm text-gray-700 flex items-center">
                    {purchase.user.name}{" "}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.user.role === "admin"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {purchase.user.role}
                    </span>
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
                  <td className="px-4 py-3 text-sm text-gray-700 flex items-center">
                    {sale.user.name}{" "}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.user.role === "admin"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {sale.user.role}
                    </span>
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
                  title={`${history.quantity > 0 ? "+" : ""}${history.quantity} units`}
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
                  {history.previous_stock ?? "-"}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">New</p>
                <p className="font-medium text-gray-800">{history.new_stock ?? "-"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProductDetails;
