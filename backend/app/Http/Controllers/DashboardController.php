<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Support\CacheHelper; // Centralized cache keys & TTLs
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        $rangeDays = (int) $request->input('range_days', 30);
        $lowStockThreshold = (int) $request->input('low_stock_threshold', 5);

        // Cache key includes the range and low stock threshold
        $cacheKey = CacheHelper::key('dashboard_metrics', 'summary', [
            'range_days' => $rangeDays,
            'low_stock_threshold' => $lowStockThreshold,
        ]);
        $ttl = CacheHelper::ttlSeconds('DASHBOARD_METRICS_TTL', 60);

        $result = Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($rangeDays, $lowStockThreshold) {
            $now = Carbon::now();
            $from = $now->copy()->subDays($rangeDays)->startOfDay();
            $prevFrom = $now->copy()->subDays($rangeDays * 2)->startOfDay();
            $prevTo = $from->copy()->subSecond();

            // Core counts
            $totalProducts = Product::count();
            $totalCategories = Category::count();
            $totalSuppliers = Supplier::count();
            $totalUsers = User::count();

            // Sales & purchases aggregates (filtered by date range)
            $totalSalesAmount = (float) (Sale::where('sale_date', '>=', $from)->sum('total_amount') ?? 0);
            $salesCount = (int) Sale::where('sale_date', '>=', $from)->count();
            $avgOrderValue = (float) (Sale::where('sale_date', '>=', $from)->avg('total_amount') ?? 0);

            $totalPurchasesAmount = (float) (Purchase::where('purchase_date', '>=', $from)->sum('total_amount') ?? 0);
            $purchasesCount = (int) Purchase::where('purchase_date', '>=', $from)->count();

            // Series (last N days)
            $salesSeries = Sale::selectRaw("DATE(sale_date) as date, SUM(total_amount) as total")
                ->where('sale_date', '>=', $from)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $purchaseSeries = Purchase::selectRaw("DATE(purchase_date) as date, SUM(total_amount) as total")
                ->where('purchase_date', '>=', $from)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Stock movements series (last N days)
            $movementSeries = StockMovement::selectRaw(
                "DATE(movement_date) as date,\n             SUM(CASE WHEN type='in' THEN quantity ELSE 0 END) as in_qty,\n             SUM(CASE WHEN type='out' THEN quantity ELSE 0 END) as out_qty"
            )
                ->where('movement_date', '>=', $from)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Top selling products (by qty) last N days
            $topSelling = SaleItem::selectRaw('product_id, SUM(quantity) as qty, SUM(quantity * price) as revenue')
                ->whereHas('sale', function ($q) use ($from) {
                    $q->where('sale_date', '>=', $from);
                })
                ->groupBy('product_id')
                ->orderByDesc('qty')
                ->with(['product:id,name,image,price,stock'])
                ->limit(5)
                ->get();

            // Enhanced Low stock products with velocity analysis
            $lowStock = Product::query()
                ->select([
                    'products.id',
                    'products.name',
                    'products.stock',
                    'products.price',
                    'products.image',
                    'categories.name as category_name',
                    DB::raw('COALESCE(SUM(sale_items.quantity), 0) as sold_quantity'),
                    DB::raw('COALESCE(SUM(sale_items.quantity), 0) / ' . $rangeDays . ' as daily_velocity'),
                    DB::raw('CASE WHEN COALESCE(SUM(sale_items.quantity), 0) = 0 THEN 9999 ELSE products.stock / (COALESCE(SUM(sale_items.quantity), 0) / ' . $rangeDays . ') END as days_remaining'),
                ])
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->leftJoin('sale_items', function ($join) use ($from) {
                    $join->on('products.id', '=', 'sale_items.product_id')
                         ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                         ->where('sales.sale_date', '>=', $from);
                })
                ->where('products.stock', '<=', $lowStockThreshold)
                ->groupBy([
                    'products.id', 
                    'products.name', 
                    'products.stock', 
                    'products.price',
                    'products.image',
                    'categories.name'
                ])
                ->orderBy('products.stock')
                ->limit(10)
                ->get();

            // Accurate Stock Value Calculations
            // 1. Get all products with current stock levels
            $products = Product::select('id', 'stock', 'price')
                ->where('stock', '>', 0) // Only include products with stock
                ->get();

            // 2. Calculate Retail Value: Sum(Quantity in Stock × Selling Price)
            $retailStockValue = (float) $products->sum(function ($product) {
                return $product->stock * $product->price;
            });

            // 3. Calculate Average Purchase Price per Product
            // Using weighted average based on purchase quantities for accuracy
            $avgPurchasePrices = DB::table('purchase_items')
                ->select(
                    'product_id',
                    DB::raw('SUM(quantity * price) / SUM(quantity) as weighted_avg_price')
                )
                ->groupBy('product_id')
                ->pluck('weighted_avg_price', 'product_id');

            // 4. Calculate Cost Value: Sum(Quantity in Stock × Average Purchase Price)
            $costStockValue = (float) $products->sum(function ($product) use ($avgPurchasePrices) {
                $avgPurchasePrice = (float) ($avgPurchasePrices[$product->id] ?? 0);
                
                // If no purchase history, estimate cost as 70% of retail price
                if ($avgPurchasePrice == 0) {
                    $avgPurchasePrice = $product->price * 0.7;
                }
                
                return $product->stock * $avgPurchasePrice;
            });

            // 5. Calculate potential profit margin
            $potentialProfit = $retailStockValue - $costStockValue;
            $profitMarginPercent = $retailStockValue > 0 ? (($potentialProfit / $retailStockValue) * 100) : 0;

            // Revenue and simplified profit calculation (filtered by date range)
            $grossSaleRevenue = (float) (SaleItem::whereHas('sale', function ($q) use ($from) {
                $q->where('sale_date', '>=', $from);
            })->select(DB::raw('SUM(quantity * price) as gross'))->value('gross') ?? 0);

            // Simplified profit: Total sales amount - Total purchases amount (both filtered)
            $simpleProfit = $totalSalesAmount - $totalPurchasesAmount;

            // Keep COGS calculation for reference but use simple profit as primary metric (filtered by date range)
            $soldQtyByProduct = SaleItem::whereHas('sale', function ($q) use ($from) {
                $q->where('sale_date', '>=', $from);
            })->selectRaw('product_id, SUM(quantity) as qty')
                ->groupBy('product_id')
                ->pluck('qty', 'product_id');

            $approxCOGS = 0.0;
            foreach ($soldQtyByProduct as $productId => $qty) {
                $avg = (float) ($avgPurchasePrices[$productId] ?? 0);
                // If no purchase history, estimate cost as 70% of retail price
                if ($avg == 0) {
                    $product = $products->where('id', $productId)->first();
                    $avg = $product ? $product->price * 0.7 : 0;
                }
                $approxCOGS += ((int) $qty) * $avg;
            }
            $approxProfit = $grossSaleRevenue - $approxCOGS;

            // Category distribution by sold qty (last N days)
            $categoryDistribution = DB::table('sale_items as si')
                ->join('products as p', 'p.id', '=', 'si.product_id')
                ->join('categories as c', 'c.id', '=', 'p.category_id')
                ->join('sales as s', 's.id', '=', 'si.sale_id')
                ->where('s.sale_date', '>=', $from)
                ->selectRaw('c.name as category, SUM(si.quantity) as qty')
                ->groupBy('c.name')
                ->orderByDesc('qty')
                ->get();

            // Period deltas - multiple time ranges
            $salesCurrent = (float) (Sale::whereBetween('sale_date', [$from, $now])->sum('total_amount') ?? 0);
            $salesPrev = (float) (Sale::whereBetween('sale_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

            $purchasesCurrent = (float) (Purchase::whereBetween('purchase_date', [$from, $now])->sum('total_amount') ?? 0);
            $purchasesPrev = (float) (Purchase::whereBetween('purchase_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

            $delta = function (float $current, float $prev) {
                if ($prev == 0.0) {
                    return $current > 0 ? 100.0 : 0.0;
                }
                return (($current - $prev) / $prev) * 100.0;
            };

            // Calculate deltas for multiple time periods (7d, 14d, 30d, 90d, 180d, 365d)
            $timeRanges = [7, 14, 30, 90, 180, 365];
            $salesDeltas = [];
            $purchasesDeltas = [];
            $profitDeltas = [];

            foreach ($timeRanges as $days) {
                $currentFrom = $now->copy()->subDays($days)->startOfDay();
                $prevFrom = $now->copy()->subDays($days * 2)->startOfDay();
                $prevTo = $currentFrom->copy()->subSecond();

                $salesCur = (float) (Sale::whereBetween('sale_date', [$currentFrom, $now])->sum('total_amount') ?? 0);
                $salesPrevPeriod = (float) (Sale::whereBetween('sale_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

                $purchasesCur = (float) (Purchase::whereBetween('purchase_date', [$currentFrom, $now])->sum('total_amount') ?? 0);
                $purchasesPrevPeriod = (float) (Purchase::whereBetween('purchase_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

                $profitCur = $salesCur - $purchasesCur;
                $profitPrevPeriod = $salesPrevPeriod - $purchasesPrevPeriod;

                $salesDeltas["{$days}d"] = round($delta($salesCur, $salesPrevPeriod), 2);
                $purchasesDeltas["{$days}d"] = round($delta($purchasesCur, $purchasesPrevPeriod), 2);
                $profitDeltas["{$days}d"] = round($delta($profitCur, $profitPrevPeriod), 2);
            }

            $uniqueCustomers = (int) Sale::where('sale_date', '>=', $from)
                ->whereNotNull('customer_name')
                ->distinct('customer_name')
                ->count('customer_name');

            return [
                'meta' => [
                    'range_days' => $rangeDays,
                    'generated_at' => $now->toIso8601String(),
                ],
                'counts' => [
                    'products' => $totalProducts,
                    'categories' => $totalCategories,
                    'suppliers' => $totalSuppliers,
                    'users' => $totalUsers,
                    'sales' => $salesCount,
                    'purchases' => $purchasesCount,
                    'unique_customers' => $uniqueCustomers,
                ],
                'financials' => [
                    'total_sales_amount' => round($totalSalesAmount, 2),
                    'total_purchases_amount' => round($totalPurchasesAmount, 2),
                    'avg_order_value' => round($avgOrderValue, 2),
                    'gross_revenue' => round($grossSaleRevenue, 2),
                    'approx_cogs' => round($approxCOGS, 2),
                    'approx_profit' => round($approxProfit, 2),
                    'simple_profit' => round($simpleProfit, 2),
                    
                    // Enhanced Stock Value Metrics
                    'retail_stock_value' => round($retailStockValue, 2),
                    'cost_stock_value' => round($costStockValue, 2),
                    'potential_profit' => round($potentialProfit, 2),
                    'profit_margin_percent' => round($profitMarginPercent, 2),
                    'stock_products_count' => $products->count(),
                    
                    'sales_delta_pct' => round($delta($salesCurrent, $salesPrev), 2),
                    'purchases_delta_pct' => round($delta($purchasesCurrent, $purchasesPrev), 2),
                    'sales_deltas' => $salesDeltas,
                    'purchases_deltas' => $purchasesDeltas,
                    'profit_deltas' => $profitDeltas,
                ],
                'series' => [
                    'sales' => $salesSeries,
                    'purchases' => $purchaseSeries,
                    'movements' => $movementSeries,
                ],
                'top_selling' => $topSelling,
                'low_stock' => $lowStock,
                'category_distribution' => $categoryDistribution,
            ];
        });

        return response()->json($result);
    }

    /**
     * Get accurate sales overview using the same method as SalesAnalyticsController
     * This ensures consistency with the sales analytics page
     */
    public function salesOverview(Request $request)
    {
        $period = $request->input('period', '30'); // days
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('dashboard_sales', 'overview', ['period' => $period]);
        $ttl = CacheHelper::ttlSeconds('DASHBOARD_SALES_TTL', 300); // 5 minutes

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate) {
            return [
                'total_sales' => Sale::where('sale_date', '>=', $startDate)->sum('total_amount'),
                'total_orders' => Sale::where('sale_date', '>=', $startDate)->count(),
                'average_order_value' => Sale::where('sale_date', '>=', $startDate)->avg('total_amount'),
                'total_items_sold' => SaleItem::whereHas('sale', function ($q) use ($startDate) {
                    $q->where('sale_date', '>=', $startDate);
                })->sum('quantity'),
                'unique_customers' => Sale::where('sale_date', '>=', $startDate)
                    ->whereNotNull('customer_name')
                    ->distinct('customer_name')
                    ->count(),
            ];
        });

        return response()->json($data);
    }

    /**
     * Get accurate sales trends using the same method as SalesAnalyticsController
     */
    public function salesTrends(Request $request)
    {
        $period = $request->input('period', '30'); // days
        $interval = $request->input('interval', 'day'); // day, week, month
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('dashboard_sales', 'trends', [
            'period' => $period,
            'interval' => $interval,
        ]);
        $ttl = CacheHelper::ttlSeconds('DASHBOARD_SALES_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate, $interval) {
            $dateFormat = match ($interval) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d',
            };

            return Sale::where('sale_date', '>=', $startDate)
                ->select([
                    DB::raw("DATE_FORMAT(sale_date, '$dateFormat') as period"),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total_amount) as revenue'),
                    DB::raw('AVG(total_amount) as avg_order_value'),
                ])
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Get low stock alerts with sales velocity analysis (same as SalesAnalyticsController)
     * This ensures consistency with the sales analytics page
     */
    public function lowStockAlerts(Request $request)
    {
        $days = min(90, max(7, (int) $request->input('days', 30)));
        $threshold = max(0, (int) $request->input('threshold', 10));

        $key = CacheHelper::key('dashboard', 'low_stock_alerts', [
            'days' => $days,
            'threshold' => $threshold,
        ]);
        $ttl = CacheHelper::ttlSeconds('DASHBOARD_LOW_STOCK_TTL', 600); // 10 minutes

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($days, $threshold) {
            $startDate = Carbon::now()->subDays($days)->startOfDay();

            return Product::query()
                ->select([
                    'products.id',
                    'products.name',
                    'products.stock',
                    'products.price',
                    'products.image',
                    'categories.name as category_name',
                    DB::raw('COALESCE(SUM(sale_items.quantity), 0) as sold_quantity'),
                    DB::raw('COALESCE(SUM(sale_items.quantity), 0) / ' . $days . ' as daily_velocity'),
                    DB::raw('CASE WHEN COALESCE(SUM(sale_items.quantity), 0) = 0 THEN 9999 ELSE products.stock / (COALESCE(SUM(sale_items.quantity), 0) / ' . $days . ') END as days_remaining'),
                ])
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->leftJoin('sale_items', function ($join) use ($startDate) {
                    $join->on('products.id', '=', 'sale_items.product_id')
                         ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                         ->where('sales.sale_date', '>=', $startDate);
                })
                ->where('products.stock', '<=', $threshold)
                ->groupBy([
                    'products.id', 
                    'products.name', 
                    'products.stock', 
                    'products.price',
                    'products.image',
                    'categories.name'
                ])
                ->having('daily_velocity', '>', 0)
                ->orderBy('days_remaining')
                ->limit(50)
                ->get();
        });

        return response()->json($data);
    }
}
