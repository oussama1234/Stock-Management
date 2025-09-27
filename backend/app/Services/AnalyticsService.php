<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Support\CacheHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Get comprehensive dashboard metrics with proper revenue calculations
     */
    public function getDashboardMetrics(int $rangeDays = 30, int $lowStockThreshold = 5): array
    {
        $cacheKey = CacheHelper::key('analytics_service', 'dashboard_metrics', [
            'range_days' => $rangeDays,
            'low_stock_threshold' => $lowStockThreshold,
        ]);
        $ttl = CacheHelper::ttlSeconds('DASHBOARD_METRICS_TTL', 10); // Reduced from 60 to 10 seconds for real-time updates

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($rangeDays, $lowStockThreshold) {
            $now = Carbon::now();
            $from = $now->copy()->subDays($rangeDays)->startOfDay();
            $prevFrom = $now->copy()->subDays($rangeDays * 2)->startOfDay();
            $prevTo = $from->copy()->subSecond();

            // Core counts using dedicated methods
            $entityCounts = $this->getEntityCounts();
            $transactionCounts = $this->getTransactionCounts($from);
            $counts = array_merge($entityCounts, $transactionCounts);

            // Financial metrics with PROPER revenue calculations
            $financials = $this->getFinancialMetrics($from, $now, $prevFrom, $prevTo, $rangeDays);

            // Series data
            $series = $this->getTimeSeriesData($from);

            // Top selling products with CORRECTED revenue calculation
            $topSelling = $this->getTopSellingProducts($from, 5);

            // Low stock analysis
            $lowStock = $this->getLowStockAnalysis($from, $lowStockThreshold, $rangeDays);

            // Stock value calculations (include low/out/in stock counts)
            $stockValues = $this->getStockValueMetrics($lowStockThreshold);

            // Category distribution
            $categoryDistribution = $this->getCategoryDistribution($from);

            // Delta calculations for multiple time periods
            $deltas = $this->calculateDeltas($now);

            return [
                'meta' => [
                    'range_days' => $rangeDays,
                    'generated_at' => $now->toIso8601String(),
                ],
                'counts' => $counts,
                'financials' => array_merge($financials, $stockValues, $deltas),
                'series' => $series,
                'top_selling' => $topSelling,
                'low_stock' => $lowStock,
                'category_distribution' => $categoryDistribution,
            ];
        });
    }

    /**
     * Get financial metrics with PROPER revenue calculations
     */
    private function getFinancialMetrics(Carbon $from, Carbon $now, Carbon $prevFrom, Carbon $prevTo, int $rangeDays): array
    {
        // CORRECT: Use Sale.total_amount which includes tax/discount
        $totalSalesAmount = (float) Sale::where('sale_date', '>=', $from)->sum('total_amount');
        $totalPurchasesAmount = (float) Purchase::where('purchase_date', '>=', $from)->sum('total_amount');
        $avgOrderValue = (float) Sale::where('sale_date', '>=', $from)->avg('total_amount');

        // CORRECT: Calculate revenue using Sale.total_amount
        $grossSaleRevenue = $totalSalesAmount; // This already includes tax/discount

        // Previous period comparisons
        $salesCurrent = (float) Sale::whereBetween('sale_date', [$from, $now])->sum('total_amount');
        $salesPrev = (float) Sale::whereBetween('sale_date', [$prevFrom, $prevTo])->sum('total_amount');
        $purchasesCurrent = (float) Purchase::whereBetween('purchase_date', [$from, $now])->sum('total_amount');
        $purchasesPrev = (float) Purchase::whereBetween('purchase_date', [$prevFrom, $prevTo])->sum('total_amount');

        // Simple profit calculation
        $simpleProfit = $totalSalesAmount - $totalPurchasesAmount;

        // Advanced profit calculation with COGS
        $approxCOGS = $this->calculateCOGS($from);
        $approxProfit = $grossSaleRevenue - $approxCOGS;

        $delta = function (float $current, float $prev) {
            if ($prev == 0.0) {
                return $current > 0 ? 100.0 : 0.0;
            }
            return (($current - $prev) / $prev) * 100.0;
        };

        return [
            'total_sales_amount' => round($totalSalesAmount, 2),
            'total_purchases_amount' => round($totalPurchasesAmount, 2),
            'avg_order_value' => round($avgOrderValue, 2),
            'gross_revenue' => round($grossSaleRevenue, 2),
            'approx_cogs' => round($approxCOGS, 2),
            'approx_profit' => round($approxProfit, 2),
            'simple_profit' => round($simpleProfit, 2),
            'sales_delta_pct' => round($delta($salesCurrent, $salesPrev), 2),
            'purchases_delta_pct' => round($delta($purchasesCurrent, $purchasesPrev), 2),
        ];
    }

    /**
     * Calculate Cost of Goods Sold (COGS) with weighted averages
     */
    private function calculateCOGS(Carbon $from): float
    {
        // Get weighted average purchase prices per product
        $avgPurchasePrices = DB::table('purchase_items')
            ->select(
                'product_id',
                DB::raw('SUM(quantity * price) / SUM(quantity) as weighted_avg_price')
            )
            ->groupBy('product_id')
            ->pluck('weighted_avg_price', 'product_id');

        // Get sold quantities by product in the period
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
                $product = Product::find($productId);
                $avg = $product ? $product->price * 0.7 : 0;
            }
            $approxCOGS += ((int) $qty) * $avg;
        }

        return $approxCOGS;
    }

    /**
     * Get top selling products with CORRECTED revenue calculation
     */
    public function getTopSellingProducts(Carbon $from, int $limit = 10): array
    {
        $cacheKey = CacheHelper::key('analytics_service', 'top_selling', [
            'from' => $from->format('Y-m-d'),
            'limit' => $limit,
        ]);
        $ttl = CacheHelper::ttlSeconds('TOP_SELLING_TTL', 300);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($from, $limit) {
            // CORRECT: Calculate revenue using proportional share of sale total_amount
            $results = SaleItem::query()
                ->select([
                    'sale_items.product_id',
                    'products.name as product_name',
                    'products.image as product_image', 
                    'products.price as product_price',
                    'products.stock as product_stock',
                    DB::raw('SUM(sale_items.quantity) as qty'),
                    // CORRECTED: Calculate revenue based on proportional share of actual sale total_amount
                    DB::raw('SUM(
                        CASE 
                            WHEN sales.total_amount > 0 THEN 
                                (sale_items.quantity * sale_items.price) / 
                                (SELECT SUM(si.quantity * si.price) FROM sale_items si WHERE si.sale_id = sales.id) * 
                                sales.total_amount
                            ELSE sale_items.quantity * sale_items.price
                        END
                    ) as revenue'),
                ])
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sales.sale_date', '>=', $from)
                ->groupBy('sale_items.product_id', 'products.name', 'products.image', 'products.price', 'products.stock')
                ->orderByDesc('qty')
                ->limit($limit)
                ->get();
            
            return $results->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'qty' => $item->qty,
                    'revenue' => $item->revenue,
                    'product' => [
                        'id' => $item->product_id,
                        'name' => $item->product_name,
                        'image' => $item->product_image,
                        'price' => $item->product_price,
                        'stock' => $item->product_stock,
                    ]
                ];
            })->toArray();
        });
    }

    /**
     * Get sales overview analytics
     */
    public function getSalesOverview(int $period = 30): array
    {
        $startDate = Carbon::now()->subDays($period)->startOfDay();

        $key = CacheHelper::key('analytics_service', 'sales_overview', ['period' => $period]);
        $ttl = CacheHelper::ttlSeconds('SALES_OVERVIEW_TTL', 300);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate) {
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
    }

    /**
     * Get sales trends with proper revenue calculations
     */
    public function getSalesTrends(int $period = 30, string $interval = 'day'): array
    {
        $startDate = Carbon::now()->subDays($period)->startOfDay();

        $key = CacheHelper::key('analytics_service', 'sales_trends', [
            'period' => $period,
            'interval' => $interval,
        ]);
        $ttl = CacheHelper::ttlSeconds('SALES_TRENDS_TTL', 300);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate, $interval) {
            $dateFormat = match ($interval) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d',
            };

            return Sale::where('sale_date', '>=', $startDate)
                ->select([
                    DB::raw("DATE_FORMAT(sale_date, '$dateFormat') as period"),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total_amount) as revenue'), // CORRECT: Uses actual sale amount
                    DB::raw('AVG(total_amount) as avg_order_value'),
                ])
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->toArray();
        });
    }

    /**
     * Get top selling products for sales analytics with CORRECTED calculation
     */
    public function getSalesTopProducts(int $period = 30, int $limit = 10): array
    {
        $startDate = Carbon::now()->subDays($period)->startOfDay();

        $key = CacheHelper::key('analytics_service', 'sales_top_products', [
            'period' => $period,
            'limit' => $limit,
        ]);
        $ttl = CacheHelper::ttlSeconds('SALES_TOP_PRODUCTS_TTL', 300);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate, $limit) {
            $results = SaleItem::query()
                ->select([
                    'sale_items.product_id',
                    'products.name as product_name',
                    'products.image as product_image',
                    'products.stock as product_stock',
                    'products.category_id as category_id',
                    'categories.name as category_name',
                    DB::raw('SUM(sale_items.quantity) as total_quantity'),
                    // CORRECTED: Use proportional revenue calculation
                    DB::raw('SUM(
                        CASE 
                            WHEN sales.total_amount > 0 THEN 
                                (sale_items.quantity * sale_items.price) / 
                                (SELECT SUM(si.quantity * si.price) FROM sale_items si WHERE si.sale_id = sales.id) * 
                                sales.total_amount
                            ELSE sale_items.quantity * sale_items.price
                        END
                    ) as total_revenue'),
                    DB::raw('COUNT(DISTINCT sale_items.sale_id) as times_sold'),
                    DB::raw('AVG(sale_items.price) as avg_price'),
                ])
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->where('sales.sale_date', '>=', $startDate)
                ->groupBy('sale_items.product_id', 'products.name', 'products.image', 'products.stock', 'products.category_id', 'categories.name')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->get();
                
            return $results->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'total_quantity' => $item->total_quantity,
                    'total_revenue' => $item->total_revenue,
                    'times_sold' => $item->times_sold,
                    'avg_price' => $item->avg_price,
                    'product' => [
                        'id' => $item->product_id,
                        'name' => $item->product_name,
                        'category_id' => $item->category_id,
                        'image' => $item->product_image,
                        'stock' => $item->product_stock,
                        'category' => [
                            'id' => $item->category_id,
                            'name' => $item->category_name,
                        ]
                    ]
                ];
            })->toArray();
        });
    }

    /**
     * Get purchases analytics overview
     */
    public function getPurchasesOverview(int $rangeDays = 30): array
    {
        $dateFrom = Carbon::now()->subDays($rangeDays)->startOfDay();
        $dateTo = Carbon::now()->endOfDay();

        $key = CacheHelper::key('analytics_service', 'purchases_overview', [
            'range_days' => $rangeDays,
        ]);
        $ttl = CacheHelper::ttlSeconds('PURCHASES_OVERVIEW_TTL', 300);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo, $rangeDays) {
            $totalPurchases = Purchase::whereBetween('purchase_date', [$dateFrom, $dateTo])->count();
            $totalAmount = Purchase::whereBetween('purchase_date', [$dateFrom, $dateTo])->sum('total_amount');
            $avgOrderValue = $totalPurchases > 0 ? $totalAmount / $totalPurchases : 0;

            // Previous period comparison
            $prevDateFrom = $dateFrom->copy()->subDays($rangeDays);
            $prevDateTo = $dateFrom->copy()->subDay();
            $prevTotalPurchases = Purchase::whereBetween('purchase_date', [$prevDateFrom, $prevDateTo])->count();
            $prevTotalAmount = Purchase::whereBetween('purchase_date', [$prevDateFrom, $prevDateTo])->sum('total_amount');

            $purchasesGrowth = $prevTotalPurchases > 0 ? (($totalPurchases - $prevTotalPurchases) / $prevTotalPurchases) * 100 : 0;
            $amountGrowth = $prevTotalAmount > 0 ? (($totalAmount - $prevTotalAmount) / $prevTotalAmount) * 100 : 0;

            return [
                'summary' => [
                    'total_purchases' => $totalPurchases,
                    'total_amount' => (float) $totalAmount,
                    'avg_order_value' => (float) $avgOrderValue,
                    'purchases_growth' => (float) $purchasesGrowth,
                    'amount_growth' => (float) $amountGrowth,
                ],
            ];
        });
    }

    /**
     * Get low stock analysis with velocity
     */
    private function getLowStockAnalysis(Carbon $from, int $threshold, int $rangeDays): array
    {
        return Product::query()
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
            ->where('products.stock', '<=', $threshold)
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
            ->get()
            ->toArray();
    }

    /**
     * Get stock value metrics
     */
    private function getStockValueMetrics(int $lowStockThreshold = 10): array
    {
        // Fetch only needed columns
        $productsPositive = Product::select('id', 'stock', 'price')
            ->where('stock', '>', 0)
            ->get();

        $retailStockValue = (float) $productsPositive->sum(function ($product) {
            return $product->stock * $product->price;
        });

        $avgPurchasePrices = DB::table('purchase_items')
            ->select(
                'product_id',
                DB::raw('SUM(quantity * price) / SUM(quantity) as weighted_avg_price')
            )
            ->groupBy('product_id')
            ->pluck('weighted_avg_price', 'product_id');

        $costStockValue = (float) $productsPositive->sum(function ($product) use ($avgPurchasePrices) {
            $avgPurchasePrice = (float) ($avgPurchasePrices[$product->id] ?? 0);
            
            if ($avgPurchasePrice == 0) {
                $avgPurchasePrice = $product->price * 0.7;
            }
            
            return $product->stock * $avgPurchasePrice;
        });

        $potentialProfit = $retailStockValue - $costStockValue;
        $profitMarginPercent = $retailStockValue > 0 ? (($potentialProfit / $retailStockValue) * 100) : 0;

        // Global stock level counts
        $outOfStockCount = (int) Product::where('stock', '=', 0)->count();
        $lowStockCount = (int) Product::where('stock', '>', 0)->where('stock', '<=', $lowStockThreshold)->count();
        $inStockCount = (int) Product::where('stock', '>', $lowStockThreshold)->count();
        $totalProducts = (int) Product::count();

        return [
            'retail_stock_value' => round($retailStockValue, 2),
            'cost_stock_value' => round($costStockValue, 2),
            'potential_profit' => round($potentialProfit, 2),
            'profit_margin_percent' => round($profitMarginPercent, 2),
            'stock_products_count' => $productsPositive->count(),
            'total_products_count' => $totalProducts,
            'out_of_stock_count' => $outOfStockCount,
            'low_stock_count' => $lowStockCount,
            'in_stock_count' => $inStockCount,
        ];
    }

    /**
     * Get time series data
     */
    private function getTimeSeriesData(Carbon $from): array
    {
        $salesSeries = Sale::selectRaw("DATE(sale_date) as date, SUM(total_amount) as total")
            ->where('sale_date', '>=', $from)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();

        $purchaseSeries = Purchase::selectRaw("DATE(purchase_date) as date, SUM(total_amount) as total")
            ->where('purchase_date', '>=', $from)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();

        $movementSeries = StockMovement::selectRaw(
            "DATE(movement_date) as date,
             SUM(CASE WHEN type='in' THEN quantity ELSE 0 END) as in_qty,
             SUM(CASE WHEN type='out' THEN quantity ELSE 0 END) as out_qty"
        )
            ->where('movement_date', '>=', $from)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();

        return [
            'sales' => $salesSeries,
            'purchases' => $purchaseSeries,
            'movements' => $movementSeries,
        ];
    }

    /**
     * Get category distribution
     */
    private function getCategoryDistribution(Carbon $from): array
    {
        return DB::table('sale_items as si')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->join('categories as c', 'c.id', '=', 'p.category_id')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->where('s.sale_date', '>=', $from)
            ->selectRaw('c.name as category, SUM(si.quantity) as qty')
            ->groupBy('c.name')
            ->orderByDesc('qty')
            ->get()
            ->toArray();
    }

    /**
     * Get basic entity counts for dashboard
     */
    public function getEntityCounts(): array
    {
        $key = CacheHelper::key('analytics_service', 'entity_counts');
        $ttl = CacheHelper::ttlSeconds('ENTITY_COUNTS_TTL', 300);

        return Cache::remember($key, now()->addSeconds($ttl), function () {
            return [
                'products' => Product::count(),
                'categories' => Category::count(),
                'suppliers' => Supplier::count(),
                'users' => User::count(),
            ];
        });
    }

    /**
     * Get sales and purchases counts for a specific date range
     */
    public function getTransactionCounts(Carbon $from): array
    {
        return [
            'sales' => Sale::where('sale_date', '>=', $from)->count(),
            'purchases' => Purchase::where('purchase_date', '>=', $from)->count(),
            'unique_customers' => Sale::where('sale_date', '>=', $from)
                ->whereNotNull('customer_name')
                ->distinct('customer_name')
                ->count('customer_name'),
        ];
    }

    /**
     * Get low stock alerts with velocity analysis
     */
    public function getLowStockAlerts(int $days = 30, int $threshold = 10): array
    {
        $from = Carbon::now()->subDays($days)->startOfDay();
        
        $key = CacheHelper::key('analytics_service', 'low_stock_alerts', [
            'days' => $days,
            'threshold' => $threshold,
        ]);
        $ttl = CacheHelper::ttlSeconds('LOW_STOCK_ALERTS_TTL', 600);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($from, $threshold, $days) {
            return $this->getLowStockAnalysis($from, $threshold, $days);
        });
    }

    /**
     * Calculate deltas for multiple time periods
     */
    private function calculateDeltas(Carbon $now): array
    {
        $timeRanges = [7, 14, 30, 90, 180, 365];
        $salesDeltas = [];
        $purchasesDeltas = [];
        $profitDeltas = [];

        $delta = function (float $current, float $prev) {
            if ($prev == 0.0) {
                return $current > 0 ? 100.0 : 0.0;
            }
            return (($current - $prev) / $prev) * 100.0;
        };

        foreach ($timeRanges as $days) {
            $currentFrom = $now->copy()->subDays($days)->startOfDay();
            $prevFrom = $now->copy()->subDays($days * 2)->startOfDay();
            $prevTo = $currentFrom->copy()->subSecond();

            $salesCur = (float) Sale::whereBetween('sale_date', [$currentFrom, $now])->sum('total_amount');
            $salesPrevPeriod = (float) Sale::whereBetween('sale_date', [$prevFrom, $prevTo])->sum('total_amount');

            $purchasesCur = (float) Purchase::whereBetween('purchase_date', [$currentFrom, $now])->sum('total_amount');
            $purchasesPrevPeriod = (float) Purchase::whereBetween('purchase_date', [$prevFrom, $prevTo])->sum('total_amount');

            $profitCur = $salesCur - $purchasesCur;
            $profitPrevPeriod = $salesPrevPeriod - $purchasesPrevPeriod;

            $salesDeltas["{$days}d"] = round($delta($salesCur, $salesPrevPeriod), 2);
            $purchasesDeltas["{$days}d"] = round($delta($purchasesCur, $purchasesPrevPeriod), 2);
            $profitDeltas["{$days}d"] = round($delta($profitCur, $profitPrevPeriod), 2);
        }

        return [
            'sales_deltas' => $salesDeltas,
            'purchases_deltas' => $purchasesDeltas,
            'profit_deltas' => $profitDeltas,
        ];
    }
}