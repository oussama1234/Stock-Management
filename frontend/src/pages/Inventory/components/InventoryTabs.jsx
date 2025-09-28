// src/pages/Inventory/components/InventoryTabs.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DashboardRoute, InventoryRoute, InventoryListRoute, InventoryAdjustmentsRoute, InventoryLowStockRoute } from '@/router/Index';

export default function InventoryTabs({ className = '' }) {
  const location = useLocation();
  const tabClass = (route) => `px-3 py-1.5 rounded-full text-sm border transition ${location.pathname === route ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`;
  return (
    <div className={`mt-3 flex items-center gap-2 flex-wrap ${className}`} role="tablist" aria-label="Inventory sections">
      <Link to={DashboardRoute} className={tabClass(DashboardRoute)} role="tab">Dashboard</Link>
      <Link to={InventoryRoute} className={tabClass(InventoryRoute)} role="tab">Overview</Link>
      <Link to={InventoryListRoute} className={tabClass(InventoryListRoute)} role="tab">Inventory List</Link>
      <Link to={InventoryAdjustmentsRoute} className={tabClass(InventoryAdjustmentsRoute)} role="tab">Adjustments</Link>
      <Link to={InventoryLowStockRoute} className={tabClass(InventoryLowStockRoute)} role="tab">Low Stock</Link>
    </div>
  );
}
