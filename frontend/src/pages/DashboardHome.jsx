// DashboardHome.jsx
// Dashboard page built from small, memoized components and a dedicated data hook.
// Performance principles:
// - Separate data fetching (useDashboardMetrics) from presentation components
// - Memoize and minimize renders via React.memo and useMemo
// - Lightweight SVG for charts (no heavy chart libs)
// - Clear comments and JSDoc for maintainability

import { motion } from "framer-motion";
import {
  LineChart,
  Package2,
  Percent,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import ContentSpinner from "@/components/Spinners/ContentSpinner";

// Data hook and utils
import { useDashboardMetrics } from "@/pages/Dashboard/useDashboardMetrics";
import { fmtCurrency, fmtNumber } from "@/pages/Dashboard/utils";
import { ProductsRoute, UsersRoute, SalesRoute } from "@/router/Index";

// Reusable components
import CategoryDistribution from "@/pages/Dashboard/components/CategoryDistribution";
import KpiCard from "@/pages/Dashboard/components/KpiCard";
import LowStockList from "@/pages/Dashboard/components/LowStockList";
import SectionCard from "@/pages/Dashboard/components/SectionCard";
import SparkLine from "@/pages/Dashboard/components/SparkLine";
import StockMovement from "@/pages/Dashboard/components/StockMovement";
import StockValue from "@/pages/Dashboard/components/StockValue";
import TopSellingTable from "@/pages/Dashboard/components/TopSellingTable";
import DateRangePicker from "@/pages/Dashboard/components/DateRangePicker";
import SalesAnalyticsChart from "@/pages/Dashboard/components/SalesAnalyticsChart";

export default function DashboardHome() {
  // Range selector for analytics (7, 14, 30, 90, 180, 365)
  const [rangeDays, setRangeDays] = useState(30);

  // Fetch metrics (cached for 30s, abortable)
  const { data, loading, error } = useDashboardMetrics({
    range_days: rangeDays,
    low_stock_threshold: 5,
  });

  // Prepare series arrays (numbers only) for sparkline rendering
  const salesSeries = useMemo(
    () => (data?.series?.sales || []).map((s) => Number(s.total)),
    [data]
  );
  const purchasesSeries = useMemo(
    () => (data?.series?.purchases || []).map((s) => Number(s.total)),
    [data]
  );
  const movementSeries = useMemo(() => {
    const rows = data?.series?.movements || [];
    return {
      inValues: rows.map((r) => Number(r.in_qty)),
      outValues: rows.map((r) => Number(r.out_qty)),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <ContentSpinner fullwidth message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  // Define KPI cards (stable shape for memoization)
  const kpis = [
    {
      label: "Products",
      value: fmtNumber(data?.counts?.products),
      Icon: Package2,
      accentClass: "from-blue-500 to-indigo-500",
      to: ProductsRoute,
    },
    {
      label: "Users",
      value: fmtNumber(data?.counts?.users),
      Icon: Users,
      accentClass: "from-emerald-500 to-green-500",
      to: UsersRoute,
    },
    {
      label: "Sales",
      value: fmtCurrency(data?.financials?.total_sales_amount),
      Icon: TrendingUp,
      accentClass: "from-violet-500 to-purple-500",
      delta: data?.financials?.sales_deltas?.[`${rangeDays}d`] ?? data?.financials?.sales_delta_pct,
      to: SalesRoute,
    },
    {
      label: "Purchases",
      value: fmtCurrency(data?.financials?.total_purchases_amount),
      Icon: ShoppingBag,
      accentClass: "from-amber-500 to-orange-500",
      delta: data?.financials?.purchases_deltas?.[`${rangeDays}d`] ?? data?.financials?.purchases_delta_pct,
    },
    {
      label: "Profit",
      value: fmtCurrency(data?.financials?.simple_profit),
      Icon: TrendingUp,
      accentClass: "from-pink-500 to-rose-500",
      delta: data?.financials?.profit_deltas?.[`${rangeDays}d`],
    },
    {
      label: "Avg Order Value",
      value: fmtCurrency(data?.financials?.avg_order_value),
      Icon: Percent,
      accentClass: "from-cyan-500 to-sky-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Full snapshot of your inventory and sales performance over the last {rangeDays} days
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <DateRangePicker value={rangeDays} onChange={setRangeDays} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((k, idx) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <KpiCard {...k} />
          </motion.div>
        ))}
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard
          title={`Sales (last ${rangeDays}d)`}
          Icon={LineChart}
          subtitle={`Total: ${fmtCurrency(
            data?.financials?.total_sales_amount
          )}`}
        >
          <SparkLine values={salesSeries} color="#6366f1" />
        </SectionCard>
        <SectionCard
          title={`Purchases (last ${rangeDays}d)`}
          Icon={LineChart}
          subtitle={`Total: ${fmtCurrency(
            data?.financials?.total_purchases_amount
          )}`}
        >
          <SparkLine values={purchasesSeries} color="#10b981" />
        </SectionCard>
        <SalesAnalyticsChart 
          salesSeries={salesSeries}
          data={data}
          rangeDays={rangeDays}
        />
      </div>

      {/* Stock Value, Top Sellers, Stock Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StockValue
          retail={data?.financials?.retail_stock_value}
          cost={data?.financials?.cost_stock_value}
        />
        <div className="lg:col-span-2">
          <TopSellingTable rows={data?.top_selling || []} />
        </div>
      </div>

      {/* Stock Movement Visualization */}
      <StockMovement rows={data?.series?.movements || []} />

      {/* Low Stock & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockList products={data?.low_stock || []} />
        <CategoryDistribution rows={data?.category_distribution || []} />
      </div>
    </div>
  );
}
