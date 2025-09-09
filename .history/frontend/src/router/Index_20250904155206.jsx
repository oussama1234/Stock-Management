// routing for all pages here for the frontend
// export all routes as an array of objects
// adding each route to its exported const roiutes names

import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/DashboardHome";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";

export const HomeRoute = "/"; // home route
export const LoginRoute = "/login"; // login route
export const DashboardRoute = "/dashboard"; // dashboard route


// dashboard route needs to follow dashboard layout

export const routes = [
  { path: HomeRoute, element: <Login /> },
  { path: LoginRoute, element: <Login /> },
  { path: DashboardRoute, element: <ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute> },
  { path: "*", element: <NotFound /> }
];

const router = createBrowserRouter(routes);

export default router;