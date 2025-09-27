// src/pages/Admin/Purchases/components/PurchasesStats.jsx
// Beautiful stats component showing key purchase metrics with animations

import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package,
  Building2,
  Users
} from "lucide-react";
import { useMemo } from "react";

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      delay,
      type: "spring",
      damping: 20,
      stiffness: 300
    }}
    whileHover={{ 
      scale: 1.05,
      y: -5,
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
    }}
    className={`p-6 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg border border-white/20 backdrop-blur-sm`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center mb-2">
          <Icon className="h-5 w-5 mr-2 opacity-80" />
          <h3 className="text-white/90 text-sm font-medium">{title}</h3>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {subtitle && (
          <div className="text-white/70 text-sm">{subtitle}</div>
        )}
      </div>
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="opacity-20"
      >
        <Icon className="h-12 w-12" />
      </motion.div>
    </div>
  </motion.div>
);

export default function PurchasesStats({ purchases = [], meta = {} }) {
  // Calculate statistics from the purchases data
  const stats = useMemo(() => {
    if (!purchases || purchases.length === 0) {
      return {
        totalPurchases: 0,
        totalAmount: 0,
        avgOrderValue: 0,
        totalItems: 0,
        uniqueSuppliers: 0,
        uniqueUsers: 0
      };
    }

    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, purchase) => sum + Number(purchase.total_amount || 0), 0);
    const avgOrderValue = totalPurchases > 0 ? totalAmount / totalPurchases : 0;
    
    const totalItems = purchases.reduce((sum, purchase) => 
      sum + (purchase.purchaseItems?.length || 0), 0
    );

    const supplierIds = new Set(
      purchases.map(p => p.supplier?.id).filter(Boolean)
    );
    const uniqueSuppliers = supplierIds.size;

    const userIds = new Set(
      purchases.map(p => p.user?.id).filter(Boolean)
    );
    const uniqueUsers = userIds.size;

    return {
      totalPurchases,
      totalAmount,
      avgOrderValue,
      totalItems,
      uniqueSuppliers,
      uniqueUsers
    };
  }, [purchases]);

  // Format currency
  const formatCurrency = (amount) => 
    new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD" 
    }).format(Number(amount || 0));

  // Format number
  const formatNumber = (num) =>
    new Intl.NumberFormat("en-US").format(Number(num || 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Total Purchases"
        value={formatNumber(stats.totalPurchases)}
        subtitle={meta.total ? `of ${formatNumber(meta.total)} total` : null}
        icon={ShoppingBag}
        color="from-blue-500 to-indigo-600"
        delay={0.1}
      />
      
      <StatCard
        title="Total Amount"
        value={formatCurrency(stats.totalAmount)}
        subtitle="Purchase value"
        icon={DollarSign}
        color="from-emerald-500 to-teal-600"
        delay={0.15}
      />
      
      <StatCard
        title="Avg Order Value"
        value={formatCurrency(stats.avgOrderValue)}
        subtitle="Per purchase"
        icon={TrendingUp}
        color="from-purple-500 to-pink-600"
        delay={0.2}
      />
      
      <StatCard
        title="Total Items"
        value={formatNumber(stats.totalItems)}
        subtitle="Line items"
        icon={Package}
        color="from-amber-500 to-orange-600"
        delay={0.25}
      />
      
      <StatCard
        title="Suppliers"
        value={formatNumber(stats.uniqueSuppliers)}
        subtitle="Active suppliers"
        icon={Building2}
        color="from-cyan-500 to-blue-600"
        delay={0.3}
      />
      
      <StatCard
        title="Purchasers"
        value={formatNumber(stats.uniqueUsers)}
        subtitle="Team members"
        icon={Users}
        color="from-rose-500 to-red-600"
        delay={0.35}
      />
    </div>
  );
}
