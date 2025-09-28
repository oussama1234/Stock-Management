// src/pages/Search/UniversalDashboard.jsx
import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Users, ShoppingCart, Truck, Activity, FileDown, Plus, Grid, ListChecks, UserCog } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductsRoute, UsersRoute, SalesRoute, PurchasesRoute, InventoryRoute } from '@/router/Index';

const Card = React.memo(function Card({ title, icon: Icon, gradient, to, actions = [] }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className={`relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm overflow-hidden`}
    >
      <div className={`absolute -right-16 -top-16 w-56 h-56 ${gradient} rounded-full blur-3xl opacity-20`} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Icon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500">Quick overview and actions</p>
          </div>
        </div>
        {to && (
          <Link to={to} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200">
            Open
          </Link>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {actions.map((a, idx) => (
          <Link key={idx} to={a.to} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${a.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
            {a.icon}
            {a.label}
          </Link>
        ))}
      </div>
    </motion.div>
  );
});

export default function UniversalDashboard() {
  const productActions = useMemo(() => ([
    { label: 'Add', icon: <Plus className="h-4 w-4" />, variant: 'primary', to: ProductsRoute },
    { label: 'View', icon: <Activity className="h-4 w-4" />, to: ProductsRoute },
    { label: 'Export', icon: <FileDown className="h-4 w-4" />, to: ProductsRoute },
  ]), []);
  const userActions = useMemo(() => ([
    { label: 'Manage', icon: <UserCog className="h-4 w-4" />, variant: 'primary', to: UsersRoute },
    { label: 'View', icon: <Activity className="h-4 w-4" />, to: UsersRoute },
  ]), []);
  const salesActions = useMemo(() => ([
    { label: 'View', icon: <Activity className="h-4 w-4" />, variant: 'primary', to: SalesRoute },
    { label: 'Export', icon: <FileDown className="h-4 w-4" />, to: SalesRoute },
  ]), []);
  const purchasesActions = useMemo(() => ([
    { label: 'View', icon: <Activity className="h-4 w-4" />, variant: 'primary', to: PurchasesRoute },
    { label: 'Export', icon: <FileDown className="h-4 w-4" />, to: PurchasesRoute },
  ]), []);
  const movementActions = useMemo(() => ([
    { label: 'View', icon: <Activity className="h-4 w-4" />, variant: 'primary', to: InventoryRoute },
  ]), []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl text-white">
          <Grid className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Universal Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card title="Products" icon={Package} gradient="bg-indigo-400" to={ProductsRoute} actions={productActions} />
        <Card title="Users" icon={Users} gradient="bg-emerald-400" to={UsersRoute} actions={userActions} />
        <Card title="Sales" icon={ShoppingCart} gradient="bg-rose-400" to={SalesRoute} actions={salesActions} />
        <Card title="Purchases" icon={Truck} gradient="bg-amber-400" to={PurchasesRoute} actions={purchasesActions} />
        <Card title="Stock Movements" icon={ListChecks} gradient="bg-cyan-400" to={InventoryRoute} actions={movementActions} />
        <Card title="Reasons (Lost/Damaged)" icon={Activity} gradient="bg-fuchsia-400" to={InventoryRoute} actions={movementActions} />
      </div>
    </div>
  );
}
