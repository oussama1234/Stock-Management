// Enhanced React Router v7 configuration with lazy loading and nested routes
// Using modern patterns for better performance and maintainability

import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoadingSpinner from "@/components/Spinners/LoadingSpinner";

// Lazy load all components for better performance
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/DashboardHome"));
const MyProfile = lazy(() => import("@/pages/MyProfile"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const SupportPage = lazy(() => import("@/pages/SupportPage"));

// Admin Pages - Lazy loaded
const UsersPage = lazy(() => import("@/pages/Admin/UsersPage"));
const ProductsRefactored = lazy(() => import("@/pages/Admin/Products/ProductsRefactored"));
const ProductDetailsRefactored = lazy(() => import("@/pages/Admin/Products/ProductDetailsRefactored"));
const Sales = lazy(() => import("@/pages/Admin/Sales/Sales"));
const SalesAnalytics = lazy(() => import("@/pages/Admin/Sales/SalesAnalytics"));
const Purchases = lazy(() => import("@/pages/Admin/Purchases/Purchases"));
const PurchasesAnalytics = lazy(() => import("@/pages/Admin/Purchases/PurchasesAnalytics"));
const Categories = lazy(() => import("@/pages/Admin/Categories/Categories"));
const CategoryAnalytics = lazy(() => import("@/pages/Admin/Categories/CategoryAnalytics"));

// Inventory Pages - Lazy loaded
const NewInventoryOverview = lazy(() => import("@/pages/Inventory/NewInventoryOverview"));
const NewInventoryList = lazy(() => import("@/pages/Inventory/NewInventoryList"));
const NewInventoryAdjustments = lazy(() => import("@/pages/Inventory/NewInventoryAdjustments"));
const NewLowStockAlerts = lazy(() => import("@/pages/Inventory/NewLowStockAlerts"));

// Reports Pages - Lazy loaded
const ProductAnalytics = lazy(() => import("@/pages/Reports/Products/ProductAnalytics"));

// Search Pages - Lazy loaded
const UniversalSearchEnhanced = lazy(() => import("@/pages/Search/UniversalSearchEnhanced"));
const UniversalDashboard = lazy(() => import("@/pages/Search/UniversalDashboard"));

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
    <LoadingSpinner size="lg" />
  </div>
);

// Suspense wrapper for lazy components
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<PageLoadingFallback />}>
    {children}
  </Suspense>
);

// Route constants - Enhanced structure
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  
  // Dashboard routes
  DASHBOARD: '/dashboard',
  
  // User management
  PROFILE: '/dashboard/profile',
  USERS: '/dashboard/users',
  
  // Product management
  PRODUCTS: {
    LIST: '/dashboard/products',
    DETAILS: '/dashboard/products/:id',
  },
  
  // Sales management
  SALES: {
    LIST: '/dashboard/sales',
    ANALYTICS: '/dashboard/sales/analytics',
  },
  
  // Purchase management
  PURCHASES: {
    LIST: '/dashboard/purchases',
    ANALYTICS: '/dashboard/purchases/analytics',
  },
  
  // Category management
  CATEGORIES: {
    LIST: '/dashboard/categories',
    ANALYTICS: '/dashboard/categories/analytics',
  },
  
  // Inventory management
  INVENTORY: {
    OVERVIEW: '/dashboard/inventory',
    LIST: '/dashboard/inventory/list',
    ADJUSTMENTS: '/dashboard/inventory/adjustments',
    LOW_STOCK: '/dashboard/inventory/low-stock',
  },
  
  // Reports
  REPORTS: '/dashboard/reports',
  
  // Utilities
  NOTIFICATIONS: '/dashboard/notifications',
  SUPPORT: '/dashboard/support',
  SEARCH: '/dashboard/search',
  UNIVERSAL: '/dashboard/universal',
};

