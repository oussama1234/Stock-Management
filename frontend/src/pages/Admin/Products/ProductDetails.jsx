// ProductDetails.jsx
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  Download,
  Edit,
  Eye,
  Info,
  Package,
  Plus,
  Printer,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCategoriesQuery } from "../../../GraphQL/Categories/Queries/Categories";
import { useUpdateProductMutation } from "../../../GraphQL/Products/Mutations/UpdateProduct";
import { useGetProductQuery } from "../../../GraphQL/Products/Queries/Products";
import { usePaginatedPurchaseItemsByProductQuery } from "../../../GraphQL/PurchaseItem/Queries/PaginatedPurchaseItemsByProduct";
import { useCreateSaleItemMutation } from "../../../GraphQL/SaleItem/Mutations/CreateSaleItem";
import { usePaginatedSaleItemsByProductQuery } from "../../../GraphQL/SaleItem/Queries/PaginatedSaleItemsByProduct";
import { usePaginatedStockMovementsByProductQuery } from "../../../GraphQL/StockMovement/Queries/PaginatedStockMovementsByProduct";
import ContentSpinner from "../../../components/Spinners/ContentSpinner";
import PaginationControls from "../../../components/pagination/PaginationControls";
import usePagination from "../../../components/pagination/usePagination";
import { useToast } from "../../../components/Toaster/ToastContext";
import { ProductModal } from "./Products";
import PurchaseModal from "../Purchases/components/PurchaseModal";
import SaleModal from "../Sales/components/SaleModal";
import { createPurchase } from "../../../api/Purchases";
import { createSale } from "../../../api/Sales";
const ProductDetails = () => {
  const { id } = useParams();

  const {
    data: productData,
    loading: productLoading,
    error: productError,
  } = useGetProductQuery(parseInt(id));


  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const [product, setProduct] = useState(null);

  // Load summary data for main product summary display
  const {
    data: mainSalesData,
  } = usePaginatedSaleItemsByProductQuery(product?.id, 1, 50);

  const {
    data: mainPurchasesData,
  } = usePaginatedPurchaseItemsByProductQuery(product?.id, 1, 50);

  // Extract data for main summary
  const mainSales = mainSalesData?.paginatedSaleItemsByProduct?.data || [];
  const mainPurchases = mainPurchasesData?.paginatedPurchaseItemsByProduct?.data || [];

  // Quick analytics for main summary
  const getSalesVelocity = () => {
    if (!mainSales || mainSales.length === 0) return 0;
    const totalSold = mainSales.reduce((total, sale) => total + (sale.quantity || 0), 0);
    if (totalSold === 0) return 0;
    
    const validSales = mainSales
      .map(s => {
        const dateStr = s.sale?.sale_date || s.created_at;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      })
      .filter(date => date !== null)
      .sort((a, b) => a - b);
      
    if (validSales.length < 2) return totalSold;
    
    const firstSaleDate = validSales[0];
    const lastSaleDate = validSales[validSales.length - 1];
    
    const diffMonths = Math.max(1, 
      (lastSaleDate.getFullYear() - firstSaleDate.getFullYear()) * 12 +
      (lastSaleDate.getMonth() - firstSaleDate.getMonth()) + 1
    );

    return Math.round(totalSold / diffMonths);
  };

  const totalSaleValue = mainSales.reduce((total, sale) => {
    const saleTotal = sale.sale?.total_amount || (sale.quantity * sale.price);
    return total + (saleTotal || 0);
  }, 0);
  
  const totalPurchaseValue = mainPurchases.reduce((total, purchase) => {
    const purchaseTotal = purchase.purchase?.total_amount || (purchase.quantity * purchase.price);
    return total + (purchaseTotal || 0);
  }, 0);
  
  const profitValue = totalSaleValue - totalPurchaseValue;

  // Edit Product Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: "",
    description: "",
    image: null,
    price: "",
    stock: "",
    category: null,
  });
  const [editErrors, setEditErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Quick Sale Modal state
  const [isQuickSaleModalOpen, setIsQuickSaleModalOpen] = useState(false);
  const [quickSaleData, setQuickSaleData] = useState({
    customer_name: "",
    quantity: 1,
    price: "",
    tax: 0,
    discount: 0,
  });

  // Purchase Modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Sale Modal state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Categories and mutations
  const [loadCategories, { data: categoriesData, loading: loadingCategories }] =
    useCategoriesQuery();
  const { updateProduct, loading: updateProductLoading } =
    useUpdateProductMutation();

  const [categories, setCategories] = useState([]);

  // Initialize product data from GraphQL query

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
        createdAt: productData.productById.created_at,
        updatedAt: productData.productById.updated_at,
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
  }, [productData, id]);

  // Load categories data
  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData?.categories]);

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
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Not set';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Not set';
      }
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return 'Not set';
    }
  };


  // Edit Product Modal Functions
  const openEditModal = () => {
    if (!product) return;

    loadCategories();
    setEditFormData({
      id: product.id,
      name: product.name,
      description: product.description || "",
      image: product.image,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: productData?.productById?.category?.id || null,
    });
    setImagePreview(product.image);
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData({
      id: null,
      name: "",
      description: "",
      image: null,
      price: "",
      stock: "",
      category: null,
    });
    setImagePreview(null);
    setEditErrors({});
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    const files = e.target.files;
    setEditFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors((prev) => ({
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

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!editFormData.price || parseFloat(editFormData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!editFormData.stock || parseInt(editFormData.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }
    if (!editFormData.category) {
      newErrors.category = "Category is required";
    }

    if (!editFormData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (validateEditForm()) {
      try {
        const { data } = await updateProduct({
          variables: {
            id: product.id,
            product: {
              name: editFormData.name,
              description: editFormData.description,
              image:
                editFormData.image instanceof File ? editFormData.image : null,
              price: parseFloat(editFormData.price),
              stock: parseInt(editFormData.stock),
              category_id: parseInt(editFormData.category),
            },
          },
        });

        // Update the product state

        setProduct({
          ...product,
          ...data.updateProduct,
          price: parseFloat(data.updateProduct.price),
          stock: parseInt(data.updateProduct.stock),
          category: data.updateProduct.category.name,
          createdAt: data.updateProduct.created_at,
          updatedAt: data.updateProduct.updated_at,
          // take 4 first letters of the category and join them with dashes
          sku:
            data.updateProduct.category.name
              .split(" ")
              .map((word) => word.substring(0, 4).toUpperCase())
              .join("") +
            "-" +
            (data.updateProduct.id < 10
              ? "00" + data.updateProduct.id
              : data.updateProduct.id),
        });

        toast.success("Product updated successfully!");
        closeEditModal();
      } catch (error) {
        console.error("Error updating product:", error);
        toast.error(
          error?.errors?.[0]?.extensions?.validation?.["product.image"]?.[0] ||
            "Error updating product"
        );
      }
    }
  };

  // Quick Sale Modal Functions
  const openQuickSaleModal = () => {
    if (!product) return;

    setQuickSaleData({
      customer_name: "",
      quantity: 1,
      price: product.price.toString(),
      tax: 0,
      discount: 0,
    });
    setIsQuickSaleModalOpen(true);
  };

  const closeQuickSaleModal = () => {
    setIsQuickSaleModalOpen(false);
    setQuickSaleData({
      customer_name: "",
      quantity: 1,
      price: "",
      tax: 0,
      discount: 0,
    });
  };

  // Purchase Modal Functions
  const openPurchaseModal = () => {
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
  };

  const handlePurchaseSubmit = async (payload) => {
    try {
      await createPurchase(payload);
      toast.success("Purchase created successfully! 🎉");
      closePurchaseModal();
      // Refetch data to update the UI
      // The purchases tab will automatically refresh with the new pagination
    } catch (error) {
      console.error("Error creating purchase:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Error creating purchase";
      toast.error(errorMessage);
      throw error; // Re-throw to let modal know there was an error
    }
  };

  // Sale Modal Functions
  const openSaleModal = () => {
    setIsSaleModalOpen(true);
  };

  const closeSaleModal = () => {
    setIsSaleModalOpen(false);
  };

  const handleSaleSubmit = async (payload) => {
    try {
      await createSale(payload);
      toast.success("Sale created successfully! 🎉");
      closeSaleModal();
      // Refetch data to update the UI
      // The sales tab will automatically refresh with the new pagination
    } catch (error) {
      console.error("Error creating sale:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Error creating sale";
      toast.error(errorMessage);
      throw error; // Re-throw to let modal know there was an error
    }
  };

  // Print functionality
  const handlePrint = () => {
    const printData = generatePrintData();
    const printWindow = window.open("", "_blank");
    printWindow.document.write(generatePrintHTML(printData));
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintData = () => {
    // Use actual calculated values from main summary (same as overview tab)
    const actualTotalSold = mainSales.reduce((total, sale) => total + (sale.quantity || 0), 0);
    const actualTotalPurchased = mainPurchases.reduce((total, purchase) => total + (purchase.quantity || 0), 0);
    const actualTotalSaleValue = totalSaleValue;
    const actualTotalPurchaseValue = totalPurchaseValue;
    const actualProfitValue = profitValue;
    const actualProfitPercentage = actualTotalSaleValue > 0 ? (actualProfitValue / actualTotalSaleValue) * 100 : 0;
    const actualSalesVelocity = getSalesVelocity();

    // Calculate restock needed
    const monthsOfStock = actualSalesVelocity > 0 ? product.stock / actualSalesVelocity : Infinity;
    const restockNeeded = monthsOfStock < 1 ? Math.max(0, actualSalesVelocity - product.stock) : 0;

    let salesHighlight = "No significant sales activity";
    if (actualSalesVelocity > 0) {
      salesHighlight = `Sales velocity: ${actualSalesVelocity} units/month${restockNeeded > 0 ? ` - Restock ${restockNeeded} units needed` : " - Stock levels adequate"}`;
    }

    return {
      name: product.name,
      image: product.image,
      description: product.description,
      category: product.category,
      sellingPrice: product.price,
      availableStock: product.stock,
      sku: product.sku,
      salesCount: actualTotalSold,
      purchasesCount: actualTotalPurchased,
      profitPercentage: actualProfitPercentage.toFixed(2),
      profitNumber: actualProfitValue.toFixed(2),
      totalSoldValue: actualTotalSaleValue.toFixed(2),
      totalPurchasedValue: actualTotalPurchaseValue.toFixed(2),
      salesVelocity: actualSalesVelocity,
      restockNeeded: restockNeeded,
      salesHighlight: salesHighlight,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  };

  const generatePrintHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product Details - ${data.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { color: #1f2937; font-size: 28px; margin: 0 0 10px 0; }
          .header p { color: #6b7280; margin: 0; }
          .product-info { display: grid; grid-template-columns: 250px 1fr; gap: 30px; margin-bottom: 40px; background: #f8fafc; padding: 25px; border-radius: 12px; }
          .product-image { width: 250px; height: 200px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .product-details h2 { color: #1f2937; font-size: 24px; margin: 0 0 15px 0; }
          .product-details p { margin: 5px 0; }
          .product-details strong { color: #374151; }
          .sku-badge { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-top: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .info-item { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid #e5e7eb; }
          .info-item.profit { border-left-color: #10b981; }
          .info-item.sales { border-left-color: #3b82f6; }
          .info-item.stock { border-left-color: #8b5cf6; }
          .info-item.purchases { border-left-color: #f59e0b; }
          .info-label { font-weight: 600; color: #374151; font-size: 14px; margin-bottom: 8px; }
          .info-value { font-size: 18px; font-weight: 700; color: #1f2937; }
          .highlight { background: linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%); border-left-color: #3b82f6; }
          .analytics-section { margin-top: 30px; }
          .analytics-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
          .metadata-item { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .metadata-label { font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .metadata-value { color: #1f2937; margin-top: 5px; }
          @media print { 
            body { margin: 0; font-size: 12px; }
            .header h1 { font-size: 24px; }
            .product-details h2 { font-size: 20px; }
            .info-value { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 Product Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        
        <div class="product-info">
          <div>
            ${
              data.image
                ? `<img src="${data.image}" alt="${data.name}" class="product-image" />`
                : '<div class="product-image" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); color: #9ca3af; font-size: 16px; font-weight: 600;">📦 No Image</div>'
            }
          </div>
          <div class="product-details">
            <h2>${data.name}</h2>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <span class="sku-badge">SKU: ${data.sku}</span>
          </div>
        </div>
        
        <div class="analytics-section">
          <h3 class="analytics-title">📊 Performance Analytics</h3>
          <div class="info-grid">
            <div class="info-item stock">
              <div class="info-label">💼 Current Selling Price</div>
              <div class="info-value">$${data.sellingPrice}</div>
            </div>
            <div class="info-item stock">
              <div class="info-label">📦 Available Stock</div>
              <div class="info-value">${data.availableStock} units</div>
            </div>
            <div class="info-item sales">
              <div class="info-label">📈 Total Units Sold</div>
              <div class="info-value">${data.salesCount} units</div>
            </div>
            <div class="info-item purchases">
              <div class="info-label">🚛 Total Units Purchased</div>
              <div class="info-value">${data.purchasesCount} units</div>
            </div>
            <div class="info-item profit">
              <div class="info-label">💰 Total Revenue</div>
              <div class="info-value">$${data.totalSoldValue}</div>
            </div>
            <div class="info-item purchases">
              <div class="info-label">💳 Total Purchase Cost</div>
              <div class="info-value">$${data.totalPurchasedValue}</div>
            </div>
            <div class="info-item profit">
              <div class="info-label">📊 Profit Margin</div>
              <div class="info-value">${data.profitPercentage}%</div>
            </div>
            <div class="info-item profit">
              <div class="info-label">💵 Net Profit</div>
              <div class="info-value">$${data.profitNumber}</div>
            </div>
            <div class="info-item sales">
              <div class="info-label">⚡ Sales Velocity</div>
              <div class="info-value">${data.salesVelocity} units/month</div>
            </div>
            <div class="info-item stock">
              <div class="info-label">🔄 Restock Needed</div>
              <div class="info-value">${data.restockNeeded} units</div>
            </div>
            ${
              data.salesHighlight
                ? `
            <div class="info-item highlight" style="grid-column: 1 / -1;">
              <div class="info-label">🎯 Key Insights</div>
              <div class="info-value" style="font-size: 16px; line-height: 1.5;">${data.salesHighlight}</div>
            </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="metadata">
          <div class="metadata-item">
            <div class="metadata-label">Created Date</div>
            <div class="metadata-value">${new Date(data.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Last Updated</div>
            <div class="metadata-value">${new Date(data.updatedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download CSV functionality - Enhanced with multiple sheets
  const handleDownloadCSV = () => {
    const data = generatePrintData();
    const excelData = generateExcelData(data);

    // Create workbook and worksheets
    const wb = {
      SheetNames: ["Product Summary", "Purchases", "Sales"],
      Sheets: {},
    };

    // Product Summary Sheet
    const productHeaders = [
      "Product Name",
      "Description",
      "Category",
      "Selling Price",
      "Available Stock",
      "Sales Count",
      "Purchases Count",
      "Profit Percentage",
      "Profit Amount",
      "Total Sold Value",
      "Total Purchased Value",
      "Sales Highlight",
    ];

    const productData = [
      [
        data.name,
        data.description,
        data.category,
        data.sellingPrice,
        data.availableStock,
        data.salesCount,
        data.purchasesCount,
        `${data.profitPercentage}%`,
        `$${data.profitNumber}`,
        `$${data.totalSoldValue}`,
        `$${data.totalPurchasedValue}`,
        data.salesHighlight,
      ],
    ];

    wb.Sheets["Product Summary"] = arrayToSheet([
      productHeaders,
      ...productData,
    ]);

    // Purchases Sheet
    const purchaseHeaders = [
      "Purchase ID",
      "Date",
      "Supplier",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Purchased By",
    ];

    // TODO: Add pagination support for comprehensive exports
    const purchaseData = [["No data - use Purchases tab for detailed view"]];
    wb.Sheets["Purchases"] = arrayToSheet([purchaseHeaders, ...purchaseData]);

    // Sales Sheet
    const salesHeaders = [
      "Sale ID",
      "Date",
      "Customer",
      "Quantity",
      "Unit Price",
      "Tax",
      "Discount",
      "Total Amount",
      "Sold By",
    ];

    const salesData = [["No data - use Sales tab for detailed view"]];
    wb.Sheets["Sales"] = arrayToSheet([salesHeaders, ...salesData]);

    // Convert to CSV format (multiple files approach since we can't do multi-sheet CSV)
    downloadAsMultipleCSVs(wb, data);
  };

  const arrayToSheet = (data) => {
    const ws = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };

    for (let R = 0; R < data.length; ++R) {
      for (let C = 0; C < data[R].length; ++C) {
        if (range.s.r > R) range.s.r = R;
        if (range.s.c > C) range.s.c = C;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;

        const cell_ref = encodeCell({ c: C, r: R });
        const cell = { v: data[R][C] };

        if (cell.v == null) continue;

        if (typeof cell.v === "number") cell.t = "n";
        else if (typeof cell.v === "boolean") cell.t = "b";
        else cell.t = "s";

        ws[cell_ref] = cell;
      }
    }

    if (range.s.c < 10000000) ws["!ref"] = encodeRange(range);
    return ws;
  };

  const encodeCell = (cell) => {
    return String.fromCharCode(65 + cell.c) + (cell.r + 1);
  };

  const encodeRange = (range) => {
    return encodeCell(range.s) + ":" + encodeCell(range.e);
  };

  const downloadAsMultipleCSVs = (wb, data) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const baseFilename = `product-${product.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-${timestamp}`;

    // Download Product Summary
    const productCSV = convertSheetToCSV(wb.Sheets["Product Summary"]);
    downloadCSVFile(productCSV, `${baseFilename}-summary.csv`);

    // Download Purchases
    const purchasesCSV = convertSheetToCSV(wb.Sheets["Purchases"]);
    downloadCSVFile(purchasesCSV, `${baseFilename}-purchases.csv`);

    // Download Sales
    const salesCSV = convertSheetToCSV(wb.Sheets["Sales"]);
    downloadCSVFile(salesCSV, `${baseFilename}-sales.csv`);

    toast.success(
      "CSV files downloaded successfully! Check your downloads folder for 3 files."
    );
  };

  const convertSheetToCSV = (sheet) => {
    const range = decodeRange(sheet["!ref"] || "A1:A1");
    const rows = [];

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = encodeCell({ c: C, r: R });
        const cell = sheet[cell_ref];
        row.push(cell ? `"${cell.v}"` : '""');
      }
      rows.push(row.join(","));
    }

    return rows.join("\n");
  };

  const decodeRange = (range) => {
    const parts = range.split(":");
    return {
      s: decodeCell(parts[0]),
      e: decodeCell(parts[1] || parts[0]),
    };
  };

  const decodeCell = (cellRef) => {
    const match = cellRef.match(/([A-Z]+)(\d+)/);
    if (!match) return { c: 0, r: 0 };

    let col = 0;
    for (let i = 0; i < match[1].length; i++) {
      col = col * 26 + (match[1].charCodeAt(i) - 64);
    }

    return {
      c: col - 1,
      r: parseInt(match[2]) - 1,
    };
  };

  const downloadCSVFile = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateExcelData = (data) => {
    return {
      product: data,
      purchases: [], // TODO: Add pagination support for exports
      sales: [], // TODO: Add pagination support for exports
    };
  };

  if (productLoading) {
    return (
      <div className="max-w-[90rem] mx-auto p-6">
        <ContentSpinner message="Loading product details..." fullWidth />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[90rem] mx-auto p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-[90rem] mx-auto p-6">
        {/* Enhanced Header */}
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
                {/* Enhanced Back Button */}
                <motion.button
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(-1)}
                  className="group p-3 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform duration-300" />
                </motion.button>
                
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2"
                  >
                    📦 Product Analytics
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-gray-600 text-lg"
                  >
                    Comprehensive product insights and management
                  </motion.p>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center space-x-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                  className="group px-6 py-3 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 flex items-center shadow-sm hover:shadow-md"
                >
                  <div className="p-1 bg-gray-100 group-hover:bg-green-100 rounded-lg mr-3 transition-colors duration-300">
                    <Printer className="h-4 w-4 group-hover:text-green-600 transition-colors duration-300" />
                  </div>
                  <span className="font-medium">Print Report</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadCSV}
                  className="group px-6 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-xl hover:shadow-2xl"
                >
                  <div className="p-1 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors duration-300">
                    <Download className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Export Data</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Product Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 p-8 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
                    <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                      {product.name}
                    </h2>
                    <div className="flex items-center space-x-3">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm shadow-lg border ${stockStatus.color} border-white/20`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          stockStatus.text === 'In Stock' ? 'bg-green-400' :
                          stockStatus.text === 'Low Stock' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                        {stockStatus.text}
                      </motion.span>
                      {product.category && (
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 shadow-sm"
                        >
                          <Tag className="h-3 w-3 mr-2" />
                          {product.category}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="bg-white/80 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-mono font-semibold text-gray-800">{product.sku}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Product Image */}
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 rounded-2xl overflow-hidden border border-gray-200/50 shadow-lg">
                    {product.image ? (
                      <>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                          <span className="text-gray-500 font-medium">No Image Available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Description and Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-200/50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-blue-500" />
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {product.description || "No description available for this product."}
                    </p>
                  </div>

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Unit Price</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Current Stock</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {product.stock} <span className="text-sm text-gray-500">units</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(totalSaleValue)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <ShoppingCart className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Net Profit</p>
                          <p className={`text-2xl font-bold ${
                            profitValue >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(profitValue)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openEditModal}
                      className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="p-1 bg-white/20 rounded-lg mr-3">
                        <Edit className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Edit Product</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openQuickSaleModal}
                      className="flex items-center px-6 py-3 bg-white hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-2xl border border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-lg"
                    >
                      <div className="p-1 bg-gray-100 hover:bg-green-100 rounded-lg mr-3 transition-colors duration-300">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Quick Sale</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-2">
            <div className="flex overflow-x-auto space-x-2">
              {[
                { id: "overview", label: "Overview", icon: BarChart3, color: "from-blue-500 to-indigo-500" },
                { id: "purchases", label: "Purchases", icon: Truck, color: "from-cyan-500 to-blue-500" },
                { id: "sales", label: "Sales", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
                { id: "stock-history", label: "Stock History", icon: Package, color: "from-purple-500 to-pink-500" },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-xl`
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mr-3 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white/20"
                      : "bg-gray-100"
                  }`}>
                    <tab.icon className="h-4 w-4" />
                  </div>
                  <span>{tab.label}</span>
                  
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8"
        >
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <OverviewTab
              product={product}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "purchases" && (
            <PurchasesTab
              productId={product?.id}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onNewPurchase={openPurchaseModal}
            />
          )}

          {activeTab === "sales" && (
            <SalesTab
              productId={product?.id}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onNewSale={openSaleModal}
            />
          )}

          {activeTab === "stock-history" && (
            <StockHistoryTab
              productId={product?.id}
              formatDate={formatDate}
            />
          )}
        </AnimatePresence>
        </motion.div>

        {/* Enhanced Modals */}
        <AnimatePresence>
          {isEditModalOpen && (
            <ProductModal
              formData={editFormData}
              errors={editErrors}
              editingProduct={{ id: editFormData.id }}
              imagePreview={imagePreview}
              handleInputChange={handleEditInputChange}
              handleSubmit={handleEditSubmit}
              closeModal={closeEditModal}
              categories={categories}
              loadingCategories={loadingCategories}
              createProductLoading={false}
              updateProductLoading={updateProductLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isQuickSaleModalOpen && (
            <QuickSaleModal
              product={product}
              quickSaleData={quickSaleData}
              setQuickSaleData={setQuickSaleData}
              closeModal={closeQuickSaleModal}
              formatCurrency={formatCurrency}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPurchaseModalOpen && (
            <PurchaseModal
              open={isPurchaseModalOpen}
              onClose={closePurchaseModal}
              onSubmit={handlePurchaseSubmit}
              initial={null}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSaleModalOpen && (
            <SaleModal
              open={isSaleModalOpen}
              onClose={closeSaleModal}
              onSubmit={handleSaleSubmit}
              initial={null}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
const OverviewTab = ({
  product,
  formatCurrency,
  formatDate,
}) => {
  // Load summary data for analytics (first 100 records to get meaningful analytics)
  const {
    data: salesSummaryData,
    loading: salesSummaryLoading,
  } = usePaginatedSaleItemsByProductQuery(product?.id, 1, 100);

  const {
    data: purchasesSummaryData,
    loading: purchasesSummaryLoading,
  } = usePaginatedPurchaseItemsByProductQuery(product?.id, 1, 100);

  const {
    data: stockMovementsSummaryData,
    loading: stockMovementsSummaryLoading,
  } = usePaginatedStockMovementsByProductQuery(product?.id, 1, 50);

  // Extract data arrays for calculations
  const salesData = salesSummaryData?.paginatedSaleItemsByProduct?.data || [];
  const purchasesData = purchasesSummaryData?.paginatedPurchaseItemsByProduct?.data || [];
  const stockMovementsData = stockMovementsSummaryData?.paginatedStockMovementsByProduct?.data || [];

  // Analytics calculations
  const totalSold = salesData.reduce((total, sale) => total + (sale.quantity || 0), 0);
  const totalPurchased = purchasesData.reduce((total, purchase) => total + (purchase.quantity || 0), 0);
  const totalSaleValue = salesData.reduce((total, sale) => {
    const saleTotal = sale.sale?.total_amount || (sale.quantity * sale.price);
    return total + (saleTotal || 0);
  }, 0);
  const totalPurchaseValue = purchasesData.reduce((total, purchase) => {
    const purchaseTotal = purchase.purchase?.total_amount || (purchase.quantity * purchase.price);
    return total + (purchaseTotal || 0);
  }, 0);
  
  const profitValue = totalSaleValue - totalPurchaseValue;
  const profitPercentage = totalSaleValue > 0 ? (profitValue / totalSaleValue) * 100 : 0;

  // Sales velocity calculation (units per month)
  const getSalesVelocity = () => {
    if (!salesData || salesData.length === 0) return 0;

    const totalUnitsSold = totalSold;
    if (totalUnitsSold === 0) return 0;
    
    const validSales = salesData
      .map(s => {
        const dateStr = s.sale?.sale_date || s.created_at;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      })
      .filter(date => date !== null)
      .sort((a, b) => a - b);
      
    if (validSales.length < 2) {
      // If we only have one or no valid dates, assume it's within the last month
      return totalUnitsSold;
    }
    
    const firstSaleDate = validSales[0];
    const lastSaleDate = validSales[validSales.length - 1];
    
    const diffMonths = Math.max(1, 
      (lastSaleDate.getFullYear() - firstSaleDate.getFullYear()) * 12 +
      (lastSaleDate.getMonth() - firstSaleDate.getMonth()) + 1
    );

    return Math.round(totalUnitsSold / diffMonths);
  };

  // Restock calculation
  const getRestockNeeded = () => {
    const velocity = getSalesVelocity();
    const monthsOfStock = velocity > 0 ? product.stock / velocity : Infinity;
    return monthsOfStock < 1 ? Math.max(0, velocity - product.stock) : 0;
  };

  // Recent activity (combine sales and purchases)
  const getRecentActivity = () => {
    const recentSales = salesData.slice(0, 3).map(sale => ({
      ...sale,
      type: 'sale',
      date: sale.sale?.sale_date || sale.created_at,
    }));
    const recentPurchases = purchasesData.slice(0, 3).map(purchase => ({
      ...purchase,
      type: 'purchase',
      date: purchase.purchase?.purchase_date || purchase.created_at,
    }));
    
    return [...recentSales, ...recentPurchases]
      .filter(item => item.date) // Filter out items without valid dates
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Most recent first
      })
      .slice(0, 5);
  };

  const salesVelocity = getSalesVelocity();
  const restockNeeded = getRestockNeeded();
  const recentActivity = getRecentActivity();
  const isLoading = salesSummaryLoading || purchasesSummaryLoading || stockMovementsSummaryLoading;

  if (isLoading) {
    return (
      <div className="py-12">
        <ContentSpinner message="Loading overview data..." />
      </div>
    );
  }

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

      {/* Key Metrics */}
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
            {profitPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Analytics and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Activity
          </h4>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === "purchase"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {item.type === "purchase" ? "Purchase" : "Sale"}
                  </span>
                  <span className="text-gray-700 flex-1">
                    {item.type === "purchase"
                      ? `${item.quantity} units from ${item.purchase?.supplier?.name || 'supplier'}`
                      : `${item.quantity} units to ${item.sale?.customer_name || 'customer'}`}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {formatDate(item.date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Analysis */}
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
                    width: `${Math.min((product.stock / Math.max(product.stock, 50)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Sales Velocity</span>
                <span className="text-sm font-medium text-gray-800">
                  {salesVelocity} units/month
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min((salesVelocity / Math.max(salesVelocity, 20)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Restock Needed</span>
                <span className="text-sm font-medium text-gray-800">
                  {restockNeeded} units
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    restockNeeded > 0 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: restockNeeded > 0 ? '100%' : '20%',
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(totalSaleValue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit Amount:</span>
                <span className={`font-medium ${
                  profitValue >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(profitValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Product Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Product ID:</span>
              <span className="font-medium text-gray-800">#{product.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SKU:</span>
              <span className="font-medium text-gray-800">{product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium text-gray-800">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unit Price:</span>
              <span className="font-medium text-gray-800">{formatCurrency(product.price)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-800">
                {formatDate(product.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium text-gray-800">
                {formatDate(product.updatedAt)}
              </span>
            </div>
          </div>
        </div>
        {product.description && (
          <div className="mt-4">
            <span className="text-gray-600 block mb-2">Description:</span>
            <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{product.description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Purchases Tab Component
const PurchasesTab = ({ productId, formatCurrency, formatDate, onNewPurchase }) => {
  const { currentPage, perPage, setPage, setPerPage, generatePages } = usePagination({
    initialPage: 1,
    initialPerPage: 10,
  });

  const {
    data: purchasesData,
    loading: purchasesLoading,
    error: purchasesError,
    refetch,
  } = usePaginatedPurchaseItemsByProductQuery(productId, currentPage, perPage);

  const purchases = purchasesData?.paginatedPurchaseItemsByProduct?.data || [];
  const meta = purchasesData?.paginatedPurchaseItemsByProduct?.meta;
  const pages = meta ? generatePages(meta.last_page) : [];

  const handlePageChange = (page) => {
    setPage(page, meta?.last_page);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
  };

  if (purchasesLoading && !purchasesData) {
    return (
      <div className="py-12">
        <ContentSpinner message="Loading purchases..." />
      </div>
    );
  }

  if (purchasesError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading purchases data</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Purchase History
        </h3>
        <button 
          onClick={onNewPurchase}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </button>
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
        <>
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
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(purchase.purchase?.purchase_date || purchase.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {purchase.purchase?.supplier?.name || 'Unknown Supplier'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {purchase.purchase?.supplier?.email || 'No email'}
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
                      {formatCurrency(purchase.total_amount || (purchase.quantity * purchase.price))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 flex items-center">
                      {purchase.purchase?.user?.name || 'Unknown User'}{" "}
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          purchase.purchase?.user?.role === "admin"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {purchase.purchase?.user?.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-800 transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <PaginationControls
              currentPage={meta.current_page}
              totalPages={meta.last_page}
              onPageChange={handlePageChange}
              perPage={meta.per_page}
              onPerPageChange={handlePerPageChange}
              from={meta.from}
              to={meta.to}
              total={meta.total}
              perPageOptions={[5, 10, 15, 20]}
              pages={pages}
            />
          )}
        </>
      )}
    </div>
  );
};

// Sales Tab Component
const SalesTab = ({ productId, formatCurrency, formatDate, onNewSale }) => {
  const { currentPage, perPage, setPage, setPerPage, generatePages } = usePagination({
    initialPage: 1,
    initialPerPage: 10,
  });

  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
    refetch,
  } = usePaginatedSaleItemsByProductQuery(productId, currentPage, perPage);

  const sales = salesData?.paginatedSaleItemsByProduct?.data || [];
  const meta = salesData?.paginatedSaleItemsByProduct?.meta;
  const pages = meta ? generatePages(meta.last_page) : [];

  const handlePageChange = (page) => {
    setPage(page, meta?.last_page);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
  };

  if (salesLoading && !salesData) {
    return (
      <div className="py-12">
        <ContentSpinner message="Loading sales..." />
      </div>
    );
  }

  if (salesError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading sales data</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Sales History</h3>
        <button 
          onClick={onNewSale}
          className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-300 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Sale
        </button>
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
        <>
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
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(sale.sale?.sale_date || sale.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {sale.sale?.customer_name || "Walk-in Customer"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sale.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(sale.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(sale.sale?.discount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(sale.sale?.tax || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {formatCurrency(sale.sale?.total_amount || (sale.quantity * sale.price))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 flex items-center">
                      {sale.sale?.user?.name || 'Unknown User'}{" "}
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.sale?.user?.role === "admin"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {sale.sale?.user?.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-800 transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <PaginationControls
              currentPage={meta.current_page}
              totalPages={meta.last_page}
              onPageChange={handlePageChange}
              perPage={meta.per_page}
              onPerPageChange={handlePerPageChange}
              from={meta.from}
              to={meta.to}
              total={meta.total}
              perPageOptions={[5, 10, 15, 20]}
              pages={pages}
            />
          )}
        </>
      )}
    </div>
  );
};

// Stock History Tab Component
const StockHistoryTab = ({ productId, formatDate }) => {
  const { currentPage, perPage, setPage, setPerPage, generatePages } = usePagination({
    initialPage: 1,
    initialPerPage: 10,
  });

  const {
    data: stockMovementsData,
    loading: stockMovementsLoading,
    error: stockMovementsError,
    refetch,
  } = usePaginatedStockMovementsByProductQuery(productId, currentPage, perPage);

  const stockHistory = stockMovementsData?.paginatedStockMovementsByProduct?.data || [];
  const meta = stockMovementsData?.paginatedStockMovementsByProduct?.meta;
  const pages = meta ? generatePages(meta.last_page) : [];

  const handlePageChange = (page) => {
    setPage(page, meta?.last_page);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "in":
      case "purchase":
        return "text-green-600 bg-green-100";
      case "out":
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
      case "in":
      case "purchase":
        return <Truck className="h-4 w-4" />;
      case "out":
      case "sale":
        return <TrendingUp className="h-4 w-4" />;
      case "adjustment":
        return <Package className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  if (stockMovementsLoading && !stockMovementsData) {
    return (
      <div className="py-12">
        <ContentSpinner message="Loading stock movements..." />
      </div>
    );
  }

  if (stockMovementsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading stock movements data</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300">
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
        <>
          <div className="space-y-4">
            {stockHistory.map((history) => {
              // Debug logging
              console.log('Stock history item:', {
                id: history.id,
                type: history.type,
                quantity: history.quantity,
                reference: history.reference
              });
              
              // Determine display values based on movement type
              const displayQuantity = Math.abs(history.quantity);
              let sign = "";
              let colorClass = "text-gray-600";
              let inlineStyle = { color: '#6b7280' }; // default gray
              
              if (history.type === "in" || history.type === "purchase") {
                sign = "+";
                colorClass = "text-green-600";
                inlineStyle = { color: '#059669' }; // green-600
              } else if (history.type === "out" || history.type === "sale") {
                sign = "-";
                colorClass = "text-red-600";
                inlineStyle = { color: '#dc2626' }; // red-600
              } else if (history.type === "adjustment") {
                if (history.quantity > 0) {
                  sign = "+";
                  colorClass = "text-green-600";
                  inlineStyle = { color: '#059669' }; // green-600
                } else {
                  sign = "-";
                  colorClass = "text-red-600";
                  inlineStyle = { color: '#dc2626' }; // red-600
                }
              }
              
              console.log('Computed values:', {
                type: history.type,
                quantity: history.quantity,
                displayQuantity,
                sign,
                colorClass,
                inlineStyle
              });
              
              return (
                <div
                  key={history.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
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
                      className={`font-bold ${colorClass}`}
                      style={inlineStyle}
                      title={`${sign}${displayQuantity} units`}
                    >
                      {sign}{displayQuantity} units
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(history.movement_date || history.created_at)}
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
                  <p className="font-medium text-gray-800">
                    {history.new_stock ?? "-"}
                  </p>
                </div>
              </div>
              );
            })}
          </div>

          {meta && (
            <PaginationControls
              currentPage={meta.current_page}
              totalPages={meta.last_page}
              onPageChange={handlePageChange}
              perPage={meta.per_page}
              onPerPageChange={handlePerPageChange}
              from={meta.from}
              to={meta.to}
              total={meta.total}
              perPageOptions={[5, 10, 15, 20]}
              pages={pages}
            />
          )}
        </>
      )}
    </div>
  );
};

// Quick Sale Modal Component - Supports both creating and editing sales
const QuickSaleModal = ({
  product,
  quickSaleData,
  setQuickSaleData,
  closeModal,
  formatCurrency,
  editingSale = null,
}) => {
  const toast = useToast();
  const [errors, setErrors] = useState({});
  const {
    createSaleItem,
    data: createSaleItemData,
    loading: createSaleItemLoading,
    error: createSaleItemError,
  } = useCreateSaleItemMutation();

  // GraphQL mutations with loading states

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuickSaleData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!quickSaleData.quantity || quickSaleData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (quickSaleData.quantity > product.stock) {
      newErrors.quantity = `Cannot sell more than available stock (${product.stock} units)`;
    }

    if (!quickSaleData.price || quickSaleData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (quickSaleData.tax < 0) {
      newErrors.tax = "Tax cannot be negative";
    }

    if (quickSaleData.discount < 0) {
      newErrors.discount = "Discount cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Prepare GraphQL variables for both create and update

      if (editingSale) {
        // Update existing sale
      } else {
        // Create new sale

        // Calculate absolute tax and discount amounts from percentages
        const subtotal = parseFloat(quickSaleData.price) * parseInt(quickSaleData.quantity);
        const taxAmount = subtotal * (parseFloat(quickSaleData.tax || 0) / 100);
        const discountAmount = subtotal * (parseFloat(quickSaleData.discount || 0) / 100);
        
        const result = await createSaleItem({
          variables: {
            saleItem: {
              product_id: product.id,
              quantity: parseInt(quickSaleData.quantity),
              price: parseFloat(quickSaleData.price),
              tax: taxAmount, // Send absolute tax amount, not percentage
              discount: discountAmount, // Send absolute discount amount, not percentage
              customer_name: quickSaleData.customer_name,
            },
          },
        });

        /*    id: item.id,
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
        createdAt: item.created_at, */

        setSales((prev) => [
          ...prev,
          {
            id: result.data.createSaleByProduct.id,
            customer_name: result.data.createSaleByProduct.sale.customer_name,
            user: {
              id: result.data.createSaleByProduct.sale.user.id,
              name: result.data.createSaleByProduct.sale.user.name,
              email: result.data.createSaleByProduct.sale.user.email,
              role: result.data.createSaleByProduct.sale.user.role,
            },
            quantity: result.data.createSaleByProduct.quantity,
            price: result.data.createSaleByProduct.price,
            total_amount:
              result.data.createSaleByProduct.price *
              result.data.createSaleByProduct.quantity,
            tax: result.data.createSaleByProduct.sale.tax,
            discount: result.data.createSaleByProduct.sale.discount,
            sale_date: result.data.createSaleByProduct.sale.sale_date,
            createdAt: result.data.createSaleByProduct.created_at,
          },
        ]);
      }
      toast.success("Sale created successfully!");
      closeModal();
    } catch (error) {
      toast.error(error.message || "Failed to create or update sale.");
    }
  };

  const subtotal =
    parseFloat(quickSaleData.price || 0) *
    parseInt(quickSaleData.quantity || 0);
  const taxAmount = subtotal * (parseFloat(quickSaleData.tax || 0) / 100);
  const discountAmount =
    subtotal * (parseFloat(quickSaleData.discount || 0) / 100);
  const total = subtotal + taxAmount - discountAmount;

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
              {editingSale ? "Edit Sale" : "Quick Sale"} - {product?.name}
            </h2>
            <button
              onClick={closeModal}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Info */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {product?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Available: {product?.stock} units
                  </p>
                  <p className="text-sm text-gray-600">
                    Current Price: {formatCurrency(product?.price)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={quickSaleData.customer_name}
                  onChange={handleInputChange}
                  className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="Optional"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={quickSaleData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  max={product?.stock}
                  className={`px-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none ${
                    errors.quantity
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={quickSaleData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`px-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none ${
                    errors.price
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              {/* Tax */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax (%)
                </label>
                <input
                  type="number"
                  name="tax"
                  value={quickSaleData.tax}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`px-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none ${
                    errors.tax
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {errors.tax && (
                  <p className="text-red-500 text-sm mt-1">{errors.tax}</p>
                )}
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={quickSaleData.discount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`px-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none ${
                    errors.discount
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {errors.discount && (
                  <p className="text-red-500 text-sm mt-1">{errors.discount}</p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-800 mb-3">
                Order Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tax ({quickSaleData.tax}%):
                  </span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Discount ({quickSaleData.discount}%):
                  </span>
                  <span className="text-red-600">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
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
                whileHover={{ scale: createSaleItemLoading ? 1 : 1.02 }}
                whileTap={{ scale: createSaleItemLoading ? 1 : 0.98 }}
                disabled={createSaleItemLoading}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center ${
                  createSaleItemLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {createSaleItemLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Sale...
                  </div>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {editingSale ? "Update Sale" : "Create Quick Sale"}
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

export default ProductDetails;
