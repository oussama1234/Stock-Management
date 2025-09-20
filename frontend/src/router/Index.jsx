// routing for all pages here for the frontend
// export all routes as an array of objects
// adding each route to its exported const roiutes names

import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/DashboardHome";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import MyProfile from "@/pages/MyProfile";
import UsersPage from "@/pages/Admin/UsersPage";
import Products from "@/pages/Admin/Products/Products";
import ProductDetails from "@/pages/Admin/Products/ProductDetails";
import Sales from "@/pages/Admin/Sales/Sales";
import SalesAnalytics from "@/pages/Admin/Sales/SalesAnalytics";

export const HomeRoute = "/"; // home route
export const LoginRoute = "/login"; // login route
export const DashboardRoute = "/dashboard"; // dashboard route
export const MyProfileRoute = DashboardRoute + "/profile";
export const UsersRoute = DashboardRoute + "/users";
export const ProductsRoute = DashboardRoute + "/products";
export const ProductDetailsRoute = DashboardRoute + "/products";
export const SalesRoute = DashboardRoute + "/sales";
export const SalesAnalyticsRoute = DashboardRoute + "/sales/analytics";


// dashboard route needs to follow dashboard layout

export const routes = [
  { path: HomeRoute, element: <ProtectedRoute><Login /></ProtectedRoute> },
  { path: LoginRoute, element: <ProtectedRoute><Login /></ProtectedRoute> },
  { path: DashboardRoute, element: <ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute> },
  { path : MyProfileRoute, element : <ProtectedRoute><DashboardLayout><MyProfile /></DashboardLayout></ProtectedRoute>},
  {path: UsersRoute, element : <ProtectedRoute><DashboardLayout><UsersPage /></DashboardLayout></ProtectedRoute>},
  {path: ProductsRoute, element : <ProtectedRoute><DashboardLayout><Products /></DashboardLayout></ProtectedRoute>},
  {path: ProductDetailsRoute + "/:id", element : <ProtectedRoute><DashboardLayout><ProductDetails /></DashboardLayout></ProtectedRoute>},
  {path: SalesRoute, element : <ProtectedRoute><DashboardLayout><Sales /></DashboardLayout></ProtectedRoute>},
  {path: SalesAnalyticsRoute, element : <ProtectedRoute><DashboardLayout><SalesAnalytics /></DashboardLayout></ProtectedRoute>},
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter(routes);

export default router;