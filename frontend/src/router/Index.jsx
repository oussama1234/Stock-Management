// routing for all pages here for the frontend
// export all routes as an array of objects
// adding each route to its exported const roiutes names

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProductDetailsRefactored from "@/pages/Admin/Products/ProductDetailsRefactored";
import ProductsRefactored from "@/pages/Admin/Products/ProductsRefactored";
import Purchases from "@/pages/Admin/Purchases/Purchases";
import PurchasesAnalytics from "@/pages/Admin/Purchases/PurchasesAnalytics";
import Sales from "@/pages/Admin/Sales/Sales";
import SalesAnalytics from "@/pages/Admin/Sales/SalesAnalytics";
import UsersPage from "@/pages/Admin/UsersPage";
import Dashboard from "@/pages/DashboardHome";
import Login from "@/pages/Login";
import UniversalSearchPage from "@/pages/Search/UniversalSearchPage";
import UniversalDashboard from "@/pages/Search/UniversalDashboard";
import MyProfile from "@/pages/MyProfile";
import NotFound from "@/pages/NotFound";
import NotificationsPage from "@/pages/NotificationsPage";
import SupportPage from "@/pages/SupportPage";
import ReportsDashboard from "@/pages/Reports/ReportsDashboard";
import InventoryDashboardPage from "@/pages/Inventory/InventoryDashboardPage";
import InventoryListPage from "@/pages/Inventory/InventoryListPage";
import InventoryAdjustmentsPage from "@/pages/Inventory/InventoryAdjustmentsPage";
import LowStockAlertsPage from "@/pages/Inventory/LowStockAlertsPage";
import { createBrowserRouter } from "react-router-dom";

export const HomeRoute = "/"; // home route
export const LoginRoute = "/login"; // login route
export const DashboardRoute = "/dashboard"; // dashboard route
export const MyProfileRoute = DashboardRoute + "/profile";
export const UsersRoute = DashboardRoute + "/users";
export const ProductsRoute = DashboardRoute + "/products";
export const ProductDetailsRoute = DashboardRoute + "/products";
export const SalesRoute = DashboardRoute + "/sales";
export const SalesAnalyticsRoute = DashboardRoute + "/sales/analytics";
export const PurchasesRoute = DashboardRoute + "/purchases";
export const PurchasesAnalyticsRoute = DashboardRoute + "/purchases/analytics";
export const ReportsRoute = DashboardRoute + "/reports";
export const InventoryRoute = DashboardRoute + "/inventory";
export const InventoryListRoute = DashboardRoute + "/inventory/list";
export const InventoryAdjustmentsRoute = DashboardRoute + "/inventory/adjustments";
export const InventoryLowStockRoute = DashboardRoute + "/inventory/low-stock";
export const NotificationsRoute = DashboardRoute + "/notifications";
export const SupportRoute = DashboardRoute + "/support";
export const SearchRoute = DashboardRoute + "/search";
export const UniversalRoute = DashboardRoute + "/universal";

// dashboard route needs to follow dashboard layout

export const routes = [
  {
    path: HomeRoute,
    element: (
      <ProtectedRoute>
        <Login />
      </ProtectedRoute>
    ),
  },
  {
    path: LoginRoute,
    element: (
      <ProtectedRoute>
        <Login />
      </ProtectedRoute>
    ),
  },
  {
    path: DashboardRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: MyProfileRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <MyProfile />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: UsersRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <UsersPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: ProductsRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <ProductsRefactored />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: ProductDetailsRoute + "/:id",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <ProductDetailsRefactored />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: SalesRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Sales />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: SalesAnalyticsRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <SalesAnalytics />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: PurchasesRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Purchases />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: PurchasesAnalyticsRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <PurchasesAnalytics />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: ReportsRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <ReportsDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: InventoryRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <InventoryDashboardPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: InventoryListRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <InventoryListPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: InventoryAdjustmentsRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <InventoryAdjustmentsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: InventoryLowStockRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <LowStockAlertsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: NotificationsRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <NotificationsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: SupportRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <SupportPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: SearchRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <UniversalSearchPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: UniversalRoute,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <UniversalDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter(routes);

export default router;
