// routing for all pages here for the frontend
// export all routes as an array of objects
// adding each route to its exported const roiutes names

import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/DashboardHome";
import NotFound from "@/pages/NotFound";

// dashboard route needs to follow dashboard layout

export const routes = [
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <DashboardLayout><Dashboard /></DashboardLayout> },
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter(routes);

export default router;