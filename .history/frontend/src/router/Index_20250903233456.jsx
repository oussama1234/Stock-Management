// routing for all pages here for the frontend
// export all routes as an array of objects
// adding each route to its exported const roiutes names

import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

export const routes = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter(routes);

export default router;