// Legacy route exports for backward compatibility
export const HomeRoute = ROUTES.HOME;
export const LoginRoute = ROUTES.LOGIN;
export const DashboardRoute = ROUTES.DASHBOARD;
export const MyProfileRoute = ROUTES.PROFILE;
export const UsersRoute = ROUTES.USERS;
export const ProductsRoute = ROUTES.PRODUCTS.LIST;
export const ProductDetailsRoute = ROUTES.PRODUCTS.LIST;
export const SalesRoute = ROUTES.SALES.LIST;
export const SalesAnalyticsRoute = ROUTES.SALES.ANALYTICS;
export const PurchasesRoute = ROUTES.PURCHASES.LIST;
export const PurchasesAnalyticsRoute = ROUTES.PURCHASES.ANALYTICS;
export const ReportsRoute = ROUTES.REPORTS;
export const InventoryRoute = ROUTES.INVENTORY.OVERVIEW;
export const CategoriesRoute = ROUTES.CATEGORIES.LIST;
export const CategoriesAnalyticsRoute = ROUTES.CATEGORIES.ANALYTICS;
export const InventoryListRoute = ROUTES.INVENTORY.LIST;
export const InventoryAdjustmentsRoute = ROUTES.INVENTORY.ADJUSTMENTS;
export const InventoryLowStockRoute = ROUTES.INVENTORY.LOW_STOCK;
export const NotificationsRoute = ROUTES.NOTIFICATIONS;
export const SupportRoute = ROUTES.SUPPORT;
export const SearchRoute = ROUTES.SEARCH;
export const UniversalRoute = ROUTES.UNIVERSAL;

// Enhanced routing structure with nested routes for better organization
// Supports lazy loading and modern React Router v7 patterns

// Helper function to create protected dashboard routes
const createDashboardRoute = (Component, path) => ({
  path,
  element: (
    <ProtectedRoute>
      <DashboardLayout>
        <SuspenseWrapper>
          <Component />
        </SuspenseWrapper>
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

// Helper function to create public routes
const createPublicRoute = (Component, path) => ({
  path,
  element: (
    <ProtectedRoute>
      <SuspenseWrapper>
        <Component />
      </SuspenseWrapper>
    </ProtectedRoute>
  ),
});

// Enhanced flat routing structure with lazy loading
// Maintains compatibility with existing sidebar navigation
export const routes = [
  // Public routes
  createPublicRoute(Login, ROUTES.HOME),
  createPublicRoute(Login, ROUTES.LOGIN),
  
  // Dashboard routes - flat structure that works with existing sidebar
  createDashboardRoute(Dashboard, ROUTES.DASHBOARD),
  
  // User management
  createDashboardRoute(MyProfile, ROUTES.PROFILE),
  createDashboardRoute(UsersPage, ROUTES.USERS),
  
  // Product management
  createDashboardRoute(ProductsRefactored, ROUTES.PRODUCTS.LIST),
  createDashboardRoute(ProductDetailsRefactored, ROUTES.PRODUCTS.DETAILS),
  
  // Sales management
  createDashboardRoute(Sales, ROUTES.SALES.LIST),
  createDashboardRoute(SalesAnalytics, ROUTES.SALES.ANALYTICS),
  
  // Purchase management
  createDashboardRoute(Purchases, ROUTES.PURCHASES.LIST),
  createDashboardRoute(PurchasesAnalytics, ROUTES.PURCHASES.ANALYTICS),
  
  // Category management
  createDashboardRoute(Categories, ROUTES.CATEGORIES.LIST),
  createDashboardRoute(CategoryAnalytics, ROUTES.CATEGORIES.ANALYTICS),
  
  // Inventory management
  createDashboardRoute(NewInventoryOverview, ROUTES.INVENTORY.OVERVIEW),
  createDashboardRoute(NewInventoryList, ROUTES.INVENTORY.LIST),
  createDashboardRoute(NewInventoryAdjustments, ROUTES.INVENTORY.ADJUSTMENTS),
  createDashboardRoute(NewLowStockAlerts, ROUTES.INVENTORY.LOW_STOCK),
  
  // Reports
  createDashboardRoute(ProductAnalytics, ROUTES.REPORTS),
  
  // Utility pages
  createDashboardRoute(NotificationsPage, ROUTES.NOTIFICATIONS),
  createDashboardRoute(SupportPage, ROUTES.SUPPORT),
  createDashboardRoute(UniversalSearchEnhanced, ROUTES.SEARCH),
  createDashboardRoute(UniversalDashboard, ROUTES.UNIVERSAL),
  
  // 404 catch-all route
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
];

const router = createBrowserRouter(routes);

export default router;
