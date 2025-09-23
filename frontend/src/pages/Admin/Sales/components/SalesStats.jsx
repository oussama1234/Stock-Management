// src/pages/Admin/Sales/components/SalesStats.jsx
// Beautiful stats component showing key sales metrics with animations

import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Package,
  Users,
  Star,
  Target,
  Zap
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

export default function SalesStats({ sales = [], meta = {} }) {
  // Calculate statistics from the sales data
  const stats = useMemo(() => {
    if (!sales || sales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        totalItems: 0,
        uniqueCustomers: 0,
        totalTax: 0,
        totalDiscount: 0,
        netRevenue: 0
      };
    }

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const totalItems = sales.reduce((sum, sale) => 
      sum + (sale.items?.length || 0), 0
    );

    // Count unique customers (using customer_name as identifier)
    const customerNames = new Set(
      sales.map(s => s.customer_name).filter(Boolean)
    );
    const uniqueCustomers = customerNames.size;

    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax || 0), 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discount || 0), 0);
    const netRevenue = totalRevenue - totalDiscount;

    return {
      totalSales,
      totalRevenue,
      avgOrderValue,
      totalItems,
      uniqueCustomers,
      totalTax,
      totalDiscount,
      netRevenue
    };
  }, [sales]);

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
        title="Total Sales"
        value={formatNumber(stats.totalSales)}
        subtitle={meta.total ? `of ${formatNumber(meta.total)} total` : null}
        icon={ShoppingCart}
        color="from-indigo-500 to-purple-600"
        delay={0.1}
      />
      
      <StatCard
        title="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        subtitle="Gross sales"
        icon={DollarSign}
        color="from-emerald-500 to-teal-600"
        delay={0.15}
      />
      
      <StatCard
        title="Avg Order Value"
        value={formatCurrency(stats.avgOrderValue)}
        subtitle="Per sale"
        icon={TrendingUp}
        color="from-purple-500 to-pink-600"
        delay={0.2}
      />
      
      <StatCard
        title="Items Sold"
        value={formatNumber(stats.totalItems)}
        subtitle="Line items"
        icon={Package}
        color="from-amber-500 to-orange-600"
        delay={0.25}
      />
      
      <StatCard
        title="Customers"
        value={formatNumber(stats.uniqueCustomers)}
        subtitle="Unique buyers"
        icon={Users}
        color="from-cyan-500 to-blue-600"
        delay={0.3}
      />
      
      <StatCard
        title="Net Revenue"
        value={formatCurrency(stats.netRevenue)}
        subtitle="After discounts"
        icon={Star}
        color="from-rose-500 to-red-600"
        delay={0.35}
      />
    </div>
  );
}